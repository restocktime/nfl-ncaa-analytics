// Force refresh all cached JavaScript files
console.log('🔄 Force refreshing cached files...');

// Clear all cached JavaScript
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => {
            caches.delete(name);
        });
    });
}

// Force reload the page with no cache
setTimeout(() => {
    window.location.reload(true);
}, 500);