
const CACHE='ct-16bit-v1';
const CORE=['./','./index.html','./game.js','./manifest.webmanifest','./service-worker.js'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil((async()=>{ for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k); })()); self.clients.claim(); });
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return; e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{ const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return resp; }))); });
