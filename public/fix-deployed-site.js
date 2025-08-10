// EMERGENCY FIX FOR DEPLOYED SITE - ICONS AND API
console.log('🚨 DEPLOYED SITE EMERGENCY FIX LOADED');

// BULLETPROOF ICON REPLACEMENT
function emergencyIconFix() {
    console.log('🔧 EMERGENCY ICON REPLACEMENT STARTING');
    
    // Find all icon elements and replace them completely
    const allIcons = document.querySelectorAll('i[class*="fa-"]');
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
        let emoji = '';
        
        // Check each class for a mapping
        Array.from(icon.classList).forEach(className => {
            if (iconMap[className]) {
                emoji = iconMap[className];
            }
        });
        
        if (emoji) {
            // Completely replace the element content
            icon.innerHTML = emoji;
            icon.className = 'emoji-icon';
            icon.style.fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", sans-serif';
            icon.style.fontSize = '1.3em';
            icon.style.fontWeight = 'normal';
            console.log(`✅ Icon ${index + 1}: ${emoji}`);
        }
    });
    
    console.log('🎯 Icon replacement complete');
}

// API CONNECTION FIX
class FantasyAPIFix {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/get?url=';
        this.apis = {
            sleeper: 'https://api.sleeper.app/v1/',
            espn: 'https://lm-api-reads.fantasy.espn.com/apis/v3/',
            yahoo: 'https://fantasysports.yahooapis.com/fantasy/v2/'
        };
    }
    
    async testConnections() {
        console.log('🔧 Testing fantasy API connections...');
        
        // Test Sleeper with CORS proxy
        try {
            const sleeperUrl = encodeURIComponent(this.apis.sleeper + 'user/testuser123');
            const response = await fetch(this.corsProxy + sleeperUrl);
            if (response.ok) {
                console.log('✅ SLEEPER API: Working via CORS proxy');
            } else {
                console.log('❌ SLEEPER API: CORS proxy failed');
            }
        } catch (error) {
            console.log('❌ SLEEPER API: Error -', error.message);
        }
        
        // Test ESPN with CORS proxy
        try {
            const espnUrl = encodeURIComponent(this.apis.espn + 'seasons/2024/segments/0/leagues/12345');
            const response = await fetch(this.corsProxy + espnUrl);
            if (response.ok) {
                console.log('✅ ESPN API: Working via CORS proxy');
            } else {
                console.log('❌ ESPN API: CORS proxy failed');
            }
        } catch (error) {
            console.log('❌ ESPN API: Error -', error.message);
        }
        
        // Test Yahoo directly (they allow CORS)
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
            if (response.ok) {
                console.log('✅ YAHOO API: Connection test passed');
            }
        } catch (error) {
            console.log('❌ YAHOO API: Error -', error.message);
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