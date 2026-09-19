/* Real Auth, PostgREST and Storage tests. LOCAL Supabase only; synthetic data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {randomUUID} = require('node:crypto');
const sdk = new Function(fs.readFileSync(require.resolve('../vendor/supabase.js'),'utf8')+'; return supabase;')();
const settings = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const url = settings.API_URL;
assert.match(url, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const key = settings.ANON_KEY;
const admin = sdk.createClient(url, settings.SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const eventId = 'sara-30-2026';
const source = fs.readFileSync(require.resolve('../submissions.js'),'utf8');
const ids = [];
let assertions = 0;
function ok(value, message) { assert.ok(value, message); assertions++; }
function checked(result) { assert.equal(result.error, null, result.error?.message); return result.data; }
function guest() {
  const instances = [];
  let failUpload = false;
  const context = {
    window:{BIRTHDAY_CONFIG:{id:eventId,submissions:{url,publishableKey:key}},supabase:{
      createClient:(u,k,options) => {
        const storage = new Map();
        const client = sdk.createClient(u,k,{...options,auth:{...options.auth,autoRefreshToken:false,
          storage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}}});
        instances.push(client); return client;
      }
    }},
    atob,URL,AbortController,setTimeout,clearTimeout,Uint8Array,
    fetch:async (input,init) => {
      if (failUpload && String(input).includes('/storage/v1/object/birthday-memories/')) {
        failUpload=false; throw new Error('Synthetic interrupted upload');
      }
      return fetch(input,init);
    }
  };
  vm.runInNewContext(source,context);
  return {api:context.window.BirthdaySubmissions,instances,interrupt:()=>{failUpload=true;}};
}
const a=guest(), b=guest(), host=guest();
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7XcAAAAASUVORK5CYII=','base64');
const files=[1,2,3].map(n=>new File([png],`test-${n}.png`,{type:'image/png'}));
async function rejects(promise,code) {
  await assert.rejects(promise,e=>e.code===code); assertions++;
}
(async()=>{
  try {
    ok(a.api.configured,'local adapter configured');
    ok(await a.api.restoreGuest(eventId)===null,'new guest has no response');
    await a.api.saveRsvp({eventId,name:'Integration guest A',accepted:true});
    const aid=checked(await a.instances[0].auth.getUser()).user.id; ids.push(aid);
    await a.api.saveRsvp({eventId,name:'Integration guest A updated',accepted:false});
    let own=await a.api.restoreGuest(eventId);
    ok(own.name.endsWith('updated') && own.accepted===false,'RSVP updates and restores');
    ok(checked(await admin.from('birthday_responses').select('*').eq('user_id',aid)).length===1,'no duplicate RSVP');
    await b.api.saveRsvp({eventId,name:'Integration guest B',accepted:true});
    const bid=checked(await b.instances[0].auth.getUser()).user.id; ids.push(bid);
    ok(checked(await b.instances[0].from('birthday_responses').select('*').eq('user_id',aid)).length===0,'other guest cannot read response');
    await a.api.saveContribution({eventId,story:'A synthetic story without photos.'});
    own=await a.api.restoreGuest(eventId);
    ok(own.contributedAt && own.photos.length===0,'story-only save restores');
    const progress=[];
    own=await a.api.saveContribution({eventId,story:'A synthetic story with three photos.',files,onProgress:p=>progress.push(p.done)});
    ok(progress.join(',')==='1,2,3' && own.photos.length===3,'three photo save and progress');
    ok((await fetch(own.photos[0].url)).ok,'signed preview is readable');
    const path=`${eventId}/${aid}/1`;
    ok((await b.instances[0].storage.from('birthday-memories').download(path)).error,'other guest cannot download photo');
    ok(!(await fetch(`${url}/storage/v1/object/public/birthday-memories/${path}`)).ok,'bucket is not public');
    a.interrupt();
    await rejects(a.api.saveContribution({eventId,story:'Text survives interruption.',files:[files[0]]}),'upload_failed');
    own=await a.api.restoreGuest(eventId);
    ok(own.pendingUpload && !own.contributedAt && own.photos.length===0 && own.story==='Text survives interruption.','partial upload is honest and story survives');
    await rejects(a.api.saveContribution({eventId,story:'Retry without file.'}),'upload_incomplete');
    own=await a.api.saveContribution({eventId,story:'Successful retry.',files:[files[0]]});
    ok(own.photos.length===1 && own.contributedAt,'retry completes');
    ok(checked(await admin.storage.from('birthday-memories').list(`${eventId}/${aid}`)).length===1,'replacement removes old slots');
    await rejects(a.api.saveContribution({eventId,story:'Invalid format.',files:[new File(['<svg/>'],'x.svg',{type:'image/svg+xml'})]}),'invalid_files');
    checked(await a.instances[0].from('birthday_responses').update({pending_upload:true}).eq('user_id',aid));
    ok((await a.instances[0].storage.from('birthday-memories').upload(path,new Blob(['<svg/>'],{type:'image/svg+xml'}),{upsert:true})).error,'bucket rejects SVG via raw API');
    ok((await a.instances[0].storage.from('birthday-memories').upload(path,new Blob([new Uint8Array(20*1024*1024+1)],{type:'image/png'}),{upsert:true})).error,'bucket rejects oversized file via raw API');
    await a.api.saveContribution({eventId,story:'Final synthetic story.',files:[files[0]]});
    const email=`birthday-qa-${randomUUID()}@example.test`, password=randomUUID()+'Aa1!';
    const user=checked(await admin.auth.admin.createUser({email,password,email_confirm:true})).user; ids.push(user.id);
    await rejects(host.api.signInOrganiser({email,password}),'not_authorized');
    checked(await admin.from('birthday_organisers').insert({event_id:eventId,user_id:user.id}));
    ok((await host.api.signInOrganiser({email,password})).email===email,'authorised host can sign in');
    const list=await host.api.listSubmissions(eventId);
    const row=list.find(r=>r.userId===aid);
    ok(row?.story==='Final synthetic story.' && row.photos.length===1,'host sees saved story and photos');
    ok((await fetch(row.photos[0].url)).ok,'host signed download works');
    await host.api.deleteSubmission({eventId,userId:aid});
    ok(checked(await admin.from('birthday_responses').select('*').eq('user_id',aid)).length===0,'host deletes response');
    ok(checked(await admin.storage.from('birthday-memories').list(`${eventId}/${aid}`)).length===0,'host removes photo bytes');
    await host.api.signOutOrganiser();
    ok(await host.api.organiserSession()===null,'host signs out');
    console.log(`PASS: ${assertions} real Supabase integration assertions`);
  } finally {
    for(const id of ids) {
      await admin.storage.from('birthday-memories').remove([1,2,3].map(s=>`${eventId}/${id}/${s}`));
      await admin.auth.admin.deleteUser(id);
    }
  }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
