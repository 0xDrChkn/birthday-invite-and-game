#!/usr/bin/env node
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, renameSync, rmSync, chmodSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const defaultData=join(homedir(),'Library','Application Support','Saras30','data');
const rootNames=new Set(['config.json','LOGIN.txt','responses.sqlite','responses.sqlite-wal','responses.sqlite-shm']);
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
function privateDir(path) { mkdirSync(path,{recursive:true,mode:0o700}); chmodSync(path,0o700); }
function isRegular(path) { if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw new Error(`Expected a regular file: ${path}`); }
function isDirectory(path) { if (!lstatSync(path).isDirectory() || lstatSync(path).isSymbolicLink()) throw new Error(`Expected a real directory: ${path}`); }
function stopped(dataDir) {
  if (!existsSync(dataDir)) return;
  isDirectory(dataDir);
  const lock=join(dataDir,'service.pid');
  if (!existsSync(lock)) return;
  isRegular(lock);
  const pid=Number(readFileSync(lock,'utf8').trim());
  if (!Number.isSafeInteger(pid) || pid<1) throw new Error('Invalid service.pid: stop the service and inspect the lock before continuing.');
  try { process.kill(pid,0); } catch(error) { if (error.code==='ESRCH') return; throw new Error('Cannot confirm that the service is stopped.'); }
  throw new Error('The service is running. Stop it with manage.mjs stop before backup or restore.');
}
function fileList(dataDir) {
  const files=[];
  for (const name of rootNames) if (existsSync(join(dataDir,name))) { isRegular(join(dataDir,name)); files.push(name); }
  if (existsSync(join(dataDir,'uploads'))) {
    isDirectory(join(dataDir,'uploads'));
    for (const name of readdirSync(join(dataDir,'uploads'))) {
      if (!/^[a-f0-9-]{36}$/.test(name)) throw new Error(`Unexpected upload filename: ${name}. Restore or complete interrupted uploads before backing up.`);
      isRegular(join(dataDir,'uploads',name)); files.push(`uploads/${name}`);
    }
  }
  return files.sort();
}
function validateConfig(dataDir) {
  const c=JSON.parse(readFileSync(join(dataDir,'config.json'),'utf8'));
  if (!c.eventId || !c.adminEmail || !/^[a-f0-9]{128}$/i.test(c.adminPasswordHash || '') || !/^[a-f0-9]{32,}$/i.test(c.salt || '') || !/^[a-f0-9]{64,}$/i.test(c.signingSecret || '')) throw new Error('The private configuration is incomplete.');
}
function copyFiles(source,destination,files) {
  privateDir(destination); privateDir(join(destination,'uploads'));
  for (const name of files) { copyFileSync(join(source,name),join(destination,name)); chmodSync(join(destination,name),0o600); }
}
function separate(a,b) { if (a===b || a.startsWith(b+sep) || b.startsWith(a+sep)) throw new Error('Backup and data directories must be separate, without nesting.'); }
export function createBackup(dataPath,destinationPath) {
  const dataDir=resolve(dataPath), destination=resolve(destinationPath); separate(dataDir,destination);
  stopped(dataDir); validateConfig(dataDir);
  if (existsSync(destination)) throw new Error('Backup destination already exists. Choose a new empty path.');
  if (!existsSync(join(dataDir,'responses.sqlite'))) throw new Error('No response database exists yet. Start the service once before backing up.');
  const files=fileList(dataDir), original=Object.fromEntries(files.map(name=>[name,digest(join(dataDir,name))]));
  try {
    copyFiles(dataDir,destination,files);
    stopped(dataDir);
    if (JSON.stringify(fileList(dataDir))!==JSON.stringify(files) || files.some(name=>digest(join(dataDir,name))!==original[name] || digest(join(destination,name))!==original[name])) throw new Error('Data changed during backup. Stop the service and retry.');
    writeFileSync(join(destination,'manifest.json'),JSON.stringify({version:1,createdAt:new Date().toISOString(),files:original},null,2)+'\n',{mode:0o600});
    return {destination,files:files.length,photos:files.filter(name=>name.startsWith('uploads/')).length};
  } catch(error) { if(existsSync(destination)) rmSync(destination,{recursive:true}); throw error; }
}
export function restoreBackup(backupPath,dataPath) {
  const source=resolve(backupPath), dataDir=resolve(dataPath); separate(source,dataDir); stopped(dataDir); isDirectory(source);
  isRegular(join(source,'manifest.json'));
  const manifest=JSON.parse(readFileSync(join(source,'manifest.json'),'utf8'));
  if (manifest.version!==1 || !manifest.files || typeof manifest.files!=='object' || Array.isArray(manifest.files)) throw new Error('Invalid backup manifest.');
  const files=Object.keys(manifest.files).sort();
  if (!files.includes('config.json') || !files.includes('responses.sqlite')) throw new Error('Backup is missing configuration or database.');
  for (const name of files) {
    if (!(rootNames.has(name) || /^uploads\/[a-f0-9-]{36}$/.test(name)) || !/^[a-f0-9]{64}$/.test(manifest.files[name])) throw new Error('Unsafe backup manifest.');
    if (name.startsWith('uploads/')) isDirectory(join(source,'uploads'));
    isRegular(join(source,name));
    if (digest(join(source,name))!==manifest.files[name]) throw new Error(`Backup checksum failed for ${name}; no data was changed.`);
  }
  validateConfig(source);
  const suffix=`${Date.now()}-${randomBytes(3).toString('hex')}`, stage=`${dataDir}.restore-${suffix}`, previous=`${dataDir}.before-restore-${suffix}`;
  try {
    copyFiles(source,stage,files); stopped(dataDir);
    const hadData=existsSync(dataDir);
    if (hadData) renameSync(dataDir,previous);
    try { renameSync(stage,dataDir); } catch(error) { if(hadData) renameSync(previous,dataDir); throw error; }
    return {dataDir,previous:hadData?previous:null,files:files.length,photos:files.filter(name=>name.startsWith('uploads/')).length};
  } finally { if(existsSync(stage)) rmSync(stage,{recursive:true}); }
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const argv=process.argv.slice(2),command=argv.shift(); let dataDir=defaultData, backup;
    while(argv.length) { const key=argv.shift(),value=argv.shift(); if(!value) throw new Error('Missing argument value.'); if(key==='--data-dir') dataDir=value; else if(key==='--backup') backup=value; else throw new Error(`Unknown argument: ${key}`); }
    if (!backup || !['backup','restore'].includes(command)) throw new Error('Usage: node local-server/backup.mjs backup|restore --backup PATH [--data-dir PATH]');
    const result=command==='backup'?createBackup(dataDir,backup):restoreBackup(backup,dataDir);
    console.log(`${command==='backup'?'Backup verified':'Restore prepared'}: ${result.destination || result.dataDir} (${result.photos} photos).`);
    if (result.previous) console.log(`Previous data kept for recovery: ${result.previous}`);
    console.log('Keep this private: it contains guest replies, photos and organiser credentials.');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
