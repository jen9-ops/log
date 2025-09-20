const CACHE_NAME = 'event-log-cache-v1';

// Список основных файлов, которые составляют "каркас" приложения.
const APP_SHELL_URLS = [
    './', // Главная страница (index.html)
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Этап установки: кэшируем основной "каркас" приложения
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэш открыт, кэширую каркас приложения');
                // Мы не блокируем установку, если какие-то из этих ресурсов не загрузятся.
                // Это делает установку более надежной.
                return cache.addAll(APP_SHELL_URLS).catch(error => {
                    console.warn('Не удалось закэшировать все ресурсы каркаса:', error);
                });
            })
    );
});

// Этап активации: удаляем старые кэши, чтобы приложение обновлялось
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаляю старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Этап перехвата запросов (fetch): здесь происходит вся магия
// Стратегия: "Сначала сеть, потом кэш" (Network First)
self.addEventListener('fetch', event => {
    // Мы обрабатываем только GET-запросы
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // 1. Пытаемся получить ответ из сети
        fetch(event.request)
            .then(networkResponse => {
                // 2. Если получилось, клонируем ответ и сохраняем его в кэш
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        // Кэшируем успешный ответ для будущего использования
                        cache.put(event.request, responseToCache);
                    });
                // 3. Возвращаем свежий ответ из сети
                return networkResponse;
            })
            .catch(() => {
                // 4. Если сеть недоступна, пытаемся найти ответ в кэше
                console.log('Сеть недоступна, ищу в кэше:', event.request.url);
                return caches.match(event.request);
            })
    );
});
