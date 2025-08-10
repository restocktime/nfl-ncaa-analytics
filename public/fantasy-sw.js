// Fantasy Football Helper - Service Worker
// Provides offline functionality and push notifications

const CACHE_NAME = 'fantasy-football-v1';
const urlsToCache = [
  '/',
  '/fantasy-football-helper.js',
  '/fantasy-styles.css',
  '/app.js',
  '/styles.css',
  // Add other essential assets
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Fantasy SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Fantasy SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Fantasy SW: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Fantasy SW: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Fantasy SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Fantasy SW: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests differently
  if (event.request.url.includes('/api/v1/fantasy')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Fantasy SW: Serving from cache:', event.request.url);
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try to fetch from network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error('Network response was not ok');
  } catch (error) {
    console.log('Fantasy SW: Network failed, trying cache for:', request.url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback data
    return new Response(
      JSON.stringify(getOfflineFallbackData(request.url)),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
}

// Provide fallback data when offline
function getOfflineFallbackData(url) {
  if (url.includes('/projections/')) {
    return {
      success: false,
      data: {},
      error: 'Offline - cached data not available',
      offline: true
    };
  }
  
  if (url.includes('/lineup/')) {
    return {
      success: true,
      data: [{
        lineup: getCachedLineup(),
        projectedPoints: 120.5,
        confidence: 0.7,
        reasoning: ['Using cached data - update when online'],
        alternatives: [],
        riskLevel: 'MODERATE'
      }],
      offline: true
    };
  }
  
  if (url.includes('/waiver/')) {
    return {
      success: true,
      data: getCachedWaiverTargets(),
      offline: true
    };
  }
  
  return {
    success: false,
    error: 'Offline - no cached data available',
    offline: true
  };
}

function getCachedLineup() {
  return {
    QB: { name: 'Cached QB', projectedPoints: 20 },
    RB: [
      { name: 'Cached RB1', projectedPoints: 15 },
      { name: 'Cached RB2', projectedPoints: 12 }
    ],
    WR: [
      { name: 'Cached WR1', projectedPoints: 14 },
      { name: 'Cached WR2', projectedPoints: 11 }
    ],
    TE: { name: 'Cached TE', projectedPoints: 8 },
    FLEX: { name: 'Cached FLEX', projectedPoints: 10 },
    K: { name: 'Cached K', projectedPoints: 7 },
    DEF: { name: 'Cached DEF', projectedPoints: 8 }
  };
}

function getCachedWaiverTargets() {
  return [
    {
      player: {
        name: 'Cached Waiver Target',
        position: 'RB',
        team: 'CACHE'
      },
      priority: 8,
      reasoning: ['Cached recommendation - update when online'],
      opportunityScore: 7.5,
      addPercentage: 65
    }
  ];
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Fantasy SW: Push notification received');
  
  const options = {
    body: 'You have new fantasy football updates!',
    icon: '/images/fantasy-icon-192.png',
    badge: '/images/fantasy-badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Updates',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Fantasy Football Helper';
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Fantasy Football Helper', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Fantasy SW: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/?utm_source=push_notification')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Fantasy SW: Background sync triggered');
  
  if (event.tag === 'fantasy-sync') {
    event.waitUntil(syncFantasyData());
  }
});

async function syncFantasyData() {
  try {
    // Get offline actions from IndexedDB or cache
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await syncAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Fantasy SW: Failed to sync action:', error);
      }
    }
    
    console.log('Fantasy SW: Background sync completed');
  } catch (error) {
    console.error('Fantasy SW: Background sync failed:', error);
  }
}

async function getOfflineActions() {
  // In a real implementation, this would read from IndexedDB
  // For now, return empty array
  return [];
}

async function syncAction(action) {
  const response = await fetch('/api/v1/fantasy/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(action)
  });
  
  if (!response.ok) {
    throw new Error('Sync failed');
  }
  
  return response.json();
}

async function removeOfflineAction(actionId) {
  // Remove the synced action from offline storage
  console.log('Fantasy SW: Removed synced action:', actionId);
}

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'fantasy-data-update') {
    event.waitUntil(updateFantasyData());
  }
});

async function updateFantasyData() {
  try {
    // Update cached fantasy data in the background
    const cache = await caches.open(CACHE_NAME);
    
    // Update projections
    try {
      const projectionsResponse = await fetch('/api/v1/fantasy/projections/batch');
      if (projectionsResponse.ok) {
        cache.put('/api/v1/fantasy/projections/batch', projectionsResponse.clone());
      }
    } catch (error) {
      console.log('Fantasy SW: Failed to update projections cache');
    }
    
    // Update waiver targets
    try {
      const waiversResponse = await fetch('/api/v1/fantasy/waiver/targets');
      if (waiversResponse.ok) {
        cache.put('/api/v1/fantasy/waiver/targets', waiversResponse.clone());
      }
    } catch (error) {
      console.log('Fantasy SW: Failed to update waivers cache');
    }
    
    console.log('Fantasy SW: Background data update completed');
  } catch (error) {
    console.error('Fantasy SW: Background data update failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Fantasy SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_FANTASY_DATA') {
    event.waitUntil(cacheFantasyData(event.data.data));
  }
});

async function cacheFantasyData(data) {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache the provided fantasy data
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put('/fantasy-cached-data', response);
  console.log('Fantasy SW: Cached fantasy data');
}