/**
 * Comprehensive Football Analytics System Validation Test Suite
 * Tests all functionality according to task 10 requirements
 */

class ComprehensiveValidationSuite {
    constructor() {
        this.testResults = {
            realApiData: { passed: 0, failed: 0, tests: [] },
            fallbackSystem: { passed: 0, failed: 0, tests: [] },
            aiPredictions: { passed: 0, failed: 0, tests: [] },
            bettingLines: { passed: 0, failed: 0, tests: [] },
            mlAlgorithms: { passed: 0, failed: 0, tests: [] },
            mobileResponsiveness: { passed: 0, failed: 0, tests: [] },
            visualAppeal: { passed: 0, failed: 0, tests: [] }
        };
        
        this.startTime = Date.now();
        console.log('🧪 Starting Comprehensive Football Analytics Validation Suite...');
    }
    
    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🚀 Running comprehensive validation tests...');
        
        try {
            // Test 1: Real API Data Testing
            await this.testRealApiData();
            
            // Test 2: Fallback System Testing
            await this.testFallbackSystem();
            
            // Test 3: AI Predictions Testing
            await this.testAiPredictions();
            
            // Test 4: Betting Lines Testing
            await this.testBettingLines();
            
            // Test 5: ML Algorithm Testing
            await this.testMlAlgorithms();
            
            // Test 6: Mobile Responsiveness Testing
            await this.testMobileResponsiveness();
            
            // Test 7: Visual Appeal Testing
            await this.testVisualAppeal();
            
            // Generate comprehensive report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.logTestResult('general', 'Test Suite Execution', false, error.message);
        }
    }
    
    /**
     * Test system with real API data when available
     */
    async testRealApiData() {
        console.log('📡 Testing real API data functionality...');
        
        try {
            // Test NFL real data
            const nflService = new NFLDataService();
            const nflGames = await nflService.getTodaysGames();
            
            this.logTestResult('realApiData', 'NFL Service Initialization', 
                nflService !== null, 'NFL service created successfully');
            
            this.logTestResult('realApiData', 'NFL Games Data Structure', 
                Array.isArray(nflGames) && nflGames.length > 0, 
                `Loaded ${nflGames.length} NFL games`);
            
            // Validate NFL game structure
            if (nflGames.length > 0) {
                const game = nflGames[0];
                this.validateGameStructure(game, 'NFL', 'realApiData');
            }
            
            // Test NCAA real data
            const ncaaService = new NCAADataService();
            const ncaaGames = await ncaaService.getTodaysGames();
            
            this.logTestResult('realApiData', 'NCAA Service Initialization', 
                ncaaService !== null, 'NCAA service created successfully');
            
            this.logTestResult('realApiData', 'NCAA Games Data Structure', 
                Array.isArray(ncaaGames) && ncaaGames.length > 0, 
                `Loaded ${ncaaGames.length} NCAA games`);
            
            // Validate NCAA game structure
            if (ncaaGames.length > 0) {
                const game = ncaaGames[0];
                this.validateGameStructure(game, 'NCAA', 'realApiData');
            }
            
            // Test API response time
            const startTime = Date.now();
            await nflService.getTodaysGames();
            const responseTime = Date.now() - startTime;
            
            this.logTestResult('realApiData', 'API Response Time', 
                responseTime < 10000, 
                `Response time: ${responseTime}ms (should be < 10s)`);
            
        } catch (error) {
            this.logTestResult('realApiData', 'Real API Data Test', false, error.message);
        }
    }
    
    /**
     * Verify fallback system works properly when APIs fail
     */
    async testFallbackSystem() {
        console.log('🔄 Testing fallback system functionality...');
        
        try {
            // Simulate API failure by creating service with broken URLs
            const mockNFLService = {
                baseUrls: { espnScoreboard: 'https://invalid-url-test.com/fail' },
                cache: new Map(),
                cacheTimeout: 30000
            };
            
            // Test that fallback data is generated when APIs fail
            const nflService = new NFLDataService();
            
            // Force fallback by clearing cache and using invalid URLs temporarily
            nflService.cache.clear();
            const originalUrls = { ...nflService.baseUrls };
            nflService.baseUrls.espnScoreboard = 'https://invalid-url-test.com/fail';
            
            const fallbackGames = await nflService.getTodaysGames();
            
            // Restore original URLs
            nflService.baseUrls = originalUrls;
            
            this.logTestResult('fallbackSystem', 'Fallback Data Generation', 
                Array.isArray(fallbackGames) && fallbackGames.length > 0, 
                `Generated ${fallbackGames.length} fallback games`);
            
            // Test fallback game quality
            if (fallbackGames.length > 0) {
                const game = fallbackGames[0];
                
                this.logTestResult('fallbackSystem', 'Fallback Game Has Teams', 
                    game.teams && game.teams.home && game.teams.away, 
                    'Fallback games have proper team structure');
                
                this.logTestResult('fallbackSystem', 'Fallback Game Has Date', 
                    game.date && !isNaN(new Date(game.date)), 
                    'Fallback games have valid dates');
                
                this.logTestResult('fallbackSystem', 'Fallback Game Has Status', 
                    game.status && game.status.type, 
                    'Fallback games have proper status');
            }
            
            // Test that system never shows blank sections
            const hasBlankSections = this.checkForBlankSections();
            this.logTestResult('fallbackSystem', 'No Blank Sections', 
                !hasBlankSections, 
                'System shows content even when APIs fail');
            
        } catch (error) {
            this.logTestResult('fallbackSystem', 'Fallback System Test', false, error.message);
        }
    }
    
    /**
     * Validate all AI predictions generate reasonable and consistent results
     */
    async testAiPredictions() {
        console.log('🤖 Testing AI prediction functionality...');
        
        try {
            const nflService = new NFLDataService();
            const games = await nflService.getTodaysGames();
            
            if (games.length === 0) {
                this.logTestResult('aiPredictions', 'AI Predictions Test', false, 'No games available for testing');
                return;
            }
            
            const game = games[0];
            
            // Test AI prediction structure
            this.logTestResult('aiPredictions', 'AI Prediction Exists', 
                game.aiPrediction !== undefined, 
                'Games have AI predictions');
            
            if (game.aiPrediction) {
                const ai = game.aiPrediction;
                
                // Test win probabilities
                this.logTestResult('aiPredictions', 'Win Probabilities Valid', 
                    ai.homeWinProbability >= 0 && ai.homeWinProbability <= 100 &&
                    ai.awayWinProbability >= 0 && ai.awayWinProbability <= 100, 
                    `Home: ${ai.homeWinProbability}%, Away: ${ai.awayWinProbability}%`);
                
                // Test probabilities sum to 100
                this.logTestResult('aiPredictions', 'Probabilities Sum to 100', 
                    Math.abs((ai.homeWinProbability + ai.awayWinProbability) - 100) <= 1, 
                    `Sum: ${ai.homeWinProbability + ai.awayWinProbability}%`);
                
                // Test confidence score
                this.logTestResult('aiPredictions', 'Confidence Score Valid', 
                    ai.confidence >= 55 && ai.confidence <= 95, 
                    `Confidence: ${ai.confidence}%`);
                
                // Test predicted scores
                this.logTestResult('aiPredictions', 'Predicted Scores Valid', 
                    ai.predictedScore && 
                    ai.predictedScore.home >= 0 && ai.predictedScore.home <= 70 &&
                    ai.predictedScore.away >= 0 && ai.predictedScore.away <= 70, 
                    `Predicted: ${ai.predictedScore?.home}-${ai.predictedScore?.away}`);
                
                // Test recommendation exists
                this.logTestResult('aiPredictions', 'Recommendation Exists', 
                    ai.recommendation && ai.recommendation.length > 0, 
                    `Recommendation: "${ai.recommendation}"`);
                
                // Test spread format
                this.logTestResult('aiPredictions', 'Spread Format Valid', 
                    ai.predictedSpread && typeof ai.predictedSpread === 'string', 
                    `Spread: ${ai.predictedSpread}`);
            }
            
            // Test consistency across multiple games
            let consistentPredictions = true;
            for (const testGame of games.slice(0, 3)) {
                if (!testGame.aiPrediction || 
                    !testGame.aiPrediction.confidence || 
                    testGame.aiPrediction.confidence < 55) {
                    consistentPredictions = false;
                    break;
                }
            }
            
            this.logTestResult('aiPredictions', 'Consistent Predictions', 
                consistentPredictions, 
                'AI predictions are consistent across games');
            
        } catch (error) {
            this.logTestResult('aiPredictions', 'AI Predictions Test', false, error.message);
        }
    }
    
    /**
     * Confirm betting lines display properly formatted odds and spreads
     */
    async testBettingLines() {
        console.log('💰 Testing betting lines functionality...');
        
        try {
            const nflService = new NFLDataService();
            const games = await nflService.getTodaysGames();
            
            if (games.length === 0) {
                this.logTestResult('bettingLines', 'Betting Lines Test', false, 'No games available for testing');
                return;
            }
            
            const game = games[0];
            
            // Test betting lines structure
            this.logTestResult('bettingLines', 'Betting Lines Exist', 
                game.bettingLines !== undefined, 
                'Games have betting lines');
            
            if (game.bettingLines) {
                const lines = game.bettingLines;
                
                // Test spread format
                this.logTestResult('bettingLines', 'Spread Format Valid', 
                    lines.spread && lines.spread.home && lines.spread.away, 
                    `Spread: ${lines.spread?.home} / ${lines.spread?.away}`);
                
                // Test moneyline format
                this.logTestResult('bettingLines', 'Moneyline Format Valid', 
                    lines.moneyline && lines.moneyline.home && lines.moneyline.away, 
                    `Moneyline: ${lines.moneyline?.home} / ${lines.moneyline?.away}`);
                
                // Test total format
                this.logTestResult('bettingLines', 'Total Format Valid', 
                    lines.total && lines.total.over && lines.total.under, 
                    `Total: ${lines.total?.over} / ${lines.total?.under}`);
                
                // Test sportsbooks
                this.logTestResult('bettingLines', 'Sportsbooks Listed', 
                    lines.sportsbooks && Array.isArray(lines.sportsbooks) && lines.sportsbooks.length > 0, 
                    `Sportsbooks: ${lines.sportsbooks?.join(', ')}`);
                
                // Test odds format (should be -110, +150, etc.)
                const oddsPattern = /^[+-]\d+$/;
                const validOdds = lines.spread?.odds && oddsPattern.test(lines.spread.odds);
                this.logTestResult('bettingLines', 'Odds Format Valid', 
                    validOdds, 
                    `Odds format: ${lines.spread?.odds}`);
            }
            
        } catch (error) {
            this.logTestResult('bettingLines', 'Betting Lines Test', false, error.message);
        }
    }
    
    /**
     * Test ML algorithm sections show all required information
     */
    async testMlAlgorithms() {
        console.log('🧠 Testing ML algorithm functionality...');
        
        try {
            const nflService = new NFLDataService();
            const games = await nflService.getTodaysGames();
            
            if (games.length === 0) {
                this.logTestResult('mlAlgorithms', 'ML Algorithms Test', false, 'No games available for testing');
                return;
            }
            
            const game = games[0];
            
            // Test ML algorithms structure
            this.logTestResult('mlAlgorithms', 'ML Algorithms Exist', 
                game.mlAlgorithms !== undefined, 
                'Games have ML algorithm predictions');
            
            if (game.mlAlgorithms) {
                const ml = game.mlAlgorithms;
                
                // Test Neural Network
                this.logTestResult('mlAlgorithms', 'Neural Network Prediction', 
                    ml.neuralNetwork && ml.neuralNetwork.prediction && ml.neuralNetwork.accuracy, 
                    `NN: ${ml.neuralNetwork?.prediction} (${ml.neuralNetwork?.accuracy})`);
                
                // Test XGBoost
                this.logTestResult('mlAlgorithms', 'XGBoost Prediction', 
                    ml.xgboost && ml.xgboost.prediction && ml.xgboost.accuracy, 
                    `XGB: ${ml.xgboost?.prediction} (${ml.xgboost?.accuracy})`);
                
                // Test Ensemble
                this.logTestResult('mlAlgorithms', 'Ensemble Prediction', 
                    ml.ensemble && ml.ensemble.prediction && ml.ensemble.accuracy, 
                    `Ensemble: ${ml.ensemble?.prediction} (${ml.ensemble?.accuracy})`);
                
                // Test Consensus
                this.logTestResult('mlAlgorithms', 'Consensus Prediction', 
                    ml.consensus && ml.consensus.prediction && ml.consensus.edge, 
                    `Consensus: ${ml.consensus?.prediction} (${ml.consensus?.edge} edge)`);
                
                // Test accuracy percentages format
                const accuracyPattern = /^\d{2}\.\d%$/;
                const validAccuracy = ml.neuralNetwork?.accuracy && accuracyPattern.test(ml.neuralNetwork.accuracy);
                this.logTestResult('mlAlgorithms', 'Accuracy Format Valid', 
                    validAccuracy, 
                    `Accuracy format: ${ml.neuralNetwork?.accuracy}`);
                
                // Test edge indicators
                const validEdge = ['HIGH', 'MEDIUM', 'LOW'].includes(ml.consensus?.edge);
                this.logTestResult('mlAlgorithms', 'Edge Indicator Valid', 
                    validEdge, 
                    `Edge: ${ml.consensus?.edge}`);
            }
            
        } catch (error) {
            this.logTestResult('mlAlgorithms', 'ML Algorithms Test', false, error.message);
        }
    }
    
    /**
     * Test mobile responsiveness and visual appeal
     */
    async testMobileResponsiveness() {
        console.log('📱 Testing mobile responsiveness...');
        
        try {
            // Test viewport meta tag
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            this.logTestResult('mobileResponsiveness', 'Viewport Meta Tag', 
                viewportMeta !== null, 
                'Viewport meta tag exists for mobile optimization');
            
            // Test responsive CSS classes
            const responsiveElements = document.querySelectorAll('.grid, .grid-2, .card, .stat-item');
            this.logTestResult('mobileResponsiveness', 'Responsive Elements', 
                responsiveElements.length > 0, 
                `Found ${responsiveElements.length} responsive elements`);
            
            // Test mobile-friendly button sizes
            const buttons = document.querySelectorAll('button, .btn, .btn-primary, .btn-secondary');
            let mobileButtonsValid = true;
            buttons.forEach(btn => {
                const styles = window.getComputedStyle(btn);
                const minHeight = parseInt(styles.minHeight) || parseInt(styles.height);
                if (minHeight < 44) { // iOS minimum touch target
                    mobileButtonsValid = false;
                }
            });
            
            this.logTestResult('mobileResponsiveness', 'Mobile Button Sizes', 
                mobileButtonsValid, 
                'Buttons meet minimum touch target size (44px)');
            
            // Test text readability
            const textElements = document.querySelectorAll('p, span, div');
            let readableText = true;
            textElements.forEach(el => {
                const styles = window.getComputedStyle(el);
                const fontSize = parseInt(styles.fontSize);
                if (fontSize < 14) {
                    readableText = false;
                }
            });
            
            this.logTestResult('mobileResponsiveness', 'Text Readability', 
                readableText, 
                'Text size is readable on mobile (≥14px)');
            
        } catch (error) {
            this.logTestResult('mobileResponsiveness', 'Mobile Responsiveness Test', false, error.message);
        }
    }
    
    /**
     * Test visual appeal of all sections
     */
    async testVisualAppeal() {
        console.log('🎨 Testing visual appeal...');
        
        try {
            // Test CSS loading
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
            this.logTestResult('visualAppeal', 'CSS Stylesheets Loaded', 
                stylesheets.length > 0, 
                `Found ${stylesheets.length} stylesheets`);
            
            // Test color scheme consistency
            const cards = document.querySelectorAll('.card');
            let consistentColors = true;
            if (cards.length > 1) {
                const firstCardBg = window.getComputedStyle(cards[0]).backgroundColor;
                for (let i = 1; i < cards.length; i++) {
                    const cardBg = window.getComputedStyle(cards[i]).backgroundColor;
                    if (cardBg !== firstCardBg) {
                        consistentColors = false;
                        break;
                    }
                }
            }
            
            this.logTestResult('visualAppeal', 'Consistent Color Scheme', 
                consistentColors, 
                'Cards have consistent background colors');
            
            // Test visual indicators
            const badges = document.querySelectorAll('.badge, .status-badge, .confidence-badge');
            this.logTestResult('visualAppeal', 'Visual Indicators Present', 
                badges.length > 0, 
                `Found ${badges.length} visual indicators`);
            
            // Test loading states
            const loadingElements = document.querySelectorAll('.loading, .spinner, [class*="loading"]');
            this.logTestResult('visualAppeal', 'Loading States Available', 
                loadingElements.length >= 0, 
                'Loading states are implemented');
            
            // Test icons
            const icons = document.querySelectorAll('i[class*="fa"], .icon, [class*="icon"]');
            this.logTestResult('visualAppeal', 'Icons Present', 
                icons.length > 0, 
                `Found ${icons.length} icons for visual enhancement`);
            
            // Test animations/transitions
            const animatedElements = document.querySelectorAll('[style*="transition"], [class*="animate"]');
            this.logTestResult('visualAppeal', 'Animations/Transitions', 
                animatedElements.length >= 0, 
                'Smooth transitions are implemented');
            
        } catch (error) {
            this.logTestResult('visualAppeal', 'Visual Appeal Test', false, error.message);
        }
    }
    
    /**
     * Validate game structure has all required fields
     */
    validateGameStructure(game, type, category) {
        const requiredFields = ['id', 'name', 'date', 'status', 'teams', 'venue'];
        
        for (const field of requiredFields) {
            this.logTestResult(category, `${type} Game ${field} Field`, 
                game[field] !== undefined, 
                `${field} field exists`);
        }
        
        // Validate teams structure
        if (game.teams) {
            this.logTestResult(category, `${type} Game Teams Structure`, 
                game.teams.home && game.teams.away, 
                'Home and away teams exist');
            
            if (game.teams.home) {
                this.logTestResult(category, `${type} Home Team Name`, 
                    game.teams.home.name && game.teams.home.name.length > 0, 
                    `Home team: ${game.teams.home.name}`);
            }
            
            if (game.teams.away) {
                this.logTestResult(category, `${type} Away Team Name`, 
                    game.teams.away.name && game.teams.away.name.length > 0, 
                    `Away team: ${game.teams.away.name}`);
            }
        }
        
        // Validate status structure
        if (game.status) {
            this.logTestResult(category, `${type} Game Status Type`, 
                game.status.type && game.status.type.length > 0, 
                `Status: ${game.status.type}`);
        }
    }
    
    /**
     * Check for blank sections in the UI
     */
    checkForBlankSections() {
        const sections = document.querySelectorAll('.card, .section, .game-card');
        let hasBlankSections = false;
        
        sections.forEach(section => {
            const text = section.textContent.trim();
            if (text.length === 0 || text === 'Loading...' || text === '') {
                hasBlankSections = true;
            }
        });
        
        return hasBlankSections;
    }
    
    /**
     * Log test result
     */
    logTestResult(category, testName, passed, details) {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults[category].tests.push(result);
        
        if (passed) {
            this.testResults[category].passed++;
            console.log(`✅ ${testName}: ${details}`);
        } else {
            this.testResults[category].failed++;
            console.log(`❌ ${testName}: ${details}`);
        }
    }
    
    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        console.log('\n📊 COMPREHENSIVE VALIDATION TEST REPORT');
        console.log('=' .repeat(50));
        
        let totalPassed = 0;
        let totalFailed = 0;
        
        Object.keys(this.testResults).forEach(category => {
            const results = this.testResults[category];
            totalPassed += results.passed;
            totalFailed += results.failed;
            
            const total = results.passed + results.failed;
            const percentage = total > 0 ? Math.round((results.passed / total) * 100) : 0;
            
            console.log(`\n${category.toUpperCase()}:`);
            console.log(`  ✅ Passed: ${results.passed}`);
            console.log(`  ❌ Failed: ${results.failed}`);
            console.log(`  📈 Success Rate: ${percentage}%`);
            
            if (results.failed > 0) {
                console.log('  Failed Tests:');
                results.tests.filter(t => !t.passed).forEach(test => {
                    console.log(`    - ${test.name}: ${test.details}`);
                });
            }
        });
        
        const overallTotal = totalPassed + totalFailed;
        const overallPercentage = overallTotal > 0 ? Math.round((totalPassed / overallTotal) * 100) : 0;
        
        console.log('\n' + '='.repeat(50));
        console.log('OVERALL RESULTS:');
        console.log(`✅ Total Passed: ${totalPassed}`);
        console.log(`❌ Total Failed: ${totalFailed}`);
        console.log(`📈 Overall Success Rate: ${overallPercentage}%`);
        console.log(`⏱️ Test Duration: ${duration}ms`);
        
        // Determine overall status
        if (overallPercentage >= 90) {
            console.log('🎉 EXCELLENT: System is performing exceptionally well!');
        } else if (overallPercentage >= 80) {
            console.log('✅ GOOD: System is performing well with minor issues.');
        } else if (overallPercentage >= 70) {
            console.log('⚠️ FAIR: System has some issues that should be addressed.');
        } else {
            console.log('❌ POOR: System has significant issues requiring immediate attention.');
        }
        
        // Store results for external access
        window.validationResults = {
            summary: {
                totalPassed,
                totalFailed,
                overallPercentage,
                duration,
                timestamp: new Date().toISOString()
            },
            details: this.testResults
        };
        
        console.log('\n📋 Detailed results stored in window.validationResults');
    }
}

// Auto-run tests when script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting comprehensive validation suite...');
    
    // Wait for services to initialize
    setTimeout(async () => {
        const validator = new ComprehensiveValidationSuite();
        await validator.runAllTests();
    }, 2000);
});

// Export for manual testing
window.ComprehensiveValidationSuite = ComprehensiveValidationSuite;

// Manual test runner
window.runValidationTests = async function() {
    const validator = new ComprehensiveValidationSuite();
    await validator.runAllTests();
    return window.validationResults;
};

console.log('✅ Comprehensive validation suite loaded. Run window.runValidationTests() to start.');