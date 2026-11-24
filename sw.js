// Gestione Ordini FM · versione 6.8
// Il codice dell'app sta in cache per l'uso offline; i dati degli ordini restano solo sul telefono.
// Le pagine si scaricano sempre prima dalla rete (così gli aggiornamenti arrivano subito)
// e solo se manca la connessione si usa la copia in cache.
const CACHE = 'ordini-FM-6.8';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'pdf.min.mjs', 'pdf.worker.min.mjs', 'openjpeg.wasm', 'jbig2.wasm', 'qcms_bg.wasm'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, {cache: 'reload'}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !fonts) return;
  const isPage = req.mode === 'navigate' || (same && /(\/|\.html|\.webmanifest)$/.test(url.pathname));
  if (isPage) {
    // prima la rete, senza cache del browser; offline -> copia salvata
    e.respondWith(fetch(req, {cache: 'no-store'}).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(async () => (await caches.match(req, {ignoreSearch: true})) || (await caches.match('index.html')) || Response.error()));
    return;
  }
  // icone e font: prima la cache
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
    return r;
  })));
});
