#!/usr/bin/env node
import { readFileSync, writeFileSync, renameSync, existsSync, accessSync, constants } from 'node:fs';
import { join, resolve, delimiter } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { prepareInstallation } from './setup.mjs';
import { verifyLive } from './verify-live.mjs';

const DEFAULT_HOME=join(homedir(),'Library','Application Support','Saras30');
const SOURCE=resolve(import.meta.dirname,'..');
const MARKER='// Filled by start-mac-mini.sh';
const PORTS=[443,8443,10000];
const record=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const readJSON=path=>JSON.parse(readFileSync(path,'utf8'));
function writeAtomic(path,contents,mode=0o600) {
  const temp=`${path}.new-${process.pid}`;
  writeFileSync(temp,contents,{mode,flag:'wx'}); renameSync(temp,path);
}
function command(binary,args,{interactive=false}={}) {
  const result=spawnSync(binary,args,{encoding:'utf8',stdio:interactive?'inherit':'pipe',timeout:interactive?0:15000,maxBuffer:4*1024*1024});
  if (result.status!==0) throw new Error(`Could not run ${binary} ${args.slice(0,2).join(' ')}. ${interactive?'Finish any Tailscale permission prompt, then rerun this setup.':(result.stderr || result.error?.message || '').trim()}`);
  return result.stdout || '';
}
function executable(path) { try { accessSync(path,constants.X_OK); return true; } catch { return false; } }
export function findTailscale() {
  const candidates=[process.env.TAILSCALE_BIN,...(process.env.PATH || '').split(delimiter).filter(Boolean).map(dir=>join(dir,'tailscale')),'/Applications/Tailscale.app/Contents/MacOS/Tailscale','/opt/homebrew/bin/tailscale','/usr/local/bin/tailscale'].filter(Boolean);
  const found=candidates.find(executable);
  if (!found) throw new Error('Tailscale CLI was not found. Open the installed Tailscale app, or set TAILSCALE_BIN to its executable and rerun.');
  return found;
}
export function tailscaleHostname(status) {
  if (status?.BackendState!=='Running' || status?.Self?.Online===false) throw new Error('Open Tailscale on this Mac and connect it to your existing account, then rerun.');
  const name=String(status.Self?.DNSName || '').replace(/\.$/,'').toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.ts\.net$/.test(name)) throw new Error('Tailscale did not return this Mac’s full .ts.net hostname. Enable MagicDNS and rerun.');
  return name;
}
function configurations(value,depth=0) {
  if (value===null && depth===0) return [{}];
  if (!record(value) || depth>4) throw new Error('Unrecognized Tailscale Serve configuration; no routes were changed.');
  const keys=new Set(['TCP','Web','AllowFunnel','Foreground','Services','ETag']);
  if (Object.keys(value).some(key=>!keys.has(key))) throw new Error('Unrecognized Tailscale Serve configuration; no routes were changed.');
  for (const key of ['TCP','Web','AllowFunnel','Foreground','Services']) if (value[key] && !record(value[key])) throw new Error('Invalid Tailscale Serve configuration; no routes were changed.');
  return [value,...Object.values(value.Foreground || {}).flatMap(child=>configurations(child,depth+1))];
}
function usesPort(config,port) {
  return !!config.TCP?.[port] || ['Web','AllowFunnel'].some(key=>Object.keys(config[key] || {}).some(name=>name.endsWith(`:${port}`)));
}
function ownRoute(config,hostname,port,target) {
  const key=`${hostname}:${port}`, handler=config.Web?.[key]?.Handlers;
  const proxy=handler?.['/']?.Proxy?.replace(/\/$/,'');
  return config.TCP?.[port]?.HTTPS===true && !config.TCP[port].TCPForward && !config.TCP[port].HTTP &&
    record(handler) && Object.keys(handler).length===1 && Object.keys(handler['/']).length===1 && proxy===target &&
    Object.keys(config.Web || {}).filter(name=>name.endsWith(`:${port}`)).every(name=>name===key) &&
    Object.keys(config.AllowFunnel || {}).filter(name=>name.endsWith(`:${port}`)).every(name=>name===key);
}
export function planFunnel(config,hostname,localPort,requestedPort) {
  const all=configurations(config),target=`http://127.0.0.1:${localPort}`;
  if (requestedPort!==undefined && !PORTS.includes(requestedPort)) throw new Error('Funnel HTTPS port must be 443, 8443 or 10000.');
  const choices=requestedPort===undefined?PORTS:[requestedPort];
  // Reuse only our exact background route. A second private path on that port
  // would also become public, so it must never be promoted by this installer.
  const reuse=choices.find(port=>ownRoute(all[0],hostname,port,target) && !all.slice(1).some(item=>usesPort(item,port)));
  const port=reuse ?? choices.find(port=>!all.some(item=>usesPort(item,port)));
  if (!port) throw new Error('Tailscale’s available HTTPS ports are already used by other services. No existing route was changed. Choose a dedicated port after reviewing tailscale serve status.');
  return {port,target,hostname,origin:`https://${hostname}${port===443?'':`:${port}`}`,reused:reuse!==undefined};
}
export function assertPublicRoute(config,plan) {
  const all=configurations(config);
  if (!ownRoute(all[0],plan.hostname,plan.port,plan.target) || all.slice(1).some(item=>usesPort(item,plan.port)) || config?.AllowFunnel?.[`${plan.hostname}:${plan.port}`]!==true) throw new Error('Tailscale has not confirmed a public route to this invitation. The local service is available; finish enabling Funnel and rerun.');
}
export function hostingScript(origin) {
  const parsed=new URL(origin);
  if (parsed.origin!==origin || parsed.protocol!=='https:' || !parsed.hostname.endsWith('.ts.net')) throw new Error('Expected the verified Tailscale HTTPS origin.');
  return `${MARKER} after checking the Mac mini’s HTTPS submission flow.\n// Public URL only; guest replies, passwords and photos stay outside this repository.\n(() => {\n  const config = window.BIRTHDAY_CONFIG;\n  // The Mini already selects its own same-origin service. Preserve that and legacy demos.\n  if (config && !config.submissions?.provider && !config.submissions?.publishableKey) {\n    config.submissions = { provider: 'local', url: ${JSON.stringify(origin)} };\n  }\n})();\n`;
}
async function waitForLocal(origin,eventId) {
  for (let i=0;i<20;i++) {
    try {
      const response=await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(1000)});
      const value=await response.json();
      if (response.ok && value.service==='saras30-invitation' && value.eventId===eventId) return;
    } catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error('The installed invitation did not answer its local health check. Inspect the logs in the installation folder before enabling public access.');
}
export async function launch(options={},dependencies={}) {
  if (Number(process.versions.node.split('.')[0])<24) throw new Error('Node.js 24 or newer is required. Install it from https://nodejs.org/ and rerun.');
  if (process.platform!=='darwin' && !dependencies.install) throw new Error('Run this launcher on the Mac mini.');
  const source=resolve(options.source || SOURCE),installDir=resolve(options.installDir || DEFAULT_HOME);
  const run=dependencies.run || command,log=dependencies.log || console.log;
  const configPath=join(installDir,'data','config.json');
  const previous=existsSync(configPath)?readJSON(configPath):null;
  const manifestPath=join(installDir,'installation.json');
  const localPort=existsSync(manifestPath)?readJSON(manifestPath).port:49200;
  if (!Number.isInteger(localPort) || localPort<1024 || localPort>65535) throw new Error('Invalid installed service port.');
  const sourceText=readFileSync(join(source,'event-config.js'),'utf8');
  const eventId=sourceText.match(/"id"\s*:\s*"([a-z0-9_-]+)"/i)?.[1];
  if (!eventId || (previous && previous.eventId!==eventId)) throw new Error('The source event ID and installed event must match. Use a separate installation for another birthday.');
  let plan,binary;
  if (!options.localOnly) {
    binary=dependencies.tailscale || findTailscale();
    const hostname=tailscaleHostname(JSON.parse(run(binary,['status','--json'])));
    plan=planFunnel(JSON.parse(run(binary,['serve','status','--json'])),hostname,localPort,options.httpsPort);
    log(`Tailscale invitation address: ${plan.origin}`);
    log('Only the invitation web service will be published. Other Tailscale routes are preserved.');
    if (previous && !(previous.allowedOrigins || []).includes(plan.origin)) {
      previous.allowedOrigins=[...(previous.allowedOrigins || []),plan.origin];
      writeAtomic(configPath,JSON.stringify(previous,null,2)+'\n');
    }
  }
  log('Installing the service; existing replies, photos and login are preserved.');
  const install=await (dependencies.install || prepareInstallation)({source,'install-dir':installDir,'event-id':eventId,port:localPort,origins:previous?[]:(plan?[plan.origin]:[]),activate:true});
  const local=`http://127.0.0.1:${localPort}`;
  await (dependencies.waitForLocal || waitForLocal)(local,eventId);
  log(`Local organiser: ${local}/organiser/`);
  log(`Private organiser login: ${join(install.dataDir,'LOGIN.txt')}`);
  if (!plan) return {local,installDir};
  // Read again immediately before changing a route, in case another service started.
  const current=planFunnel(JSON.parse(run(binary,['serve','status','--json'])),plan.hostname,localPort,plan.port);
  if (current.port!==plan.port) throw new Error('Tailscale routing changed while installing. Rerun after checking its status.');
  log('Enabling persistent Tailscale Funnel. If Tailscale presents an approval link, complete it and rerun if needed.');
  run(binary,['funnel','--bg',`--https=${plan.port}`,plan.target],{interactive:true});
  assertPublicRoute(JSON.parse(run(binary,['funnel','status','--json'])),plan);
  const connection={origin:plan.origin,eventId,httpsPort:plan.port,verifiedAt:null};
  writeAtomic(join(installDir,'public-connection.json'),JSON.stringify(connection,null,2)+'\n');
  log('Checking HTTPS RSVP, story upload, photo download and organiser access with a disposable test.');
  try {
    await (dependencies.verify || verifyLive)({origin:plan.origin,dataDir:install.dataDir,eventId});
  } catch(error) {
    throw new Error(`The local installation is working, but its HTTPS submission check failed: ${error.message}\nTailscale DNS/certificates can take a few minutes. Rerun ./start-mac-mini.sh after they are ready. No GitHub Pages connection was written.`);
  }
  connection.verifiedAt=new Date().toISOString();
  writeAtomic(join(installDir,'public-connection.json'),JSON.stringify(connection,null,2)+'\n');
  const hostingPath=join(source,'hosting-config.js');
  if (!readFileSync(hostingPath,'utf8').startsWith(MARKER)) throw new Error('hosting-config.js has custom content. It was left unchanged. Use the direct Tailscale invitation link.');
  writeAtomic(hostingPath,hostingScript(plan.origin),0o644);
  const links=`Sara’s 30th\n\nInvitation: ${plan.origin}/\nOrganiser: ${plan.origin}/organiser/\nGame: ${plan.origin}/game/\n\nLocal organiser: ${local}/organiser/\nPrivate login: ${join(install.dataDir,'LOGIN.txt')}\n\nHTTPS form check passed: ${connection.verifiedAt}\nBefore inviting guests, verify the public link on a phone with Wi-Fi and Tailscale disconnected.\n`;
  writeAtomic(join(installDir,'LINKS.txt'),links);
  log(links);
  log('To connect the existing GitHub Pages invitation, commit and push the generated public URL file from this checkout:');
  log('git add hosting-config.js\ngit commit --only hosting-config.js -m "Connect invitation to Mac mini"\ngit push');
  return {origin:plan.origin,local,installDir};
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const options={}; const argv=process.argv.slice(2);
    while (argv.length) {
      const arg=argv.shift();
      if (arg==='--local-only') options.localOnly=true;
      else if (arg==='--https-port' && argv.length) options.httpsPort=Number(argv.shift());
      else throw new Error('Usage: ./start-mac-mini.sh [--local-only] [--https-port 443|8443|10000]');
    }
    await launch(options);
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
