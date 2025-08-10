// EMERGENCY FIX FOR DEPLOYED SITE - ICONS AND API
console.log('🚨 DEPLOYED SITE EMERGENCY FIX LOADED');

// SMART ICON REPLACEMENT - PREVENTS DOUBLING
function emergencyIconFix() {
    console.log('🔧 SMART ICON REPLACEMENT STARTING');
    
    // Find all icon elements that haven't been replaced yet
    const allIcons = document.querySelectorAll('i[class*="fa-"]:not(.emoji-replaced)');
    console.log(`Found ${allIcons.length} icons to replace`);
    
    const iconMap = {
        'fa-tachometer-alt': '📊',
        'fa-play': '▶️',
        'fa-fire': '🔥',
        'fa-crystal-ball': '🔮',
        'fa-dice': '🎲',
        'fa-brain': '🧠',
        'fa-shield': '🛡️',
        'fa-user-friends': '👥',
        'fa-chart-bar': '📊',
        'fa-calendar': '📅',
        'fa-bullseye': '🎯',
        'fa-newspaper': '📰',
        'fa-trophy': '🏆',
        'fa-chart-line': '📈',
        'fa-users': '👥',
        'fa-user': '👤',
        'fa-cog': '⚙️',
        'fa-search': '🔍',
        'fa-home': '🏠'
    };
    
    allIcons.forEach((icon, index) => {
        // Skip if already replaced
        if (icon.classList.contains('emoji-replaced') || icon.innerHTML.match(/[\u{1F300}-\u{1F9FF}]/u)) {
            return;
        }
        
        let emoji = '';
        
        // Check each class for a mapping
        Array.from(icon.classList).forEach(className => {
            if (iconMap[className]) {
                emoji = iconMap[className];
            }
        });
        
        if (emoji) {
            // Check if Font Awesome is actually loaded by testing :before content
            const beforeContent = window.getComputedStyle(icon, ':before').content;
            const isFontAwesomeLoaded = beforeContent && beforeContent !== 'none' && beforeContent !== '""';
            
            // Only replace if Font Awesome isn't showing or shows as boxes
            if (!isFontAwesomeLoaded || beforeContent.includes('\\')) {
                icon.innerHTML = emoji;
                icon.className = 'emoji-icon emoji-replaced';
                icon.style.fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", sans-serif';
                icon.style.fontSize = '1.1em';
                icon.style.fontWeight = 'normal';
                icon.style.display = 'inline-block';
                icon.style.width = 'auto';
                icon.style.textAlign = 'center';
                icon.style.lineHeight = '1';
                icon.style.padding = '0 2px';
                console.log(`✅ Replaced: ${emoji}`);
            } else {
                icon.classList.add('emoji-replaced'); // Mark as processed but don't replace
                console.log(`⏭️ Skipped (Font Awesome loaded): ${icon.className}`);
            }
        }
    });
    
    console.log('🎯 Smart icon replacement complete');
}

// MULTI-PROXY API CONNECTION FIX
class FantasyAPIFix {
    constructor() {
        // Try multiple CORS proxies in case one fails
        this.corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/',
            'https://api.codetabs.com/v1/proxy?quest=',
            // Fallback to AllOrigins with different format
            {
                url: 'https://api.allorigins.win/raw?url=',
                name: 'allorigins-raw'
            },
            {
                url: 'https://api.allorigins.win/get?url=',
                name: 'allorigins-json',
                parseResponse: (data) => JSON.parse(data.contents)
            }
        ];
        
        this.apis = {
            sleeper: 'https://api.sleeper.app/v1/',
            espn: 'https://lm-api-reads.fantasy.espn.com/apis/v3/',
            yahoo: 'https://fantasysports.yahooapis.com/fantasy/v2/'
        };
    }
    
    async testWithProxy(proxy, url) {
        if (typeof proxy === 'string') {
            // Simple string proxy
            const response = await fetch(proxy + encodeURIComponent(url));
            if (response.ok) {
                return await response.json();
            }
            throw new Error(`HTTP ${response.status}`);
        } else {
            // Object proxy with special handling
            const response = await fetch(proxy.url + encodeURIComponent(url));
            if (response.ok) {
                const data = await response.json();
                return proxy.parseResponse ? proxy.parseResponse(data) : data;
            }
            throw new Error(`HTTP ${response.status}`);
        }
    }
    
    async connectToSleeper(username) {
        const url = this.apis.sleeper + `user/${username}`;
        console.log(`🔧 Testing Sleeper connection for: ${username}`);
        
        // Try each proxy until one works
        for (const proxy of this.corsProxies) {
            try {
                const proxyName = typeof proxy === 'string' ? proxy.split('/')[2] : proxy.name;
                console.log(`📡 Trying ${proxyName}...`);
                
                const userData = await this.testWithProxy(proxy, url);
                
                if (userData && userData.user_id) {
                    console.log(`✅ SUCCESS via ${proxyName}:`, userData.display_name || userData.username);
                    return userData;
                }
            } catch (error) {
                console.log(`❌ ${typeof proxy === 'string' ? proxy.split('/')[2] : proxy.name} failed:`, error.message);
            }
        }
        
        throw new Error('All proxy methods failed');
    }
    
    async testConnections() {
        console.log('🔧 Testing fantasy API connections with multiple proxies...');
        
        try {
            await this.connectToSleeper('testuser123');
        } catch (error) {
            console.log('❌ All Sleeper connection methods failed');
        }
        
        // Simple connectivity test
        try {
            const response = await fetch('https://httpbin.org/json');
            if (response.ok) {
                console.log('✅ Basic internet connectivity: OK');
            }
        } catch (error) {
            console.log('❌ Basic connectivity failed:', error.message);
        }
    }
}

// AUTO-EXECUTE ON LOAD
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DEPLOYED SITE FIX: DOM LOADED');
    
    // Fix icons immediately
    emergencyIconFix();
    
    // Fix icons again after delays
    setTimeout(emergencyIconFix, 500);
    setTimeout(emergencyIconFix, 1000);
    setTimeout(emergencyIconFix, 2000);
    
    // Test API connections
    const apiTester = new FantasyAPIFix();
    setTimeout(() => apiTester.testConnections(), 1000);
});

window.addEventListener('load', function() {
    console.log('🌐 WINDOW LOADED - FINAL FIX');
    emergencyIconFix();
    setTimeout(emergencyIconFix, 1000);
});

// Make functions globally available for manual testing
window.emergencyIconFix = emergencyIconFix;
window.FantasyAPIFix = FantasyAPIFix;

console.log('💪 EMERGENCY FIX SYSTEM READY');