// Ситиус · Сделка без агента — работа без интернета. Версия кэша меняется при каждой публикации.
const V='sitius-app-7fc737ad5321';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k.startsWith('sitius-app-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const BASE=new URL('./',self.location).pathname;
function fresh(r){ // сначала сеть (свежая версия), при обрыве или долгом ответе — сохранённая копия
  const net=fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{if(res&&res.ok){const c=res.clone();caches.open(V).then(x=>x.put('./index.html',c))}return res});
  const cached=()=>caches.match('./index.html');
  return new Promise(ok=>{let done=false;const t=setTimeout(()=>{cached().then(m=>{if(m&&!done){done=true;ok(m)}})},4000);
    net.then(res=>{if(!done){done=true;clearTimeout(t);ok(res)}}).catch(()=>cached().then(m=>{if(!done){done=true;clearTimeout(t);ok(m||Response.error())}}))})}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin!==self.location.origin||!u.pathname.startsWith(BASE))return;
  if(r.mode==='navigate'||u.pathname===BASE||u.pathname===BASE+'index.html'){e.respondWith(fresh(r));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r)))});
