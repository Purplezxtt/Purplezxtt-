const C="zeo-v6",R="zeo-cdn-v1",F=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>c.add(new Request(u,{cache:"reload"}))))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==R).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url);
 if(u.hostname==="cdn.emulatorjs.org"){e.respondWith(caches.open(R).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok&&n.status===200)c.put(e.request,n.clone());return n}))));return}
 if(u.origin!==location.origin)return;
 const nav=e.request.mode==="navigate"&&!u.searchParams.has("noiso");
 const iso=r=>{if(!nav||!r||r.status===0)return r;const h=new Headers(r.headers);h.set("Cross-Origin-Opener-Policy","same-origin");h.set("Cross-Origin-Embedder-Policy","credentialless");return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})};
 e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k))}return iso(r)}).catch(()=>caches.match(e.request).then(r=>iso(r||null)||caches.match("index.html").then(iso))))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus" in c)return c.focus()}return clients.openWindow("./")}))});
