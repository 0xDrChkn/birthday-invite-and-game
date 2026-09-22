import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { prepareInstallation } from '../local-server/setup.mjs';
import { createBackup, restoreBackup } from '../local-server/backup.mjs';
import { createServer } from '../local-server/server.mjs';

const source=resolve(import.meta.dirname,'..');
const temp=mkdtempSync(join(tmpdir(),'saras30-install-test-'));
let server;
async function stop() { if(server) { await new Promise(resolve=>server.close(resolve)); server.closeStore(); server=null; } }
async function start(dataDir) { server=await createServer({rootDir:join(temp,'installed','app'),dataDir,port:0}); return `http://127.0.0.1:${server.address().port}`; }
async function json(base,path,body,bearer) {
  const headers={Origin:base}; if(body) headers['Content-Type']='application/json'; if(bearer) headers.Authorization=`Bearer ${bearer}`;
  const response=await fetch(base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});
  assert.equal(response.status,200,`Unexpected response for ${path}`); return response.json();
}
try {
  const installDir=join(temp,'installed');
  const install=prepareInstallation({'install-dir':installDir,source,'prepare-only':true});
  assert.equal(install.activated,false);
  if (process.platform==='darwin') assert.equal(spawnSync('/usr/bin/plutil',['-lint',join(installDir,'local.saras30.invitation.plist')],{encoding:'utf8'}).status,0,'Generated LaunchAgent plist must be valid');
  assert.equal(existsSync(join(installDir,'app','tmp')),false);
  assert.equal(existsSync(join(installDir,'app','.git')),false);
  assert.equal(existsSync(join(installDir,'app','backend')),false);
  assert.equal(existsSync(join(installDir,'app','tests')),false);
  assert.equal(existsSync(join(installDir,'app','supabase')),false);
  assert.equal(existsSync(join(installDir,'app','assets','sara-gatsby-toast.jpg')),true);
  assert.equal(existsSync(join(installDir,'app','organiser','index.html')),true);
  const dataDir=install.dataDir, configBytes=readFileSync(join(dataDir,'config.json')), login=readFileSync(join(dataDir,'LOGIN.txt'),'utf8');
  assert.equal(statSync(dataDir).mode & 0o777,0o700);
  assert.equal(statSync(join(dataDir,'config.json')).mode & 0o777,0o600);
  assert.equal(statSync(join(dataDir,'LOGIN.txt')).mode & 0o777,0o600);
  const config=JSON.parse(configBytes), password=login.match(/^Password: (.+)$/m)[1];
  assert.equal(config.adminEmail,'host@sara.local'); assert.ok(password.length>=32);
  assert.ok(!readFileSync(join(installDir,'local.saras30.invitation.plist'),'utf8').includes(password));
  let base=await start(dataDir);
  assert.throws(()=>createBackup(dataDir,join(temp,'active-backup')),/running/);
  assert.throws(()=>prepareInstallation({'install-dir':installDir,source,'prepare-only':true}),/running/);
  const guest=await json(base,'/api/rsvp',{eventId:config.eventId,name:'TEST — installation recovery',email:'test@example.invalid',accepted:true,requestId:randomBytes(32).toString('hex')});
  const photo=readFileSync(join(source,'assets','memory-01.jpg'));
  const form=new FormData(); form.append('eventId',config.eventId); form.append('story','Synthetic restore verification only.'); form.append('photos',new Blob([photo],{type:'image/jpeg'}),'recovery-test.jpg');
  const response=await fetch(base+'/api/contribution',{method:'POST',headers:{Origin:base,Authorization:`Bearer ${guest.token}`},body:form}); assert.equal(response.status,200);
  const saved=await response.json(); assert.equal(saved.photos.length,1);
  const admin=await json(base,'/api/organiser/login',{email:config.adminEmail,password}); assert.ok(admin.token);
  await stop();
  assert.equal(existsSync(join(dataDir,'service.pid')),false);
  const backup=join(temp,'backup'); const summary=createBackup(dataDir,backup); assert.equal(summary.photos,1);
  assert.equal(statSync(join(backup,'manifest.json')).mode & 0o777,0o600);
  const database=readFileSync(join(dataDir,'responses.sqlite'));
  const updated=prepareInstallation({'install-dir':installDir,source,'prepare-only':true}); assert.equal(updated.fresh,false);
  assert.deepEqual(readFileSync(join(dataDir,'config.json')),configBytes);
  assert.equal(readFileSync(join(dataDir,'LOGIN.txt'),'utf8'),login);
  assert.deepEqual(readFileSync(join(dataDir,'responses.sqlite')),database);
  assert.equal(readdirSync(join(dataDir,'uploads')).length,1);
  // A corrupted backup never overwrites the current data.
  const backupPhoto=join(backup,'uploads',saved.photos[0].id); writeFileSync(backupPhoto,'damaged');
  assert.throws(()=>restoreBackup(backup,dataDir),/checksum/);
  assert.deepEqual(readFileSync(join(dataDir,'responses.sqlite')),database);
  writeFileSync(backupPhoto,photo);
  const restoredDir=join(temp,'restored-data');
  const restored=restoreBackup(backup,restoredDir); assert.equal(restored.photos,1); assert.equal(restored.previous,null);
  base=await start(restoredDir);
  const recovered=await json(base,`/api/guest?eventId=${config.eventId}`,null,guest.token);
  assert.equal(recovered.story,'Synthetic restore verification only.'); assert.equal(recovered.name,'TEST — installation recovery');
  const download=await fetch(base+recovered.photos[0].url); assert.equal(download.status,200); assert.deepEqual(Buffer.from(await download.arrayBuffer()),photo);
  const recoveredAdmin=await json(base,'/api/organiser/login',{email:config.adminEmail,password});
  const rows=await json(base,`/api/organiser/submissions?eventId=${config.eventId}`,null,recoveredAdmin.token); assert.equal(rows.length,1); assert.equal(rows[0].photos.length,1);
  await stop();
  const beforeSecondRestore=readFileSync(join(restoredDir,'responses.sqlite'));
  const again=restoreBackup(backup,restoredDir); assert.ok(again.previous); assert.deepEqual(readFileSync(join(again.previous,'responses.sqlite')),beforeSecondRestore); assert.deepEqual(readFileSync(join(restoredDir,'responses.sqlite')),database);
  console.log('PASS: isolated install/update, allowlisted app, private credentials, active-service refusal, checksum validation, backup restore, guest token continuity and organiser/photo recovery. No LaunchAgent installed.');
} finally { await stop(); rmSync(temp,{recursive:true,force:true}); }
