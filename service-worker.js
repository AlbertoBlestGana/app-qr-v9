const CACHE="qr-registro-v8"

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
caches.open(CACHE)
.then(cache=>cache.addAll(ASSETS))
)

self.skipWaiting()

})

self.addEventListener("activate",e=>{

e.waitUntil(
caches.keys().then(keys=>{

return Promise.all(

keys.map(key=>{

if(key!==CACHE){

return caches.delete(key)

}

})

)

})
)

self.clients.claim()

})

self.addEventListener("fetch",e=>{

e.respondWith(

caches.match(e.request)
.then(response=>{

return response || fetch(e.request)

})

)

})
