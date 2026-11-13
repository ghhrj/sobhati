const CACHE='sobhati-v1';
const FILES=['./','index.html','style.css','script.js','manifest.json','assets/skyline.svg','assets/corner.svg','assets/favicon.svg','assets/icon-192.png','assets/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
    if(r.ok&&(new URL(e.request.url).origin===location.origin||/fonts\.(googleapis|gstatic)/.test(e.request.url))){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
    return r;}).catch(()=>caches.match('index.html'))));
});
