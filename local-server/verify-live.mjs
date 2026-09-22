#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';

// A generated one-pixel PNG: no personal photo or guest information is used.
const photo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBqkAAAAASUVORK5CYII=', 'base64');
export async function verifyLive({origin, dataDir, eventId, request=fetch}) {
  const url=new URL(origin);
  if (url.origin!==origin || (url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))) throw new Error('Use the verified HTTPS origin or a loopback test origin.');
  const login=readFileSync(join(dataDir,'LOGIN.txt'),'utf8');
  const email=login.match(/^Email: (.+)$/m)?.[1], password=login.match(/^Password: (.+)$/m)?.[1];
  if (!email || !password) throw new Error('Private LOGIN.txt is missing its organiser credentials.');
  async function call(path,{method='GET',body,token,json=true}={}) {
    const headers={Origin:origin};
    if (token) headers.Authorization=`Bearer ${token}`;
    if (body && !(body instanceof FormData)) { headers['Content-Type']='application/json'; body=JSON.stringify(body); }
    const response=await request(new URL(path,origin),{method,headers,body,signal:AbortSignal.timeout(30000),redirect:'error'});
    if (!response.ok) throw new Error(`Setup check failed: ${method} ${path.split('?')[0]} returned ${response.status}.`);
    return json ? response.json() : Buffer.from(await response.arrayBuffer());
  }
  let hostToken,guestId;
  try {
    const health=await call('/api/health');
    assert.equal(health.service,'saras30-invitation','The public URL is not this invitation service.');
    assert.equal(health.eventId,eventId,'The public URL is for a different event.');
    const cors=await request(new URL('/api/rsvp',origin),{method:'OPTIONS',headers:{Origin:'https://0xdrchkn.github.io','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'},signal:AbortSignal.timeout(10000),redirect:'error'});
    assert.equal(cors.status,204,'The GitHub Pages form cannot reach this service.');
    assert.equal(cors.headers.get('access-control-allow-origin'),'https://0xdrchkn.github.io');
    const host=await call('/api/organiser/login',{method:'POST',body:{email,password}}); hostToken=host.token;
    const result=await call('/api/rsvp',{method:'POST',body:{eventId,name:'SETUP TEST — automatic connection check',accepted:true,requestId:randomBytes(32).toString('hex')}});
    guestId=result.reply.userId;
    const form=new FormData(); form.append('eventId',eventId); form.append('story','Automatic setup test; this record is removed after verification.'); form.append('photos',new Blob([photo],{type:'image/png'}),'setup-test.png');
    await call('/api/contribution',{method:'POST',body:form,token:result.token});
    const restored=await call(`/api/guest?eventId=${encodeURIComponent(eventId)}`,{token:result.token});
    assert.equal(restored.photos.length,1); assert.equal(restored.accepted,true); assert.match(restored.story,/Automatic setup test/);
    const rows=await call(`/api/organiser/submissions?eventId=${encodeURIComponent(eventId)}`,{token:hostToken});
    const visible=rows.find(row=>row.userId===guestId);
    assert.equal(visible?.story,restored.story); assert.equal(visible?.photos.length,1);
    // Never follow a returned photo URL to another host with the host's credentials.
    const download=new URL(visible.photos[0].url,origin);
    assert.equal(download.origin,origin);
    const bytes=await call(download.pathname+download.search,{json:false});
    assert.deepEqual(bytes,photo);
  } finally {
    // Delete only the exact disposable ID created by this invocation.
    try {
      if (guestId && hostToken) await call(`/api/organiser/submission?eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(guestId)}`,{method:'DELETE',token:hostToken});
    } finally { if (hostToken) await call('/api/organiser/logout',{method:'POST',token:hostToken}); }
  }
  return {ok:true};
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const installDir=join(homedir(),'Library','Application Support','Saras30');
    const deployment=JSON.parse(readFileSync(join(installDir,'public-connection.json'),'utf8'));
    await verifyLive({origin:deployment.origin,dataDir:join(installDir,'data'),eventId:deployment.eventId});
    console.log('PASS: public RSVP, story, photo, restored reply, organiser visibility and photo download. Setup test removed.');
  } catch(error) { console.error(error.message); process.exitCode=1; }
}
