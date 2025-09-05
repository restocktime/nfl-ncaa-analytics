// Force fresh load by adding timestamp to all script and CSS imports
console.log('🔄 Force Fresh Load starting...');

// Add timestamp to prevent caching
const timestamp = Date.now();
const scripts = document.querySelectorAll('script[src]');
const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

// Update script sources with cache buster
scripts.forEach(script => {
    if (!script.src.includes('_t=')) {
        const separator = script.src.includes('?') ? '&' : '?';
        script.src = script.src + separator + '_t=' + timestamp;
    }
});

// Update stylesheet sources with cache buster  
stylesheets.forEach(link => {
    if (!link.href.includes('_t=')) {
        const separator = link.href.includes('?') ? '&' : '?';
        link.href = link.href + separator + '_t=' + timestamp;
    }
});

console.log('🔄 Force Fresh Load completed with timestamp:', timestamp);