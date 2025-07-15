// 优化版 Service Worker - NFC智能家居管理系统
const CACHE_NAME = 'nfc-home-manager-v2.0';
const STATIC_CACHE = 'static-v2.0';
const DYNAMIC_CACHE = 'dynamic-v2.0';
const IMAGE_CACHE = 'images-v2.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/优化版-app.js',
  '/js/新功能模块.js',
  '/优化版-index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// 需要网络优先的API路径
const NETWORK_FIRST_PATHS = [
  '/api/boxes',
  '/api/items',
  '/api/dashboard',
  '/api/search'
];

// 需要缓存优先的资源路径
const CACHE_FIRST_PATHS = [
  '/uploads/',
  '/static/',
  'https://picsum.photos/'
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 安装中...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(IMAGE_CACHE)
    ]).then(() => {
      console.log('✅ Service Worker 安装完成');
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker 激活中...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('🗑️ 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker 激活完成');
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 智能缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 跨域请求直接转发
  if (url.origin !== location.origin && !isAllowedCDN(url.origin)) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// 处理请求的主要逻辑
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. API请求 - 网络优先策略
    if (isAPIRequest(url.pathname)) {
      return await networkFirst(request);
    }
    
    // 2. 图片资源 - 缓存优先策略
    if (isImageRequest(request)) {
      return await cacheFirst(request, IMAGE_CACHE);
    }
    
    // 3. 静态资源 - 缓存优先策略
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request, STATIC_CACHE);
    }
    
    // 4. 动态内容 - 网络优先策略
    return await networkFirst(request);
    
  } catch (error) {
    console.error('请求处理失败:', error);
    return getOfflineFallback(request);
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 成功响应时更新缓存
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📱 从缓存返回:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// 缓存优先策略
async function cacheFirst(request, cacheName = DYNAMIC_CACHE) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // 后台更新缓存
    updateCache(request, cacheName);
    return cachedResponse;
  }
  
  // 缓存中没有时从网络获取
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return getOfflineFallback(request);
  }
}

// 后台更新缓存
async function updateCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // 静默失败，不影响用户体验
  }
}

// 获取离线后备响应
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // API请求的离线响应
  if (isAPIRequest(url.pathname)) {
    return new Response(JSON.stringify({
      success: false,
      message: '网络连接不可用，请检查网络设置',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // HTML页面的离线响应
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/index.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // 图片的离线响应
  if (isImageRequest(request)) {
    return new Response(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <text x="100" y="100" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">
          离线状态
        </text>
      </svg>
    `, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
  
  return new Response('资源不可用', { status: 404 });
}

// 工具函数
function isAPIRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isStaticAsset(pathname) {
  return /\.(js|css|html|json)$/i.test(pathname) ||
         STATIC_ASSETS.some(asset => pathname.includes(asset));
}

function isAllowedCDN(origin) {
  const allowedCDNs = [
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://picsum.photos'
  ];
  return allowedCDNs.includes(origin);
}

// 后台同步功能
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 执行后台同步');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // 同步待上传的数据
    const pendingData = await getPendingData();
    if (pendingData.length > 0) {
      await syncPendingData(pendingData);
    }
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 推送通知
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'NFC家居管理系统有新消息',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看详情',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('NFC家居管理', options)
  );
});

// 通知点击处理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// 消息处理
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.payload)
    );
  }
});

// 缓存指定URLs
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}

// 获取待同步数据
async function getPendingData() {
  // 从IndexedDB获取待同步的数据
  return [];
}

// 同步待处理数据
async function syncPendingData(data) {
  for (const item of data) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('同步数据失败:', error);
    }
  }
}

console.log('🎉 Service Worker 已加载完成'); 