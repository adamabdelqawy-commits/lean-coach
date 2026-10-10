/* Lean AI Coach service worker: receives server pushes and shows the notification */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

function readCfg() {
  return caches.open("lean-cfg").then(function (c) { return c.match("/cfg-lean"); })
    .then(function (r) { return r ? r.json() : null; }).catch(function () { return null; });
}

self.addEventListener("push", function (e) {
  var msgs = [];
  try {
    var d = e.data ? e.data.json() : null;
    msgs = Array.isArray(d) ? d : (d ? [d] : []);
  } catch (err) {
    try { msgs = [{ b: e.data.text() }]; } catch (e2) {}
  }
  if (!msgs.length) msgs = [{ b: "🔔 تذكير من Lean AI Coach" }];
  e.waitUntil(Promise.all(msgs.map(function (m, i) {
    return self.registration.showNotification("Lean AI Coach", {
      body: m.b,
      vibrate: [200, 100, 200],
      tag: m.g || ("lean-" + Date.now() + "-" + i),
    });
  })));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil((async function () {
    var cfg = await readCfg();
    var list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (var i = 0; i < list.length; i++) { if ("focus" in list[i]) return list[i].focus(); }
    return self.clients.openWindow((cfg && cfg.page) || self.registration.scope);
  })());
});