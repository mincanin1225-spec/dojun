const CACHE='dojun-pwa-v55-rescue';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([
  self.registration.unregister().catch(()=>false),
  caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>[]),
  self.clients.claim().catch(()=>{})
]));});
self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));});
