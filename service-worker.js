const CACHE="qr-registro-v13"

const ASSETS=[

"./",
"./index.html",
"./app.js",
"./manifest.json",
"./logo.png",
"./icon-192.png",
"./icon-512.png"

]

self.addEventListener("install",e=>{

e.waitUntil(
caches.open(CACHE).then(cache=>cache.addAll(ASSETS))
)

self.skipWaiting()

})

self.addEventListener("activate",e=>{

e.waitUntil(
caches.keys().then(keys=>
Promise.all(
keys
.filter(key=>key!==CACHE)
.map(key=>caches.delete(key))
)
)
.then(()=>self.clients.claim())
)

})

/*
Primero red, después caché:
- Con internet siempre se carga la versión más nueva.
- Sin internet se usa la copia guardada (incluidas las librerías QR y Excel).
*/

self.addEventListener("fetch",e=>{

if(e.request.method!=="GET")return

e.respondWith(

fetch(e.request)
.then(res=>{

if(res && (res.ok || res.type==="opaque")){

const copia=res.clone()

caches.open(CACHE).then(cache=>cache.put(e.request,copia))

}

return res

})
.catch(()=>caches.match(e.request))

)

})
