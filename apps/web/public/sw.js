const CACHE = "pique-shell-v1";
const SHELL = ["/", "/login", "/manifest.webmanifest", "/icon.svg"];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).pathname.startsWith("/api/")
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/")),
      ),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Pique", body: "Tienes una novedad." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // payload no era JSON: se usan los valores por defecto.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag,
      data: { href: payload.href || "/hoy" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.href || "/hoy";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find(
          (client) => new URL(client.url).pathname === targetUrl,
        );
        if (existing) return existing.focus();
        const client = clients[0];
        if (client && "navigate" in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
        return self.clients.openWindow(targetUrl);
      }),
  );
});
