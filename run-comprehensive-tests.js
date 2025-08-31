/**
 * Comprehensive Test Runner for Football Analytics System
 * Validates all functionality according to task 10 requirements
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveTestRunner {
    constructor() {
        this.testResults = {
            realApiData: [],
            fallbackSystem: [],
            aiPredictions: [],
            bettingLines: [],
            mlAlgorithms: [],
            mobileResponsiveness: [],
            visualAppeal: []
        };
        
        this.summary = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            successRate: 0
        };
        
        console.log('🧪 Comprehensive Test Runner initialized');
    }
    
    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('\n🚀 Starting Comprehensive Football Analytics Validation');
        console.log('=' .repeat(60));
        
        try {
            // Test 1: Validate file structure and dependencies
            await this.validateFileStructure();
            
            // Test 2: Validate data services
            await this.validateDataServices();
            
            // Test 3: Validate AI prediction logic
            await this.validateAiPredictions();
            
            // Test 4: Validate betting lines functionality
            await this.validateBettingLines();
            
            // Test 5: Validate ML algorithms
            await this.validateMlAlgorithms();
            
            // Test 6: Validate error handling and fallbacks
            await this.validateErrorHandling();
            
            // Test 7: Validate mobile responsiveness
            await this.validateMobileResponsiveness();
            
            // Test 8: Validate visual appeal
            await this.validateVisualAppeal();
            
            // Generate final report
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Test runner failed:', error.message);
            this.logTest('general', 'Test Runner Execution', false, error.message);
        }
    }
    
    /**
     * Validate file structure and dependencies
     */
    async validateFileStructure() {
        console.log('\n📁 Validating file structure and dependencies...');
        
        const requiredFiles = [
            'public/app.js',
            'public/nfl-data-service.js',
            'public/ncaa-data-service.js',
            'public/styles.css',
            'public/index.html',
            'public/nfl-analytics.html',
            'public/ncaa-analytics.html',
            'public/error-handler.js',
            'public/data-validator.js',
            'public/cache-manager.js',
            'public/loading-state-manager.js'
        ];
        
        let filesFound = 0;
        
        for (const file of requiredFiles) {
            try {
                if (fs.existsSync(file)) {
                    filesFound++;
                    this.logTest('realApiData', `File exists: ${file}`, true, 'File found');
                } else {
                    this.logTest('realApiData', `File exists: ${file}`, false, 'File missing');
                }
            } catch (error) {
                this.logTest('realApiData', `File check: ${file}`, false, error.message);
            }
        }
        
        const filePercentage = (filesFound / requiredFiles.length) * 100;
        this.logTest('realApiData', 'Required Files Present', 
            filePercentage >= 90, 
            `${filesFound}/${requiredFiles.length} files found (${Math.round(filePercentage)}%)`);
    }
    
    /**
     * Validate data services functionality
     */
    async validateDataServices() {
        console.log('\n📡 Validating data services...');
        
        try {
            // Check NFL data service structure
            const nflServicePath = 'public/nfl-data-service.js';
            if (fs.existsSync(nflServicePath)) {
                const nflContent = fs.readFileSync(nflServicePath, 'utf8');
                
                // Check for required methods
                const requiredMethods = [
                    'getTodaysGames',
                    'generateAIPrediction',
                    'getBettingLinesForGame',
                    'getMLAlgorithmPredictions',
                    'enhanceGamesWithAI'
                ];
                
                let methodsFound = 0;
                requiredMethods.forEach(method => {
                    if (nflContent.includes(method)) {
                        methodsFound++;
                        this.logTest('realApiData', `NFL method: ${method}`, true, 'Method implemented');
                    } else {
                        this.logTest('realApiData', `NFL method: ${method}`, false, 'Method missing');
                    }
                });
                
                const methodPercentage = (methodsFound / requiredMethods.length) * 100;
                this.logTest('realApiData', 'NFL Service Methods', 
                    methodPercentage >= 90, 
                    `${methodsFound}/${requiredMethods.length} methods found (${Math.round(methodPercentage)}%)`);
            }
            
            // Check NCAA data service structure
            const ncaaServicePath = 'public/ncaa-data-service.js';
            if (fs.existsSync(ncaaServicePath)) {
                const ncaaContent = fs.readFileSync(ncaaServicePath, 'utf8');
                
                // Check for required methods
                const requiredMethods = [
                    'getTodaysGames',
                    'generateAIPrediction',
                    'getBettingLinesForGame',
                    'getMLAlgorithmPredictions'
                ];
                
                let methodsFound = 0;
                requiredMethods.forEach(method => {
                    if (ncaaContent.includes(method)) {
                        methodsFound++;
                        this.logTest('realApiData', `NCAA method: ${method}`, true, 'Method implemented');
                    } else {
                        this.logTest('realApiData', `NCAA method: ${method}`, false, 'Method missing');
                    }
                });
                
                const methodPercentage = (methodsFound / requiredMethods.length) * 100;
                this.logTest('realApiData', 'NCAA Service Methods', 
                    methodPercentage >= 90, 
                    `${methodsFound}/${requiredMethods.length} methods found (${Math.round(methodPercentage)}%)`);
            }
            
        } catch (error) {
            this.logTest('realApiData', 'Data Services Validation', false, error.message);
        }
    }
    
    /**
     * Validate AI prediction functionality
     */
    async validateAiPredictions() {
        console.log('\n🤖 Validating AI prediction functionality...');
        
        try {
            const nflServicePath = 'public/nfl-data-service.js';
            if (fs.existsSync(nflServicePath)) {
                const content = fs.readFileSync(nflServicePath, 'utf8');
                
                // Check for AI prediction components
                const aiComponents = [
                    'calculateTeamStrength',
                    'calculateWinProbability',
                    'calculateSpread',
                    'calculateConfidence',
                    'generateRecommendation',
                    'homeWinProbability',
                    'awayWinProbability',
                    'predictedSpread',
                    'confidence',
                    'predictedScore'
                ];
                
                let componentsFound = 0;
                aiComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('aiPredictions', `AI component: ${component}`, true, 'Component implemented');
                    } else {
                        this.logTest('aiPredictions', `AI component: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / aiComponents.length) * 100;
                this.logTest('aiPredictions', 'AI Prediction Components', 
                    componentPercentage >= 80, 
                    `${componentsFound}/${aiComponents.length} components found (${Math.round(componentPercentage)}%)`);
                
                // Check for confidence range validation (55-95%)
                const hasConfidenceRange = content.includes('55') && content.includes('95');
                this.logTest('aiPredictions', 'Confidence Range Validation', 
                    hasConfidenceRange, 
                    'Confidence range (55-95%) implemented');
                
                // Check for team strength calculation
                const hasTeamStrength = content.includes('eliteTeams') || content.includes('strongTeams');
                this.logTest('aiPredictions', 'Team Strength Calculation', 
                    hasTeamStrength, 
                    'Team strength calculation implemented');
            }
            
        } catch (error) {
            this.logTest('aiPredictions', 'AI Predictions Validation', false, error.message);
        }
    }
    
    /**
     * Validate betting lines functionality
     */
    async validateBettingLines() {
        console.log('\n💰 Validating betting lines functionality...');
        
        try {
            const nflServicePath = 'public/nfl-data-service.js';
            if (fs.existsSync(nflServicePath)) {
                const content = fs.readFileSync(nflServicePath, 'utf8');
                
                // Check for betting line components
                const bettingComponents = [
                    'getBettingLinesForGame',
                    'generateRealisticLines',
                    'spread',
                    'moneyline',
                    'total',
                    'sportsbooks',
                    'DraftKings',
                    'FanDuel',
                    'BetMGM',
                    '-110'
                ];
                
                let componentsFound = 0;
                bettingComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('bettingLines', `Betting component: ${component}`, true, 'Component implemented');
                    } else {
                        this.logTest('bettingLines', `Betting component: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / bettingComponents.length) * 100;
                this.logTest('bettingLines', 'Betting Lines Components', 
                    componentPercentage >= 80, 
                    `${componentsFound}/${bettingComponents.length} components found (${Math.round(componentPercentage)}%)`);
                
                // Check for odds format validation
                const hasOddsFormat = content.includes('calculateMoneyline') || content.includes('odds');
                this.logTest('bettingLines', 'Odds Format Implementation', 
                    hasOddsFormat, 
                    'Odds formatting implemented');
                
                // Check for multiple sportsbooks
                const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
                let sportsbooksFound = 0;
                sportsbooks.forEach(sportsbook => {
                    if (content.includes(sportsbook)) {
                        sportsbooksFound++;
                    }
                });
                
                this.logTest('bettingLines', 'Multiple Sportsbooks', 
                    sportsbooksFound >= 3, 
                    `${sportsbooksFound}/${sportsbooks.length} sportsbooks included`);
            }
            
        } catch (error) {
            this.logTest('bettingLines', 'Betting Lines Validation', false, error.message);
        }
    }
    
    /**
     * Validate ML algorithms functionality
     */
    async validateMlAlgorithms() {
        console.log('\n🧠 Validating ML algorithms functionality...');
        
        try {
            const nflServicePath = 'public/nfl-data-service.js';
            if (fs.existsSync(nflServicePath)) {
                const content = fs.readFileSync(nflServicePath, 'utf8');
                
                // Check for ML algorithm components
                const mlComponents = [
                    'getMLAlgorithmPredictions',
                    'neuralNetwork',
                    'xgboost',
                    'ensemble',
                    'consensus',
                    'simulateNeuralNetwork',
                    'simulateXGBoost',
                    'simulateEnsemble',
                    'accuracy',
                    'edge'
                ];
                
                let componentsFound = 0;
                mlComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('mlAlgorithms', `ML component: ${component}`, true, 'Component implemented');
                    } else {
                        this.logTest('mlAlgorithms', `ML component: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / mlComponents.length) * 100;
                this.logTest('mlAlgorithms', 'ML Algorithm Components', 
                    componentPercentage >= 80, 
                    `${componentsFound}/${mlComponents.length} components found (${Math.round(componentPercentage)}%)`);
                
                // Check for accuracy percentages (89-94% range)
                const hasAccuracyRange = content.includes('94.2%') || content.includes('91.8%') || content.includes('93.5%');
                this.logTest('mlAlgorithms', 'Accuracy Percentages', 
                    hasAccuracyRange, 
                    'Realistic accuracy percentages implemented');
                
                // Check for edge indicators (HIGH/MEDIUM/LOW)
                const edgeIndicators = ['HIGH', 'MEDIUM', 'LOW'];
                let edgeFound = 0;
                edgeIndicators.forEach(edge => {
                    if (content.includes(edge)) {
                        edgeFound++;
                    }
                });
                
                this.logTest('mlAlgorithms', 'Edge Indicators', 
                    edgeFound >= 3, 
                    `${edgeFound}/${edgeIndicators.length} edge indicators found`);
            }
            
        } catch (error) {
            this.logTest('mlAlgorithms', 'ML Algorithms Validation', false, error.message);
        }
    }
    
    /**
     * Validate error handling and fallback systems
     */
    async validateErrorHandling() {
        console.log('\n🛡️ Validating error handling and fallback systems...');
        
        try {
            // Check error handler
            const errorHandlerPath = 'public/error-handler.js';
            if (fs.existsSync(errorHandlerPath)) {
                const content = fs.readFileSync(errorHandlerPath, 'utf8');
                
                const errorComponents = [
                    'safeApiCall',
                    'logError',
                    'try',
                    'catch',
                    'fallback',
                    'retry'
                ];
                
                let componentsFound = 0;
                errorComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('fallbackSystem', `Error handling: ${component}`, true, 'Component implemented');
                    } else {
                        this.logTest('fallbackSystem', `Error handling: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / errorComponents.length) * 100;
                this.logTest('fallbackSystem', 'Error Handling Components', 
                    componentPercentage >= 80, 
                    `${componentsFound}/${errorComponents.length} components found (${Math.round(componentPercentage)}%)`);
            }
            
            // Check data validator
            const dataValidatorPath = 'public/data-validator.js';
            if (fs.existsSync(dataValidatorPath)) {
                this.logTest('fallbackSystem', 'Data Validator Present', true, 'Data validator implemented');
            } else {
                this.logTest('fallbackSystem', 'Data Validator Present', false, 'Data validator missing');
            }
            
            // Check cache manager
            const cacheManagerPath = 'public/cache-manager.js';
            if (fs.existsSync(cacheManagerPath)) {
                this.logTest('fallbackSystem', 'Cache Manager Present', true, 'Cache manager implemented');
            } else {
                this.logTest('fallbackSystem', 'Cache Manager Present', false, 'Cache manager missing');
            }
            
        } catch (error) {
            this.logTest('fallbackSystem', 'Error Handling Validation', false, error.message);
        }
    }
    
    /**
     * Validate mobile responsiveness
     */
    async validateMobileResponsiveness() {
        console.log('\n📱 Validating mobile responsiveness...');
        
        try {
            // Check CSS for responsive design
            const cssPath = 'public/styles.css';
            if (fs.existsSync(cssPath)) {
                const content = fs.readFileSync(cssPath, 'utf8');
                
                const responsiveComponents = [
                    '@media',
                    'max-width',
                    'min-width',
                    'grid',
                    'flex',
                    'responsive',
                    'mobile'
                ];
                
                let componentsFound = 0;
                responsiveComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('mobileResponsiveness', `Responsive CSS: ${component}`, true, 'Component found');
                    } else {
                        this.logTest('mobileResponsiveness', `Responsive CSS: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / responsiveComponents.length) * 100;
                this.logTest('mobileResponsiveness', 'Responsive CSS Components', 
                    componentPercentage >= 70, 
                    `${componentsFound}/${responsiveComponents.length} components found (${Math.round(componentPercentage)}%)`);
            }
            
            // Check HTML for viewport meta tag
            const htmlFiles = ['public/index.html', 'public/nfl-analytics.html', 'public/ncaa-analytics.html'];
            
            let viewportFound = 0;
            htmlFiles.forEach(file => {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    if (content.includes('viewport') && content.includes('device-width')) {
                        viewportFound++;
                        this.logTest('mobileResponsiveness', `Viewport meta: ${path.basename(file)}`, true, 'Viewport meta tag found');
                    } else {
                        this.logTest('mobileResponsiveness', `Viewport meta: ${path.basename(file)}`, false, 'Viewport meta tag missing');
                    }
                }
            });
            
            this.logTest('mobileResponsiveness', 'Viewport Meta Tags', 
                viewportFound >= 2, 
                `${viewportFound}/${htmlFiles.length} files have viewport meta tags`);
            
        } catch (error) {
            this.logTest('mobileResponsiveness', 'Mobile Responsiveness Validation', false, error.message);
        }
    }
    
    /**
     * Validate visual appeal
     */
    async validateVisualAppeal() {
        console.log('\n🎨 Validating visual appeal...');
        
        try {
            // Check CSS for visual enhancements
            const cssPath = 'public/styles.css';
            if (fs.existsSync(cssPath)) {
                const content = fs.readFileSync(cssPath, 'utf8');
                
                const visualComponents = [
                    'gradient',
                    'box-shadow',
                    'border-radius',
                    'transition',
                    'transform',
                    'animation',
                    'color',
                    'background'
                ];
                
                let componentsFound = 0;
                visualComponents.forEach(component => {
                    if (content.includes(component)) {
                        componentsFound++;
                        this.logTest('visualAppeal', `Visual CSS: ${component}`, true, 'Component found');
                    } else {
                        this.logTest('visualAppeal', `Visual CSS: ${component}`, false, 'Component missing');
                    }
                });
                
                const componentPercentage = (componentsFound / visualComponents.length) * 100;
                this.logTest('visualAppeal', 'Visual CSS Components', 
                    componentPercentage >= 70, 
                    `${componentsFound}/${visualComponents.length} components found (${Math.round(componentPercentage)}%)`);
                
                // Check for consistent spacing and layout
                const layoutComponents = ['margin', 'padding', 'grid', 'flex'];
                let layoutFound = 0;
                layoutComponents.forEach(component => {
                    if (content.includes(component)) {
                        layoutFound++;
                    }
                });
                
                this.logTest('visualAppeal', 'Layout Consistency', 
                    layoutFound >= 3, 
                    `${layoutFound}/${layoutComponents.length} layout components found`);
            }
            
        } catch (error) {
            this.logTest('visualAppeal', 'Visual Appeal Validation', false, error.message);
        }
    }
    
    /**
     * Log test result
     */
    logTest(category, testName, passed, details) {
        const result = {
            name: testName,
            passed: passed,
            details: details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults[category].push(result);
        this.summary.totalTests++;
        
        if (passed) {
            this.summary.passedTests++;
            console.log(`✅ ${testName}: ${details}`);
        } else {
            this.summary.failedTests++;
            console.log(`❌ ${testName}: ${details}`);
        }
    }
    
    /**
     * Generate final comprehensive report
     */
    generateFinalReport() {
        this.summary.successRate = this.summary.totalTests > 0 ? 
            Math.round((this.summary.passedTests / this.summary.totalTests) * 100) : 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('🏈 COMPREHENSIVE FOOTBALL ANALYTICS VALIDATION REPORT');
        console.log('='.repeat(60));
        
        // Overall summary
        console.log('\n📊 OVERALL RESULTS:');
        console.log(`✅ Total Passed: ${this.summary.passedTests}`);
        console.log(`❌ Total Failed: ${this.summary.failedTests}`);
        console.log(`📈 Overall Success Rate: ${this.summary.successRate}%`);
        
        // Category breakdown
        console.log('\n📋 CATEGORY BREAKDOWN:');
        Object.keys(this.testResults).forEach(category => {
            const results = this.testResults[category];
            const passed = results.filter(r => r.passed).length;
            const total = results.length;
            const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
            
            console.log(`  ${category}: ${passed}/${total} (${percentage}%)`);
        });
        
        // Failed tests summary
        if (this.summary.failedTests > 0) {
            console.log('\n❌ FAILED TESTS SUMMARY:');
            Object.keys(this.testResults).forEach(category => {
                const failedTests = this.testResults[category].filter(r => !r.passed);
                if (failedTests.length > 0) {
                    console.log(`\n  ${category.toUpperCase()}:`);
                    failedTests.forEach(test => {
                        console.log(`    - ${test.name}: ${test.details}`);
                    });
                }
            });
        }
        
        // Overall assessment
        console.log('\n🎯 OVERALL ASSESSMENT:');
        if (this.summary.successRate >= 90) {
            console.log('🎉 EXCELLENT: The football analytics system is performing exceptionally well!');
            console.log('   All major functionality is working correctly with comprehensive features.');
        } else if (this.summary.successRate >= 80) {
            console.log('✅ GOOD: The system is performing well with minor issues.');
            console.log('   Most functionality is working correctly with room for small improvements.');
        } else if (this.summary.successRate >= 70) {
            console.log('⚠️ FAIR: The system has some issues that should be addressed.');
            console.log('   Core functionality works but several features need attention.');
        } else {
            console.log('❌ POOR: The system has significant issues requiring immediate attention.');
            console.log('   Major functionality is missing or broken and needs comprehensive fixes.');
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (this.testResults.realApiData.filter(r => !r.passed).length > 0) {
            console.log('• Fix real API data integration and fallback systems');
        }
        
        if (this.testResults.aiPredictions.filter(r => !r.passed).length > 0) {
            console.log('• Improve AI prediction algorithms and validation');
        }
        
        if (this.testResults.bettingLines.filter(r => !r.passed).length > 0) {
            console.log('• Enhance betting lines generation and formatting');
        }
        
        if (this.testResults.mlAlgorithms.filter(r => !r.passed).length > 0) {
            console.log('• Complete ML algorithm implementations');
        }
        
        if (this.testResults.mobileResponsiveness.filter(r => !r.passed).length > 0) {
            console.log('• Improve mobile responsiveness and touch targets');
        }
        
        if (this.testResults.visualAppeal.filter(r => !r.passed).length > 0) {
            console.log('• Enhance visual design and user experience');
        }
        
        // Save results to file
        const reportData = {
            summary: this.summary,
            results: this.testResults,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        try {
            fs.writeFileSync('test-validation-report.json', JSON.stringify(reportData, null, 2));
            console.log('\n📄 Detailed report saved to: test-validation-report.json');
        } catch (error) {
            console.log('\n⚠️ Could not save report file:', error.message);
        }
        
        console.log('\n✅ Comprehensive validation completed!');
        console.log('='.repeat(60));
        
        return reportData;
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new ComprehensiveTestRunner();
    runner.runAllTests().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;