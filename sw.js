// No build step. Paths are relative to the service-worker scope: /repo/ on GitHub Pages.
const VERSION='2026-11-12-v4-class4';
const SHELL='fire-equipment-shell-'+VERSION;
const DATA='fire-equipment-data-'+VERSION;
const SHELL_FILES=['./','./index.html','./styles.css','./src/app.js','./src/catalog.js','./src/legacy-diagrams.js','./manifest.webmanifest','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/icons/favicon.svg'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('fire-equipment-')&&!([SHELL,DATA].includes(k))&&k!=='fire-equipment-offline-pack-v4').map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith((async()=>{
  // Prefer current files online; use cached copies only if offline.
  try {
   const response=await fetch(req);
   if(response.ok){
    const target=await caches.open(req.mode==='navigate'?SHELL:DATA);
    target.put(req,response.clone()).catch(()=>{});
   }
   return response;
  } catch(e){
   const cached=await caches.match(req);
   if(cached)return cached;
   if(req.mode==='navigate') {
    const index=await caches.match(new URL('index.html',self.registration.scope).href);
    if(index)return index;
   }
   throw e;
  }
 })());
});
