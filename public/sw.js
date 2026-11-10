const CACHE='smartspend-shell-v2';
const shellAssets=['/','/logo.svg','/manifest.webmanifest','/icon-192.png','/icon-512.png','/icon-maskable.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch(new Request('/',{cache:'reload'}));
 if(!response.ok)throw Error('Could not cache app shell');
 const html=await response.clone().text();
 const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+)"/g)].map(m=>m[1]);
 const cache=await caches.open(CACHE);
 await cache.put('/',response);
 await cache.addAll([...shellAssets.slice(1),...new Set(assets)]);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('smartspend-shell-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(async()=>{
   const cache=await caches.open(CACHE);
   return await cache.match('/',{ignoreVary:true})||new Response('SmartSpend is unavailable offline. Open it once while connected.',{status:503,headers:{'Content-Type':'text/plain'}});
  }));return;
 }
 if(url.pathname.startsWith('/assets/')||shellAssets.includes(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   // These are public same-origin shell assets, never user records. Module requests
   // carry Origin, unlike precache requests; Vary: Origin must not hide the cache.
   const hit=await cache.match(url.pathname,{ignoreVary:true});
   if(hit)return hit;
   const response=await fetch(event.request);
   if(response.ok)await cache.put(url.pathname,response.clone());
   return response;
  })());
 }
});
