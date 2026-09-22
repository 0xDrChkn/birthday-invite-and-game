/* Real HTTP tests against an isolated, dependency-free SQLite/file server. */
const assert = require('node:assert/strict');
const {mkdtempSync, rmSync, readFileSync, existsSync, renameSync, writeFileSync, cpSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join,resolve} = require('node:path');
const {randomBytes} = require('node:crypto');

(async()=>{
  const {createServer,passwordHash}=await import('../local-server/server.mjs');
  const temporary=mkdtempSync(join(tmpdir(),'saras-local-test-'));
  const dataDir=join(temporary,'data');
  const rootDir=resolve(__dirname,'..');
  const salt=randomBytes(16).toString('hex');
  const config={eventId:'sara-30-2026',adminEmail:'host@example.test',adminPasswordHash:await passwordHash('This is a test password only.',salt),salt,signingSecret:randomBytes(32).toString('hex'),allowedOrigins:['https://0xdrchkn.github.io']};
  let server,base,origin,checks=0;
  const eventId=config.eventId;
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6HAAAAABJRU5ErkJggg==','base64');
  async function start(directory=dataDir) { server=await createServer({rootDir,dataDir:directory,config,port:0}); base=`http://127.0.0.1:${server.address().port}`; origin=base; }
  async function stop() { await new Promise(resolveClose=>server.close(resolveClose)); server.closeStore(); server=null; }
  async function request(path,{method='GET',body,token,headers={},status=200}={}) {
    const response=await fetch(base+path,{method,headers:{Origin:origin,...(token?{Authorization:`Bearer ${token}`} : {}),...(body && !(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...headers},body:body instanceof FormData?body:body===undefined?undefined:JSON.stringify(body)});
    const data=await response.json(); assert.equal(response.status,status,`${method} ${path}: ${JSON.stringify(data)}`); checks++; return data;
  }
  function contribution(story,files=[]) { const form=new FormData();form.set('eventId',eventId);form.set('story',story);for(const file of files) form.append('photos',new Blob([file.bytes||png],{type:file.type||'image/png'}),file.name||'party.png');return form; }
  async function login(){return request('/api/organiser/login',{method:'POST',body:{email:config.adminEmail,password:'This is a test password only.'}});}
  try {
    await start();
    await assert.rejects(createServer({rootDir,dataDir,config,port:0}),/already running/);checks++;
    const failedDataDir=join(temporary,'failed-listener');
    await assert.rejects(createServer({rootDir,dataDir:failedDataDir,config,port:server.address().port}),/EADDRINUSE/);assert.equal(existsSync(join(failedDataDir,'service.pid')),false);checks++;
    await request('/api/health');
    for(const path of ['/tmp/local-organiser-credentials.json','/local-server/server.mjs','/tests/local-server.cjs','/supabase/config.toml','/.git/config','/docs/LOCAL-TEST.md','/uploads/file.png']) {
      const response=await fetch(base+path);assert.equal(response.status,404,path);checks++;
    }
    const dynamic=await (await fetch(base+'/event-config.js')).text();assert.match(dynamic,/provider: "local"/);assert.ok(!dynamic.includes(config.signingSecret));checks++;
    for(const path of ['/','/organiser/','/game/','/style.css']) {assert.equal((await fetch(base+path)).status,200);checks++;}
    await request('/api/rsvp',{method:'POST',body:{},headers:{Origin:'https://bad.example'},status:403});
    await request('/api/rsvp',{method:'POST',body:{},headers:{Origin:''},status:403});
    await request('/api/rsvp',{method:'POST',body:{eventId,name:' ',accepted:true,requestId:randomBytes(32).toString('hex')},status:400});
    await request('/api/rsvp',{method:'POST',body:{eventId,name:'Nobody',accepted:'yes',requestId:randomBytes(32).toString('hex')},status:400});
    await request('/api/rsvp',{method:'POST',body:{eventId,name:'Nobody',accepted:true,requestId:'guessable'},status:400});
    await request('/api/rsvp',{method:'POST',body:{eventId,name:'Nobody',email:'invalid',accepted:true,requestId:randomBytes(32).toString('hex')},status:400});
    const guests=[];
    for(let i=0;i<10;i++) {
      const requestId=randomBytes(32).toString('hex');
      const saved=await request('/api/rsvp',{method:'POST',body:{eventId,name:`TEST ${i+1} — Guest`,email:`guest${i+1}@example.test`,accepted:i<7,requestId}});
      guests.push({...saved,requestId});
    }
    const retry=await request('/api/rsvp',{method:'POST',body:{eventId,name:'TEST 1 — Guest',email:'guest1@example.test',accepted:true,requestId:guests[0].requestId}});
    assert.equal(retry.token,guests[0].token);assert.equal(retry.reply.userId,guests[0].reply.userId);checks++;
    await request('/api/guest?eventId='+eventId,{status:401});
    await request('/api/guest?eventId='+eventId,{token:randomBytes(32).toString('base64url'),status:401});
    await request('/api/guest?eventId=other',{token:guests[0].token,status:404});
    const own=await request('/api/guest?eventId='+eventId,{token:guests[0].token});assert.equal(own.userId,guests[0].reply.userId);checks++;
    await request('/api/organiser/submissions?eventId='+eventId,{token:guests[0].token,status:401});
    await request('/api/rsvp',{method:'POST',body:{eventId,name:'Bad edit',accepted:false,token:randomBytes(32).toString('base64url')},status:401});
    for(let i=0;i<10;i++) {
      const files=Array.from({length:i===0?3:2},(_,n)=>({name:`guest-${i+1}-${n+1}.png`}));
      const saved=await request('/api/contribution',{method:'POST',token:guests[i].token,body:contribution(`Fictional story ${i+1}.`,files)});
      assert.equal(saved.story,`Fictional story ${i+1}.`);assert.equal(saved.photos.length,files.length);checks++;
      guests[i].contribution=saved;
    }
    const admin=await login();
    await request('/api/organiser/session',{token:admin.token});
    let rows=await request('/api/organiser/submissions?eventId='+eventId,{token:admin.token});
    assert.equal(rows.length,10);assert.equal(rows.filter(row=>row.accepted).length,7);assert.equal(rows.filter(row=>!row.accepted).length,3);assert.equal(rows.reduce((sum,row)=>sum+row.photos.length,0),21);checks++;
    for(const row of rows) for(const photo of row.photos) {const response=await fetch(base+photo.url);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),png);checks++;}
    const first=rows.find(row=>row.userId===guests[0].reply.userId);
    assert.equal((await fetch(base+first.photos[0].url.split('?')[0])).status,403);checks++;
    assert.equal((await fetch(base+first.photos[0].url+'broken')).status,403);checks++;
    await request('/api/contribution',{method:'POST',body:contribution('Unauthorized',[{}]),status:401});
    await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('Too many',[{},{},{},{}]),status:400});
    await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('Invalid data',[{bytes:Buffer.from('<svg><script/></svg>')}]),status:400});
    await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('MIME mismatch',[{type:'image/jpeg'}]),status:400});
    await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('a'.repeat(3001)),status:400});
    const oversized=Buffer.alloc(20*1024*1024+1);png.copy(oversized);
    await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('Too large',[{bytes:oversized}]),status:400});
    // A real filesystem write failure must preserve the previous story and photo set.
    const uploads=join(dataDir,'uploads'); renameSync(uploads,uploads+'-saved'); writeFileSync(uploads,'block directory creation');
    try {await request('/api/contribution',{method:'POST',token:guests[0].token,body:contribution('Must not persist',[{}]),status:500});}
    finally {rmSync(uploads);renameSync(uploads+'-saved',uploads);}
    const afterFailure=await request('/api/guest?eventId='+eventId,{token:guests[0].token});
    assert.equal(afterFailure.story,'Fictional story 1.');assert.deepEqual(afterFailure.photos.map(p=>p.id),first.photos.map(p=>p.id));checks++;
    const photoOnly=await request('/api/contribution',{method:'POST',token:guests[1].token,body:contribution('',[{name:'photo-only.png'}])});assert.equal(photoOnly.story,'');assert.equal(photoOnly.photos.length,1);checks++;
    const retained=await request('/api/contribution',{method:'POST',token:guests[2].token,body:contribution('Updated story, photos retained.')});assert.equal(retained.photos.length,2);checks++;
    const update=await request('/api/rsvp',{method:'POST',body:{eventId,name:'TEST 4 — Edited',email:'edited@example.test',accepted:false,token:guests[3].token}});assert.equal(update.reply.story,'Fictional story 4.');assert.equal(update.reply.photos.length,2);checks++;
    await request('/api/organiser/submission?eventId='+eventId+'&userId='+guests[1].reply.userId,{method:'DELETE',token:guests[0].token,status:401});
    // Stop/reopen the actual SQLite database; both guest and host sessions survive a restart.
    await stop(); await start();
    const restored=await request('/api/guest?eventId='+eventId,{token:guests[0].token});assert.equal(restored.photos.length,3);assert.equal(restored.story,'Fictional story 1.');checks++;
    await request('/api/organiser/session',{token:admin.token});
    const deletedPhoto=restored.photos[0].url;
    await request('/api/organiser/submission?eventId='+eventId+'&userId='+guests[0].reply.userId,{method:'DELETE',token:admin.token});
    await request('/api/guest?eventId='+eventId,{token:guests[0].token,status:401});
    assert.equal((await fetch(base+deletedPhoto)).status,404);checks++;
    rows=await request('/api/organiser/submissions?eventId='+eventId,{token:admin.token});assert.equal(rows.length,9);checks++;
    await request('/api/organiser/logout',{method:'POST',token:admin.token});
    await request('/api/organiser/session',{token:admin.token,status:401});
    // Cold backup/restore copies the SQLite file and its private upload folder together.
    await stop();const backup=join(temporary,'restored-backup');cpSync(dataDir,backup,{recursive:true});await start(backup);
    const backupAdmin=await login();
    const backupRows=await request('/api/organiser/submissions?eventId='+eventId,{token:backupAdmin.token});assert.equal(backupRows.length,9);checks++;
    const backupGuest=await request('/api/guest?eventId='+eventId,{token:guests[1].token});assert.equal(backupGuest.photos.length,1);checks++;
    const download=await fetch(base+backupGuest.photos[0].url);assert.deepEqual(Buffer.from(await download.arrayBuffer()),png);checks++;
    for(let i=0;i<9;i++) await request('/api/organiser/login',{method:'POST',body:{email:config.adminEmail,password:'wrong'},status:401});
    await request('/api/organiser/login',{method:'POST',body:{email:config.adminEmail,password:'wrong'},status:429});
    const stored=readFileSync(join(backup,'responses.sqlite'));
    assert.equal(stored.includes(Buffer.from(guests[1].token)),false);assert.equal(stored.includes(Buffer.from('This is a test password only.')),false);checks++;
    console.log(`PASS ${checks} local-server checks: 10 RSVPs, private uploads, isolation, retries, failed upload preservation, restart, backup restore and rate limits.`);
  } finally {if(server) await stop();rmSync(temporary,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
