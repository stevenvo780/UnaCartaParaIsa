/**
 * Service Worker para Una Carta Para Isa
 * Optimizado para caching de assets y diálogos fragmentados
 */

const CACHE_NAME = 'una-carta-para-isa-v1.0.0';
const STATIC_CACHE_NAME = 'static-assets-v1.0.0';
const DYNAMIC_CACHE_NAME = 'dynamic-content-v1.0.0';

// Assets críticos que se cachean inmediatamente
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js', // Después del build
  '/assets/animated_entities/entidad_circulo_happy_anim.png',
  '/assets/animated_entities/entidad_square_happy_anim.png',
  '/assets/animated_entities/entidad_circulo_sad_anim.png',
  '/assets/animated_entities/entidad_square_sad_anim.png'
];

// Patrones de assets que se cachean bajo demanda
const CACHEABLE_PATTERNS = [
  /\/assets\/.*\.(png|jpg|jpeg|gif|svg)$/,
  /\/dialogs\/chunks\/.*\.json$/,
  /\/src\/.*\.js$/,
  /\/fonts\/.*\.(woff|woff2|ttf)$/
];

// Assets grandes que se cachean con estrategia diferente
const LARGE_ASSET_PATTERNS = [
  /\/dialogs\/dialogos_chat_isa\.lite\.censored_plus\.json$/
];

/**
 * Instalación del service worker
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching critical assets...');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('✅ Critical assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache critical assets:', error);
      })
  );
});

/**
 * Activación del service worker
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Limpiar caches antiguos
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Interceptar requests
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Solo manejar requests HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estrategia optimizada según tipo de recurso
  if (shouldCache(request.url)) {
    if (isCriticalAsset(url.pathname)) {
      event.respondWith(handleCriticalAsset(request));
    } else if (isLargeAsset(url.pathname)) {
      event.respondWith(handleLargeAsset(request));
    } else if (isCacheableAsset(url.pathname)) {
      event.respondWith(handleCacheableAsset(request));
    } else {
      event.respondWith(handleNetworkFirst(request));
    }
  } else if (isDialogueChunk(url.pathname)) {
    event.respondWith(handleDialogueChunk(request));
  } else {
    // Network first para contenido dinámico
    event.respondWith(fetch(request));
  }
});

// Excluir JSONs dinámicos del cache
const DYNAMIC_PATTERNS = [
    /\/api\//,
    /\.json$/,
    /\/dialogues\//,
    /\/quests\//
];

function shouldCache(url) {
    const pathname = new URL(url).pathname;
    
    // No cachear contenido dinámico
    if (DYNAMIC_PATTERNS.some(pattern => pattern.test(pathname))) {
        return false;
    }
    
    return isCriticalAsset(pathname);
}

/**
 * Verificar si es asset crítico
 */
function isCriticalAsset(pathname) {
  return CRITICAL_ASSETS.some(asset => pathname.endsWith(asset));
}

/**
 * Verificar si es asset grande
 */
function isLargeAsset(pathname) {
  return LARGE_ASSET_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Verificar si es asset cacheable
 */
function isCacheableAsset(pathname) {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Verificar si es chunk de diálogo
 */
function isDialogueChunk(pathname) {
  return pathname.includes('/dialogs/chunks/');
}

/**
 * Manejar assets críticos - Cache First
 */
async function handleCriticalAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Failed to fetch critical asset:', request.url, error);
    // Retornar respuesta fallback si existe
    return new Response('Asset not available', { status: 503 });
  }
}

/**
 * Manejar assets grandes - Network First con streaming
 */
async function handleLargeAsset(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Para assets grandes, considerar caching selectivo
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      
      // Solo cachear si el asset es menor a 10MB
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) < 10 * 1024 * 1024) {
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch large asset:', request.url, error);
    
    // Intentar desde cache como fallback
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('🔄 Serving large asset from cache as fallback');
      return cached;
    }
    
    return new Response('Large asset not available', { status: 503 });
  }
}

/**
 * Manejar assets cacheables - Stale While Revalidate
 */
async function handleCacheableAsset(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  // Fetch en background para actualizar cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.warn('Background fetch failed for:', request.url, error);
  });
  
  // Retornar cached si existe, sino esperar network
  if (cached) {
    fetchPromise; // Ejecutar en background sin await
    return cached;
  }
  
  try {
    return await fetchPromise;
  } catch (error) {
    console.error('Failed to fetch cacheable asset:', request.url, error);
    return new Response('Asset not available', { status: 503 });
  }
}

/**
 * Manejar chunks de diálogos - Cache First con TTL
 */
async function handleDialogueChunk(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cached = await cache.match(request);
  
  // Verificar TTL del cache (24 horas)
  if (cached) {
    const cachedDate = cached.headers.get('sw-cache-date');
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate);
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      
      if (age < maxAge) {
        return cached;
      }
    }
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Añadir timestamp al cache
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cache-date': Date.now().toString()
        }
      });
      
      cache.put(request, responseToCache.clone());
      return responseToCache;
    }
    
    return response;
  } catch (error) {
    console.error('Failed to fetch dialogue chunk:', request.url, error);
    
    // Retornar cached aunque sea viejo
    if (cached) {
      console.log('🔄 Serving stale dialogue chunk');
      return cached;
    }
    
    return new Response('Dialogue chunk not available', { status: 503 });
  }
}

/**
 * Manejar otros recursos - Network First
 */
async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok && shouldCache(request)) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('Network request failed:', request.url, error);
    
    // Fallback a cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Fallback offline page si es navegación
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || 
             new Response('Page not available offline', { 
               status: 503,
               headers: { 'Content-Type': 'text/html' }
             });
    }
    
    return new Response('Resource not available', { status: 503 });
  }
}

/**
 * Verificar si se debe cachear el request
 */
function shouldCache(request) {
  // No cachear requests POST, PUT, DELETE
  if (request.method !== 'GET') {
    return false;
  }
  
  // No cachear requests con query params dinámicos
  const url = new URL(request.url);
  if (url.searchParams.has('t') || url.searchParams.has('_')) {
    return false;
  }
  
  return true;
}

/**
 * Manejar mensajes del cliente
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📱 Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing dynamic cache...');
    caches.delete(DYNAMIC_CACHE_NAME).then(() => {
      console.log('✅ Dynamic cache cleared');
      event.ports[0].postMessage({ success: true });
    }).catch((error) => {
      console.error('❌ Failed to clear cache:', error);
      event.ports[0].postMessage({ success: false, error: error.message });
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then((stats) => {
      event.ports[0].postMessage(stats);
    });
  }
});

/**
 * Obtener estadísticas de cache
 */
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      count: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  
  return stats;
}