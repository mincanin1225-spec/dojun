const CACHE='dojun-pwa-v63-shopstatus1';
const CORE=[
  './meal-stock-v63.js','./meal-workflow-v63.js','./legacy-inventory-v61-photo.js',
  './','./index.html','./manifest.webmanifest','./legacy-v24.html',
  './icons/icon-192.svg','./icons/icon-512.svg',
  './legacy-management-v29.js','./legacy-management-v30.js','./legacy-management-v31.js',
  './legacy-management-v32.js','./legacy-management-v32-1.js','./legacy-management-v33.js',
  './legacy-management-v34.js','./legacy-management-v35.js',
  './legacy-outing-v36.js','./legacy-outing-v37.js','./legacy-outing-v38.js',
  './legacy-fixes-v39.js','./legacy-outing-v40-seed.js','./legacy-outing-v41-no-embedded-map.js',
  './legacy-outing-v42-priority.js','./health-schedule-v43.js','./legacy-health-v43.js',
  './legacy-care-v45.js','./legacy-health-v44-entry-fix.js','./legacy-ui-v47.js',
  './legacy-health-v46-import.js','./src/ppeuni-verified-v49.js','./legacy-ppeuni-v58-safe.js'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>{
    const fresh=fetch(req).then(r=>{
      if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{})}
      return r;
    }).catch(()=>null);
    if(cached){event.waitUntil(fresh);return cached}
    return fresh.then(r=>r||caches.match(req,{ignoreSearch:true}));
  }));
});
