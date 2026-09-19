/* Public-key client. Database and Storage policies enforce all access on the server. */
(() => {
  'use strict';
  const settings = window.BIRTHDAY_CONFIG?.submissions || {};
  const eventId = window.BIRTHDAY_CONFIG?.id;
  const bucket = 'birthday-memories';
  const types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  function problem(code) { return Object.assign(new Error(code), {code}); }
  function safeKey(key) {
    if (!key || key.startsWith('sb_secret_')) return false;
    if (key.startsWith('sb_publishable_')) return true;
    try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; }
    catch { return false; }
  }
  const configured = !!(window.supabase?.createClient && /^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(settings.url || '') && safeKey(settings.publishableKey));
  // HTTP is only allowed for an explicitly local Supabase development stack.
  const localConfigured = !!(window.supabase?.createClient && /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(settings.url || '') && safeKey(settings.publishableKey));
  const ready = configured || localConfigured;
  let guestClient, organiserClient;
  async function boundedFetch(input, init = {}) {
    const controller = new AbortController();
    const relay = () => controller.abort();
    init.signal?.addEventListener('abort', relay, {once:true});
    if (init.signal?.aborted) controller.abort();
    const timer = setTimeout(() => controller.abort(), String(input).includes('/storage/') ? 120000 : 25000);
    try { return await fetch(input, {...init, signal:controller.signal}); }
    finally { clearTimeout(timer); init.signal?.removeEventListener('abort', relay); }
  }
  function client(role) {
    if (!ready) throw problem('not_configured');
    const existing = role === 'guest' ? guestClient : organiserClient;
    if (existing) return existing;
    const project = new URL(settings.url).host.replace(/[^a-z0-9]/gi, '-');
    const instance = window.supabase.createClient(settings.url, settings.publishableKey, {
      auth:{storageKey:`birthday-${project}-${role}`,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
      global:{fetch:boundedFetch}
    });
    if (role === 'guest') guestClient = instance; else organiserClient = instance;
    return instance;
  }
  function checked(result, fallback = 'unavailable') {
    if (result.error) {
      if (result.error.status === 401 || result.error.code === 'PGRST301') throw problem('session_expired');
      if (result.error.code === '42501') throw problem('closed');
      throw problem(fallback);
    }
    return result.data;
  }
  async function guest(create = false) {
    const db = client('guest');
    const session = checked(await db.auth.getSession()).session;
    if (session) return {db, user:session.user};
    if (!create) return null;
    const data = checked(await db.auth.signInAnonymously());
    if (!data.user) throw problem('unavailable');
    return {db, user:data.user};
  }
  function path(id, userId, slot) { return `${id}/${userId}/${slot}`; }
  async function withUrls(db, id, userId, photos) {
    if (!photos?.length) return [];
    const data = checked(await db.storage.from(bucket).createSignedUrls(photos.map(photo => path(id,userId,photo.slot)), 3600));
    return photos.map((photo,index) => ({...photo,url:data[index]?.signedUrl || null}));
  }
  async function response(db, id, userId) {
    return checked(await db.from('birthday_responses').select('*').eq('event_id',id).eq('user_id',userId).maybeSingle());
  }
  async function view(db, row) {
    return {
      userId:row.user_id,name:row.name,accepted:row.accepted,story:row.story || '',
      updatedAt:row.updated_at,contributedAt:row.pending_upload ? null : row.contributed_at,
      pendingUpload:row.pending_upload,
      photos:row.pending_upload ? [] : await withUrls(db,row.event_id,row.user_id,row.photos || [])
    };
  }
  async function restoreGuest(id) {
    const current = await guest();
    if (!current) return null;
    const row = await response(current.db,id,current.user.id);
    return row ? view(current.db,row) : null;
  }
  async function saveRsvp({eventId:id,name,accepted}) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length>120) throw problem('invalid_name');
    if (typeof accepted !== 'boolean') throw problem('invalid_reply');
    const {db,user} = await guest(true);
    const row = checked(await db.from('birthday_responses').upsert({event_id:id,user_id:user.id,name:name.trim(),accepted},{onConflict:'event_id,user_id'}).select('name,accepted').single());
    return row;
  }
  async function validateFiles(files) {
    if (!Array.isArray(files) || files.length>3) throw problem('invalid_files');
    const descriptions = [];
    for (let i=0;i<files.length;i++) {
      const file=files[i];
      if (!file.size || file.size>20*1024*1024) throw problem('invalid_files');
      const bytes=new Uint8Array(await file.slice(0,32).arrayBuffer());
      const ascii=(start,end)=>String.fromCharCode(...bytes.slice(start,end));
      let type='';
      if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) type='image/jpeg';
      else if (bytes[0]===137 && ascii(1,4)==='PNG' && bytes[4]===13 && bytes[5]===10 && bytes[6]===26 && bytes[7]===10) type='image/png';
      else if (ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP') type='image/webp';
      else if (ascii(4,8)==='ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|heif)$/.test(ascii(8,12))) type=/^hei[cf]/.test(ascii(8,12))?'image/heic':'image/heif';
      if (!types.includes(type)) throw problem('invalid_files');
      descriptions.push({slot:i+1,name:file.name.slice(0,200),size:file.size,type});
    }
    return descriptions;
  }
  async function saveContribution({eventId:id,story,files=[],onProgress}) {
    if (typeof story!=='string' || !story.trim() || story.trim().length>3000) throw problem('invalid_story');
    const descriptions=await validateFiles(files);
    const current=await guest();
    if (!current) throw problem('session_expired');
    const {db,user}=current;
    const before=await response(db,id,user.id);
    if (!before) throw problem('session_expired');
    if (before.pending_upload && !files.length) throw problem('upload_incomplete');
    let photos=before.photos || [];
    if (files.length) {
      // Persist the story and mark the photo set incomplete before any overwrite.
      checked(await db.from('birthday_responses').update({story:story.trim(),pending_upload:true}).eq('event_id',id).eq('user_id',user.id).select('user_id').single());
      for (let i=0;i<files.length;i++) {
        checked(await db.storage.from(bucket).upload(path(id,user.id,i+1),files[i],{upsert:true,contentType:descriptions[i].type,cacheControl:'0'}),'upload_failed');
        onProgress?.({done:i+1,total:files.length});
      }
      const unused=[1,2,3].filter(slot=>slot>files.length).map(slot=>path(id,user.id,slot));
      if (unused.length) checked(await db.storage.from(bucket).remove(unused),'upload_failed');
      photos=descriptions;
    }
    const row=checked(await db.from('birthday_responses').update({story:story.trim(),photos,pending_upload:false,contributed_at:new Date().toISOString()}).eq('event_id',id).eq('user_id',user.id).select('*').single());
    // A failed preview URL must not turn an acknowledged save into a false failure.
    let saved;
    try { saved=await view(db,row); } catch { saved={name:row.name,story:row.story,photos:row.photos,contributedAt:row.contributed_at}; }
    return saved;
  }
  async function requireOrganiser() {
    const db=client('organiser');
    const data=checked(await db.auth.getSession());
    if (!data.session) return null;
    const allowed=checked(await db.rpc('birthday_is_organiser',{event_id:eventId}),'not_authorized');
    if (!allowed) throw problem('not_authorized');
    return {db,email:data.session.user.email};
  }
  async function organiserSession() {
    const current=await requireOrganiser();
    return current ? {email:current.email} : null;
  }
  async function signInOrganiser({email,password}) {
    const db=client('organiser');
    checked(await db.auth.signInWithPassword({email,password}),'not_authorized');
    try { return await organiserSession(); }
    catch(error) { await db.auth.signOut({scope:'local'}); throw error; }
  }
  async function signOutOrganiser() { checked(await client('organiser').auth.signOut({scope:'local'})); }
  async function listSubmissions(id) {
    const current=await requireOrganiser();
    if (!current) throw problem('not_authorized');
    const {db}=current;
    let rows=[];
    for (let offset=0;offset<10000;offset+=200) {
      const page=checked(await db.from('birthday_responses').select('*').eq('event_id',id).order('updated_at',{ascending:false}).range(offset,offset+199));
      rows.push(...page);
      if (page.length<200) break;
    }
    const result=[];
    // Small batches avoid a request burst when opening a large guest list.
    for(let i=0;i<rows.length;i+=8) result.push(...await Promise.all(rows.slice(i,i+8).map(row=>view(db,row))));
    return result;
  }
  async function deleteSubmission({eventId:id,userId}) {
    const current=await requireOrganiser();
    if (!current) throw problem('not_authorized');
    const {db}=current;
    checked(await db.storage.from(bucket).remove([1,2,3].map(slot=>path(id,userId,slot))));
    checked(await db.from('birthday_responses').delete().eq('event_id',id).eq('user_id',userId).select('user_id').single());
  }
  window.BirthdaySubmissions=Object.freeze({configured:ready,restoreGuest,saveRsvp,saveContribution,organiserSession,signInOrganiser,signOutOrganiser,listSubmissions,deleteSubmission});
})();
