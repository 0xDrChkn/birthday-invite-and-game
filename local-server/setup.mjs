#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, existsSync, lstatSync, readdirSync, copyFileSync, renameSync, rmSync, chmodSync, realpathSync } from 'node:fs';
import { join, resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { randomBytes, scryptSync } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const LABEL = 'local.saras30.invitation';
const defaultHome = join(homedir(), 'Library', 'Application Support', 'Saras30');
const publicFiles = ['.nojekyll','index.html','event-config.js','hosting-config.js','favicon.svg','style.css','cinema.css','cinema.js','story.css','story.js','submissions.css','submissions.js','local-submissions.js','script.js','music.js'];
const helpers = ['server.mjs','setup.mjs','manage.mjs','backup.mjs','install-macos.sh','launch.mjs','verify-live.mjs'];
const extensions = new Set(['.html','.js','.css','.svg','.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff','.woff2','.mp3','.m4a','.ogg','.wav']);
const xml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
function args(argv) {
  const result = {origins:[]};
  for (let i=0;i<argv.length;i++) {
    const key=argv[i];
    if (['--activate','--prepare-only'].includes(key)) result[key.slice(2)] = true;
    else if (['--install-dir','--source','--admin-email','--event-id','--port','--origin'].includes(key) && argv[i+1]) {
      if (key==='--origin') result.origins.push(argv[++i]);
      else result[key.slice(2)] = argv[++i];
    } else throw new Error(`Unknown or incomplete argument: ${key}`);
  }
  if (result.activate && result['prepare-only']) throw new Error('Choose --activate or --prepare-only.');
  return result;
}
function privateWrite(path, content) { writeFileSync(path,content,{mode:0o600}); chmodSync(path,0o600); }
function ensureDir(path) { mkdirSync(path,{recursive:true,mode:0o700}); chmodSync(path,0o700); }
function normalFile(path) {
  if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error(`Expected a regular file: ${path}`);
}
function copyTree(source,target) {
  if (!existsSync(source)) return;
  if (lstatSync(source).isSymbolicLink()) throw new Error(`Refusing symbolic link: ${source}`);
  ensureDir(target);
  for (const item of readdirSync(source,{withFileTypes:true})) {
    if (item.name.startsWith('.')) continue;
    if (item.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${join(source,item.name)}`);
    if (item.isDirectory()) copyTree(join(source,item.name),join(target,item.name));
    else if (item.isFile() && extensions.has(extname(item.name).toLowerCase())) copyFileSync(join(source,item.name),join(target,item.name));
  }
}
function processIsLive(dataDir) {
  const lock=join(dataDir,'service.pid');
  if (!existsSync(lock)) return false;
  const pid=Number(readFileSync(lock,'utf8').trim());
  if (!Number.isSafeInteger(pid) || pid<1) throw new Error('Invalid service PID lock. Stop and inspect the service before updating.');
  try { process.kill(pid,0); return true; } catch(error) { if(error.code==='ESRCH') return false; throw error; }
}
function launchctl(argv, allowFailure=false) {
  const result=spawnSync('/bin/launchctl',argv,{encoding:'utf8'});
  if (result.status!==0 && !allowFailure) throw new Error(`launchctl ${argv[0]} failed: ${result.stderr.trim() || result.error?.message || result.status}`);
  return result.status===0;
}
export function prepareInstallation(options={}) {
  if (Number(process.versions.node.split('.')[0])<24) throw new Error('Node.js 24 or newer is required. Install Node.js 24 LTS from nodejs.org, then run this command again.');
  const installDir=resolve(options['install-dir'] || defaultHome);
  const source=realpathSync(options.source || resolve(dirname(fileURLToPath(import.meta.url)),'..'));
  if (source===installDir || source.startsWith(installDir+sep) || installDir.startsWith(source+sep)) throw new Error('The installation directory must be separate from the source checkout.');
  const port=Number(options.port || 49200);
  if (!Number.isInteger(port) || port<1024 || port>65535) throw new Error('Port must be an integer between 1024 and 65535.');
  if (options.activate && process.platform!=='darwin') throw new Error('LaunchAgent installation requires macOS.');
  const eventId=options['event-id'] || 'sara-30-2026';
  const email=options['admin-email'] || 'host@sara.local';
  if (!/^[a-z0-9_-]{1,100}$/i.test(eventId)) throw new Error('Invalid event ID.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid organiser email.');
  const requestedOrigins=options.origins || [];
  for (const origin of requestedOrigins) { const u=new URL(origin); if (u.origin!==origin || !['http:','https:'].includes(u.protocol)) throw new Error('Each --origin must be an exact origin, without a path or trailing slash.'); }
  ensureDir(installDir);
  const dataDir=join(installDir,'data'), appDir=join(installDir,'app'), stage=join(installDir,`app-staging-${process.pid}`), logs=join(installDir,'logs');
  ensureDir(dataDir); ensureDir(logs);
  const configPath=join(dataDir,'config.json');
  let fresh=false;
  if (existsSync(configPath)) {
    normalFile(configPath);
    const config=JSON.parse(readFileSync(configPath,'utf8'));
    if (!config.eventId || !config.adminEmail || !/^[a-f0-9]{128}$/i.test(config.adminPasswordHash || '') || !/^[a-f0-9]{32,}$/i.test(config.salt || '') || !/^[a-f0-9]{64,}$/i.test(config.signingSecret || '')) throw new Error('Existing configuration is invalid. It has been left unchanged.');
    if (options['event-id'] && config.eventId!==eventId || options['admin-email'] && config.adminEmail!==email) throw new Error('Existing event and organiser credentials are preserved. Do not use account-changing flags during an update.');
    if (requestedOrigins.some(origin=>!(config.allowedOrigins || []).includes(origin))) throw new Error('Existing origins are preserved. Update private data/config.json explicitly to add the tunnel origin.');
    chmodSync(configPath,0o600);
  } else {
    if (existsSync(join(dataDir,'responses.sqlite')) || existsSync(join(dataDir,'LOGIN.txt'))) throw new Error('Data exists without config.json. Restore the original configuration instead of generating new credentials.');
    const salt=randomBytes(24).toString('hex'), password=randomBytes(24).toString('base64url');
    privateWrite(configPath,JSON.stringify({eventId,adminEmail:email,adminPasswordHash:scryptSync(password,salt,64).toString('hex'),salt,signingSecret:randomBytes(48).toString('hex'),allowedOrigins:[...new Set(['https://0xdrchkn.github.io',...requestedOrigins])]},null,2)+'\n');
    privateWrite(join(dataDir,'LOGIN.txt'),`Sara’s 30th — private organiser login\n\nEmail: ${email}\nPassword: ${password}\n\nOpen http://127.0.0.1:${port}/organiser/ on this Mac.\nKeep this file private. This email is a login name; no email account is required.\n`);
    fresh=true;
  }
  const oldManifest=join(installDir,'installation.json');
  const previous=existsSync(oldManifest)?JSON.parse(readFileSync(oldManifest,'utf8')):null;
  if (previous?.port && !options.port && previous.port!==port) throw new Error(`Existing service uses port ${previous.port}; pass --port ${previous.port} to preserve it.`);
  ensureDir(stage);
  try {
    for (const name of publicFiles) { normalFile(join(source,name)); copyFileSync(join(source,name),join(stage,name)); }
    for (const folder of ['assets','game','organiser','vendor']) copyTree(join(source,folder),join(stage,folder));
    ensureDir(join(stage,'local-server'));
    for (const name of helpers) { normalFile(join(source,'local-server',name)); copyFileSync(join(source,'local-server',name),join(stage,'local-server',name)); }
    const syntax=spawnSync(process.execPath,['--check',join(stage,'local-server','server.mjs')],{encoding:'utf8'});
    if (syntax.status!==0) throw new Error('The server failed its syntax check; the installed app was left unchanged.');
    const target=`gui/${process.getuid()}/${LABEL}`;
    const loaded=process.platform==='darwin' && launchctl(['print',target],true);
    if (loaded && !options.activate) throw new Error('The service is running. Use the installer to stop, update and restart it, or choose an isolated --install-dir.');
    if (!loaded && processIsLive(dataDir)) throw new Error('A manually started server is running. Stop it before updating the app.');
    if (loaded) {
      launchctl(['bootout',target]);
      for (let i=0;i<150 && processIsLive(dataDir);i++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);
      if (processIsLive(dataDir)) throw new Error('The old process did not stop. The app has been left unchanged.');
    }
    const oldApp=join(installDir,`app-previous-${process.pid}`);
    try {
      if (existsSync(appDir)) renameSync(appDir,oldApp);
      renameSync(stage,appDir);
    } catch(error) {
      if (!existsSync(appDir) && existsSync(oldApp)) renameSync(oldApp,appDir);
      throw error;
    }
    if (existsSync(oldApp)) rmSync(oldApp,{recursive:true});
    const runtime=realpathSync(process.execPath);
    const manifest={version:1,label:LABEL,installDir,appDir,dataDir,port,node:runtime};
    privateWrite(join(installDir,'installation.json'),JSON.stringify(manifest,null,2)+'\n');
    const plist=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>${LABEL}</string>\n<key>ProgramArguments</key><array><string>${xml(runtime)}</string><string>${xml(join(appDir,'local-server','server.mjs'))}</string></array>\n<key>WorkingDirectory</key><string>${xml(appDir)}</string>\n<key>EnvironmentVariables</key><dict><key>DATA_DIR</key><string>${xml(dataDir)}</string><key>HOST</key><string>127.0.0.1</string><key>PORT</key><string>${port}</string></dict>\n<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>10</integer>\n<key>StandardOutPath</key><string>${xml(join(logs,'server.log'))}</string><key>StandardErrorPath</key><string>${xml(join(logs,'server-error.log'))}</string>\n<key>ProcessType</key><string>Background</string>\n</dict></plist>\n`;
    const stagedPlist=join(installDir,`${LABEL}.plist`); privateWrite(stagedPlist,plist);
    if (options.activate) {
      const agentsDir=join(homedir(),'Library','LaunchAgents'); mkdirSync(agentsDir,{recursive:true});
      const installedPlist=join(agentsDir,`${LABEL}.plist`); privateWrite(installedPlist,plist);
      launchctl(['bootstrap',`gui/${process.getuid()}`,installedPlist]);
    }
    return {installDir,dataDir,port,fresh,activated:!!options.activate};
  } finally { if (existsSync(stage)) rmSync(stage,{recursive:true}); }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const result=prepareInstallation(args(process.argv.slice(2)));
    console.log(`${result.activated?'Installed and started':'Prepared only; no service was installed or started'}: ${result.installDir}`);
    console.log(`Private organiser credentials: ${join(result.dataDir,'LOGIN.txt')}`);
    console.log(`Organiser: http://127.0.0.1:${result.port}/organiser/`);
    console.log(result.fresh?'New private data directory created.':'Existing responses, photos and credentials preserved.');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
