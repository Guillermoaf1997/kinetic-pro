// Kinetic Pro · funciona sin conexión. Versión 3f405d09
var CACHE='kinetic-pro-3f405d09',FILES=["./", "index.html", "manifest.json", "firebase-bundle.js", "firebase-config.js", "fonts/anton-latin-400-normal.woff2", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/barlow-latin-700-normal.woff2", "fonts/oswald-latin-500-normal.woff2", "fonts/oswald-latin-600-normal.woff2", "fonts/oswald-latin-700-normal.woff2", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}).then(function(){return self.skipWaiting();}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);if(u.origin!==location.origin)return;
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(function(r){var cp=r.clone();caches.open(CACHE).then(function(c){c.put('index.html',cp);});return r;}).catch(function(){return caches.match('index.html');}));return;}
  e.respondWith(caches.match(e.request).then(function(r){return r||fetch(e.request);}));
});
