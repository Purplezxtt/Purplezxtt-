const C="zeo-v3",F=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(new Request(u,{cache:"reload"}))))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))))});
