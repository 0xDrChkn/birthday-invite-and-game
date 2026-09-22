#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const argv=process.argv.slice(2), command=argv.shift();
let installDir=join(homedir(),'Library','Application Support','Saras30');
if (argv.length===2 && argv[0]==='--install-dir') installDir=resolve(argv[1]);
else if (argv.length) { console.error('Usage: node local-server/manage.mjs start|stop|status [--install-dir PATH]'); process.exit(1); }
try {
  if (process.platform!=='darwin') throw new Error('Service management requires macOS.');
  const manifest=JSON.parse(readFileSync(join(installDir,'installation.json'),'utf8'));
  if (manifest.installDir!==installDir || manifest.label!=='local.saras30.invitation') throw new Error('Installation metadata does not match this location.');
  const target=`gui/${process.getuid()}/${manifest.label}`, plist=join(homedir(),'Library','LaunchAgents',`${manifest.label}.plist`);
  const run=args=>spawnSync('/bin/launchctl',args,{encoding:'utf8'});
  const running=run(['print',target]).status===0;
  if (command==='status') {
    let online=false;
    try { online=(await fetch(`http://127.0.0.1:${manifest.port}/api/health`,{signal:AbortSignal.timeout(3000)})).ok; } catch {}
    console.log(`LaunchAgent ${running?'loaded':'not loaded'}; HTTP service ${online?'responding':'not responding'}.`);
    if (online) console.log(`Organiser: http://127.0.0.1:${manifest.port}/organiser/`);
  } else if (command==='start') {
    if (!existsSync(plist)) throw new Error('No installed LaunchAgent. Run install-macos.sh on the target Mac first.');
    if (running) console.log('LaunchAgent is already loaded.');
    else { const r=run(['bootstrap',`gui/${process.getuid()}`,plist]); if(r.status!==0) throw new Error(r.stderr.trim() || 'Could not start service.'); console.log('LaunchAgent loaded. Use status to check the service.'); }
  } else if (command==='stop') {
    if (running) { const r=run(['bootout',target]); if(r.status!==0) throw new Error(r.stderr.trim() || 'Could not stop service.'); }
    const lock=join(manifest.dataDir,'service.pid');
    for (let i=0;i<60 && existsSync(lock);i++) await new Promise(resolve=>setTimeout(resolve,250));
    if (existsSync(lock)) throw new Error('A service PID lock remains. Check whether a manually started server is still running before backing up.');
    console.log('LaunchAgent stopped. Replies and photos remain stored.');
  } else throw new Error('Use start, stop or status.');
} catch(error) { console.error(error.message); process.exitCode=1; }
