// Force clear all caches and reload
console.log('🔄 Starting complete cache clear...');

// Clear service worker caches
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    });
}

// Clear all browser caches
if ('caches' in window) {
    caches.keys().then(names => {
        names.forEach(name => {
            console.log(`🗑️ Deleting cache: ${name}`);
            caches.delete(name);
        });
    });
}

// Clear localStorage and sessionStorage
localStorage.clear();
sessionStorage.clear();

// Force reload without cache after short delay
setTimeout(() => {
    console.log('🔄 Force reloading page...');
    window.location.reload(true);
}, 1000);