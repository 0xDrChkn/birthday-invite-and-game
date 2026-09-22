/* A single local service stores submissions; the browser keeps only its edit token. */
(() => {
  'use strict';
  const settings = window.BIRTHDAY_CONFIG?.submissions;
  if (settings?.provider !== 'local') return;
  function problem(code) { return Object.assign(new Error(code), {code}); }
  let base;
  try {
    base = new URL(settings.url || window.location.origin);
    if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error();
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(base.hostname))) throw new Error();
  } catch { window.BirthdaySubmissions = Object.freeze({configured:false}); return; }
  const storageKey = `birthday-local:${base.origin}:${window.BIRTHDAY_CONFIG.id}`;
  let guest = null;
  let organiser = null;
  try { guest = JSON.parse(localStorage.getItem(`${storageKey}:guest`) || 'null'); } catch {}
  try { organiser = JSON.parse(sessionStorage.getItem(`${storageKey}:host`) || 'null'); } catch {}
  function keepGuest(value) {
    // Persist before the first request so a lost response can be retried safely.
    try { localStorage.setItem(`${storageKey}:guest`, JSON.stringify(value)); }
    catch { throw problem('storage_unavailable'); }
    guest = value;
  }
  function keepHost(value) {
    organiser = value;
    try {
      if (value) sessionStorage.setItem(`${storageKey}:host`, JSON.stringify(value));
      else sessionStorage.removeItem(`${storageKey}:host`);
    } catch { /* In-memory organiser access still works until this tab closes. */ }
  }
  async function request(path, {method='GET', body, token, upload=false}={}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), upload ? 120000 : 25000);
    const headers = {Accept:'application/json'};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) { headers['Content-Type']='application/json'; body=JSON.stringify(body); }
    try {
      const response = await fetch(new URL(path,base), {method,headers,body,signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
      const value = response.status === 204 ? null : await response.json();
      if (!response.ok) throw problem(value?.code || value?.error?.code || (response.status===401 ? 'session_expired' : 'unavailable'));
      return value;
    } catch (error) {
      if (error.name === 'AbortError') throw problem('network_timeout');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function view(row) {
    if (!row) return row;
    return {...row,photos:(row.photos || []).map(photo => ({...photo,url:photo.url ? new URL(photo.url,base).href : null}))};
  }
  async function restoreGuest(eventId) {
    if (!guest?.token) return null;
    return view(await request(`/api/guest?eventId=${encodeURIComponent(eventId)}`,{token:guest.token}));
  }
  async function saveRsvp({eventId,name,email='',accepted}) {
    if (!guest?.requestId) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      keepGuest({...guest,requestId:[...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')});
    }
    const result = await request('/api/rsvp',{method:'POST',body:{eventId,name,email,accepted,requestId:guest.requestId,token:guest.token}});
    if (!result?.token || !result.reply) throw problem('unavailable');
    keepGuest({...guest,token:result.token});
    return view(result.reply);
  }
  async function saveContribution({eventId,story,files=[],onProgress}) {
    if (!guest?.token) throw problem('session_expired');
    const body = new FormData();
    body.append('eventId',eventId); body.append('story',story);
    files.forEach(file=>body.append('photos',file,file.name));
    // The browser reports a completed upload only when the server confirms its save.
    onProgress?.({done:0,total:files.length});
    const result = view(await request('/api/contribution',{method:'POST',body,token:guest.token,upload:true}));
    onProgress?.({done:files.length,total:files.length});
    return result;
  }
  async function organiserSession() {
    if (!organiser?.token) return null;
    try { return await request('/api/organiser/session',{token:organiser.token}); }
    catch (error) { if (error.code === 'session_expired' || error.code === 'not_authorized') {keepHost(null);return null;} throw error; }
  }
  async function signInOrganiser({email,password}) {
    const result = await request('/api/organiser/login',{method:'POST',body:{email,password}});
    if (!result?.token || !result.user?.email) throw problem('not_authorized');
    keepHost(result); return result.user;
  }
  async function signOutOrganiser() {
    const token = organiser?.token;
    keepHost(null);
    if (token) await request('/api/organiser/logout',{method:'POST',token});
  }
  async function listSubmissions(eventId) {
    if (!organiser?.token) throw problem('not_authorized');
    const rows = await request(`/api/organiser/submissions?eventId=${encodeURIComponent(eventId)}`,{token:organiser.token});
    return rows.map(view);
  }
  async function deleteSubmission({eventId,userId}) {
    if (!organiser?.token) throw problem('not_authorized');
    return request(`/api/organiser/submission?eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(userId)}`,{method:'DELETE',token:organiser.token});
  }
  window.BirthdaySubmissions = Object.freeze({configured:true,supportsEmail:true,allowsPhotoOnly:true,restoreGuest,saveRsvp,saveContribution,organiserSession,signInOrganiser,signOutOrganiser,listSubmissions,deleteSubmission});
})();
