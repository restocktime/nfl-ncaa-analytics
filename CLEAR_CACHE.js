// 🧹 FORCE CLEAR ALL CACHES AND RELOAD WITH FRESH DATA
// Copy and paste this into your browser console (F12 → Console tab)

console.log('🧹 Clearing all caches...');

// Clear the NFL Database Client cache
if (window.nflDatabaseClient) {
    window.nflDatabaseClient.clearCache();
    console.log('✅ Cleared nflDatabaseClient cache');
}

// Clear global rosters
if (window.globalNFLRosters) {
    delete window.globalNFLRosters;
    console.log('✅ Cleared globalNFLRosters');
}

// Clear real ML analyzer cache
if (window.realMLAnalyzer && window.realMLAnalyzer.analysisCache) {
    window.realMLAnalyzer.analysisCache.clear();
    console.log('✅ Cleared realMLAnalyzer cache');
}

// Clear localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

console.log('');
console.log('🔄 Now refreshing page to load fresh data from railway-config.js...');
console.log('');

// Wait 1 second then reload
setTimeout(() => {
    location.reload(true); // Hard reload
}, 1000);
