// sw.js

// Имя и версия кеша. Меняйте версию (v2, v3...), когда обновляете файлы приложения.
const CACHE_NAME = 'event-log-cache-v1';

// Список URL-адресов для кеширования. 
// Включает основные файлы и ресурсы с CDN для полноценной работы офлайн.
const URLS_TO_CACHE = [
  './', // Это псевдоним для index.html
  './index.html',
  './star.PNG',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/mgrs@2.0.0/mgrs.min.js'
];

// 1. Установка Service Worker и кеширование файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кеш открыт, добавляю файлы...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // Принудительно активируем новый Service Worker, не дожидаясь закрытия старых вкладок
        return self.skipWaiting();
      })
  );
});

// 2. Активация Service Worker и очистка старого кеша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Если имя кеша не совпадает с текущим, удаляем его
          if (cacheName !== CACHE_NAME) {
            console.log('Удаляю старый кеш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Захватываем контроль над открытыми страницами
      return self.clients.claim();
    })
  );
});

// 3. Обработка запросов (стратегия "сначала кеш, потом сеть")
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Если ресурс есть в кеше, возвращаем его
        if (response) {
          return response;
        }
        // Иначе, делаем запрос к сети
        return fetch(event.request).then(
          (networkResponse) => {
            // Можно добавить логику для кеширования новых запросов, но для базовой работы это не обязательно
            return networkResponse;
          }
        );
      })
  );
});