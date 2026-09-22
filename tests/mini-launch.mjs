import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { planFunnel, assertPublicRoute, tailscaleHostname, hostingScript, launch } from '../local-server/launch.mjs';
import { prepareInstallation } from '../local-server/setup.mjs';
import { createServer } from '../local-server/server.mjs';
import { verifyLive } from '../local-server/verify-live.mjs';

const hostname='birthday-mini.example-tailnet.ts.net',origin=`https://${hostname}`,localPort=49200;
const route=(port,target=`http://127.0.0.1:${localPort}`)=>({TCP:{[port]:{HTTPS:true}},Web:{[`${hostname}:${port}`]:{Handlers:{'/':{Proxy:target}}}},AllowFunnel:{[`${hostname}:${port}`]:true}});
assert.equal(tailscaleHostname({BackendState:'Running',Self:{DNSName:hostname+'.',Online:true}}),hostname);
assert.throws(()=>tailscaleHostname({BackendState:'NeedsLogin'}),/connect/);
assert.throws(()=>tailscaleHostname({BackendState:'Running',Self:{DNSName:'evil.example.com'}}),/hostname/);
assert.equal(planFunnel({},hostname,localPort).port,443);
assert.equal(planFunnel(null,hostname,localPort).port,443);
assert.equal(planFunnel(route(8443),hostname,localPort).port,8443,'Reuse our own background port on updates');
assert.equal(planFunnel(route(443,'http://127.0.0.1:8123'),hostname,localPort).port,8443);
const privatePaths=route(443);privatePaths.Web[`${hostname}:443`].Handlers['/private']={Proxy:'http://127.0.0.1:3000'};
assert.equal(planFunnel(privatePaths,hostname,localPort).port,8443,'Never expose another private path');
assert.throws(()=>planFunnel(privatePaths,hostname,localPort,443),/already used/);
assert.equal(planFunnel({Foreground:{session:route(443)}},hostname,localPort).port,8443);
assert.throws(()=>planFunnel({TCP:{443:{HTTPS:true},8443:{HTTPS:true},10000:{HTTPS:true}}},hostname,localPort),/already used/);
assert.throws(()=>planFunnel({unrecognized:{port:443}},hostname,localPort),/Unrecognized/);
assert.throws(()=>planFunnel({},hostname,localPort,1234),/HTTPS port/);
const plan=planFunnel({},hostname,localPort);
assertPublicRoute(route(443),plan);
const privateRoute=route(443);privateRoute.AllowFunnel={};assert.throws(()=>assertPublicRoute(privateRoute,plan),/public route/);
assert.throws(()=>assertPublicRoute(privatePaths,plan),/public route/);
assert.throws(()=>hostingScript('http://localhost:49200'),/HTTPS/);
const generated=hostingScript(origin);
for (const [submissions,expected] of [[{url:'',publishableKey:''},{provider:'local',url:origin}],[{provider:'local',url:''},{provider:'local',url:''}],[{url:'http://localhost:57431',publishableKey:'legacy'},{url:'http://localhost:57431',publishableKey:'legacy'}]]) {
  const context={window:{BIRTHDAY_CONFIG:{submissions}}};vm.runInNewContext(generated,context);
  assert.equal(JSON.stringify(context.window.BIRTHDAY_CONFIG.submissions),JSON.stringify(expected));
}
const temp=mkdtempSync(join(tmpdir(),'saras30-launch-test-'));
let server;
try {
  const source=resolve(import.meta.dirname,'..');
  // Stage only public assets/helpers, never the developer's private files.
  const staged=prepareInstallation({source,'install-dir':join(temp,'source'),'prepare-only':true});
  const sourceCopy=join(temp,'source','app');
  const installDir=join(temp,'mini');
  let serve={},funnelCalls=0,checks=0;
  const dependencies={
    tailscale:'fake-tailscale',log:()=>{},
    run:(_binary,args)=>{
      if (args.join(' ')==='status --json') return JSON.stringify({BackendState:'Running',Self:{DNSName:hostname+'.',Online:true}});
      if (args[1]==='status') return JSON.stringify(serve);
      assert.deepEqual(args,['funnel','--bg','--https=443',`http://127.0.0.1:${localPort}`]);
      funnelCalls++;serve=route(443);return '';
    },
    install:opts=>prepareInstallation({...opts,activate:false,'prepare-only':true}),
    waitForLocal:async (url,event)=>{assert.equal(url,`http://127.0.0.1:${localPort}`);assert.equal(event,'sara-30-2026');},
    verify:async opts=>{assert.equal(opts.origin,origin);assert.equal(opts.eventId,'sara-30-2026');checks++;}
  };
  await launch({source:sourceCopy,installDir},dependencies);
  const configPath=join(installDir,'data','config.json');
  const before=readFileSync(configPath,'utf8'),login=readFileSync(join(installDir,'data','LOGIN.txt'),'utf8');
  assert.ok(JSON.parse(before).allowedOrigins.includes(origin));
  assert.ok(readFileSync(join(sourceCopy,'hosting-config.js'),'utf8').includes(origin));
  assert.ok(!readFileSync(join(sourceCopy,'hosting-config.js'),'utf8').includes(JSON.parse(before).signingSecret));
  assert.ok(JSON.parse(readFileSync(join(installDir,'public-connection.json'))).verifiedAt);
  await launch({source:sourceCopy,installDir},dependencies);
  assert.equal(readFileSync(configPath,'utf8'),before);assert.equal(readFileSync(join(installDir,'data','LOGIN.txt'),'utf8'),login);
  assert.equal(funnelCalls,2);assert.equal(checks,2);
  // Failed HTTPS checks do not advertise a working GitHub Pages connection.
  const disabledHosting=readFileSync(join(source,'hosting-config.js'),'utf8');
  writeFileSync(join(sourceCopy,'hosting-config.js'),disabledHosting);
  await assert.rejects(launch({source:sourceCopy,installDir},{...dependencies,verify:async()=>{throw new Error('Offline');}}),/No GitHub Pages connection was written/);
  assert.equal(readFileSync(join(sourceCopy,'hosting-config.js'),'utf8'),disabledHosting);
  assert.equal(JSON.parse(readFileSync(join(installDir,'public-connection.json'))).verifiedAt,null);
  // A newly discovered Mini hostname is allowed without rotating guest credentials.
  const existing=JSON.parse(before);existing.allowedOrigins=existing.allowedOrigins.filter(x=>x!==origin);writeFileSync(configPath,JSON.stringify(existing));
  await launch({source:sourceCopy,installDir},dependencies);
  assert.equal(JSON.parse(readFileSync(configPath)).signingSecret,existing.signingSecret);
  await launch({source:sourceCopy,installDir,localOnly:true},{...dependencies,run:()=>{throw new Error('Must not call Tailscale in local-only mode');}});
  // Use the actual installed server to exercise the launcher's full disposable test.
  server=await createServer({rootDir:join(installDir,'app'),dataDir:join(installDir,'data'),port:0});
  const base=`http://127.0.0.1:${server.address().port}`;
  await verifyLive({origin:base,dataDir:join(installDir,'data'),eventId:'sara-30-2026'});
  const auth=await fetch(base+'/api/organiser/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:'host@sara.local',password:login.match(/^Password: (.+)$/m)[1]})}).then(r=>r.json());
  const rows=await fetch(base+'/api/organiser/submissions?eventId=sara-30-2026',{headers:{Authorization:`Bearer ${auth.token}`}}).then(r=>r.json());
  assert.equal(rows.length,0,'The automatic setup record must be removed');
  await assert.rejects(verifyLive({origin:base,dataDir:join(installDir,'data'),eventId:'wrong-event'}),/different event/);
  const html=await fetch(base+'/').then(r=>r.text());assert.match(html,/hosting-config\.js/);
  const pageConfig=await fetch(base+'/event-config.js').then(r=>r.text());
  const hosting=await fetch(base+'/hosting-config.js').then(r=>r.text());
  const browser={window:{}};vm.runInNewContext(pageConfig+'\n'+hosting,browser);
  assert.equal(browser.window.BIRTHDAY_CONFIG.submissions.provider,'local');
  assert.equal(browser.window.BIRTHDAY_CONFIG.submissions.url,'','Local pages must not depend on the public tunnel');
  console.log('PASS: Tailscale detection/routing conflicts, repeat installs, private configuration preservation, failed-check handling, GitHub Pages configuration, and real RSVP/photo/organiser test with cleanup. No real Tailscale or LaunchAgent changes.');
} finally {
  if(server){await new Promise(resolve=>server.close(resolve));server.closeStore();}
  rmSync(temp,{recursive:true,force:true});
}
