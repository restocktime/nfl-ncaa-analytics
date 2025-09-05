// DOM Safety utilities to prevent null reference errors

// Safe DOM element access
function safeGetElement(id, defaultElement = null) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`🚨 Element with ID '${id}' not found in DOM`);
        if (defaultElement && typeof defaultElement === 'string') {
            // Create a temporary div if we have default HTML
            const temp = document.createElement('div');
            temp.innerHTML = defaultElement;
            return temp.firstChild;
        }
    }
    return element;
}

// Safe innerHTML setting
function safeSetInnerHTML(elementId, html) {
    const element = safeGetElement(elementId);
    if (element) {
        element.innerHTML = html;
        return true;
    } else {
        console.error(`🚨 Cannot set innerHTML for missing element: ${elementId}`);
        return false;
    }
}

// Log all available containers for debugging
function logAvailableContainers() {
    const containers = document.querySelectorAll('[id*="games"], [id*="container"], .games-grid');
    console.log('📋 Available containers:', Array.from(containers).map(el => ({
        id: el.id,
        class: el.className,
        tagName: el.tagName
    })));
}

// Make functions globally available
window.safeGetElement = safeGetElement;
window.safeSetInnerHTML = safeSetInnerHTML;
window.logAvailableContainers = logAvailableContainers;

// Auto-log containers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', logAvailableContainers);
} else {
    logAvailableContainers();
}

console.log('🛡️ DOM Safety utilities loaded');