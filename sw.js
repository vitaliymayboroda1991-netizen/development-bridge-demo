/* Development Bridge — офлайн-кеш демо. Список файлів генерується при збірці (asset-list.json). */
const CACHE = 'db-demo-v1'
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE)
    try {
      const list = await (await fetch('./asset-list.json', { cache: 'no-store' })).json()
      await c.addAll(['./', ...list])
    } catch (err) { /* кешуємо під час роботи */ }
    self.skipWaiting()
  })())
})
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
    self.clients.claim()
  })())
})
self.addEventListener('fetch', (e) => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin || r.headers.has('range')) return
  e.respondWith((async () => {
    const c = await caches.open(CACHE)
    // HTML — спершу мережа (щоб нова збірка підхоплювалась), офлайн — з кешу
    if (r.mode === 'navigate') {
      try { const res = await fetch(r); if (res.ok) c.put('./', res.clone()); return res }
      catch (err) { return (await c.match('./')) || Response.error() }
    }
    const hit = await c.match(r, { ignoreSearch: true })
    if (hit) return hit
    try {
      const res = await fetch(r)
      if (res.ok && res.status === 200) c.put(r, res.clone())
      return res
    } catch (err) {
      return (await c.match('./')) || Response.error()
    }
  })())
})
