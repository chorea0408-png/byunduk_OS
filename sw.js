/* 설치 가능성(installability) 확보용 최소 서비스워커. 오프라인 캐싱은 하지 않음. */
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});
