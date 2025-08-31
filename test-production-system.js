#!/usr/bin/env node

/**
 * Production System Test Suite
 * Validates all APIs, data connections, and functionality
 */

const http = require('http');
const https = require('https');

class ProductionSystemTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    async runAllTests() {
        console.log('🧪 NFL Analytics Pro - Production System Test Suite');
        console.log('=' .repeat(60));
        
        // Test server health
        await this.testServerHealth();
        
        // Test API endpoints
        await this.testAPIEndpoints();
        
        // Test static file serving
        await this.testStaticFiles();
        
        // Test data integrity
        await this.testDataIntegrity();
        
        // Test ML endpoints
        await this.testMLEndpoints();
        
        // Test fantasy endpoints
        await this.testFantasyEndpoints();
        
        // Test betting endpoints
        await this.testBettingEndpoints();
        
        // Test news endpoints
        await this.testNewsEndpoints();
        
        // Print results
        this.printResults();
        
        return this.results.failed === 0;
    }

    async testServerHealth() {
        console.log('\n📊 Testing Server Health...');
        
        try {
            const response = await this.makeRequest('/api/health');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Health endpoint returns 200');
            this.assert(data.status === 'OK', 'Health status is OK');
            this.assert(data.version === '2.0.0', 'Version is correct');
            this.assert(data.services, 'Services status included');
            
            console.log('✅ Server health check passed');
        } catch (error) {
            this.assert(false, `Health check failed: ${error.message}`);
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔌 Testing API Endpoints...');
        
        // Test status endpoint
        try {
            const response = await this.makeRequest('/api/status');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Status endpoint returns 200');
            this.assert(data.success === true, 'Status response is successful');
            this.assert(typeof data.uptime === 'number', 'Uptime is provided');
            
            console.log('✅ Status endpoint working');
        } catch (error) {
            this.assert(false, `Status endpoint failed: ${error.message}`);
        }

        // Test games endpoint
        try {
            const response = await this.makeRequest('/api/games');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Games endpoint returns 200');
            this.assert(data.success === true, 'Games response is successful');
            this.assert(Array.isArray(data.data), 'Games data is an array');
            this.assert(data.count >= 0, 'Games count is provided');
            
            console.log(`✅ Games endpoint working (${data.count} games)`);
        } catch (error) {
            this.assert(false, `Games endpoint failed: ${error.message}`);
        }

        // Test teams endpoint
        try {
            const response = await this.makeRequest('/api/teams');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Teams endpoint returns 200');
            this.assert(data.success === true, 'Teams response is successful');
            this.assert(Array.isArray(data.data), 'Teams data is an array');
            this.assert(data.count === 32, 'All 32 NFL teams present');
            
            console.log(`✅ Teams endpoint working (${data.count} teams)`);
        } catch (error) {
            this.assert(false, `Teams endpoint failed: ${error.message}`);
        }
    }

    async testStaticFiles() {
        console.log('\n📁 Testing Static File Serving...');
        
        const staticFiles = [
            '/',
            '/styles.css',
            '/app.js',
            '/live-nfl-games-today.js',
            '/nfl-2024-data.js'
        ];

        for (const file of staticFiles) {
            try {
                const response = await this.makeRequest(file);
                this.assert(response.statusCode === 200, `${file} serves correctly`);
                this.assert(response.body.length > 0, `${file} has content`);
                
                console.log(`✅ ${file} serving correctly`);
            } catch (error) {
                this.assert(false, `Static file ${file} failed: ${error.message}`);
            }
        }
    }

    async testDataIntegrity() {
        console.log('\n🔍 Testing Data Integrity...');
        
        try {
            // Test teams data structure
            const teamsResponse = await this.makeRequest('/api/teams');
            const teamsData = JSON.parse(teamsResponse.body);
            
            if (teamsData.data.length > 0) {
                const team = teamsData.data[0];
                this.assert(team.id, 'Team has ID');
                this.assert(team.name, 'Team has name');
                this.assert(team.abbreviation, 'Team has abbreviation');
                this.assert(team.conference, 'Team has conference');
                this.assert(team.division, 'Team has division');
                
                console.log('✅ Team data structure is valid');
            }

            // Test games data structure
            const gamesResponse = await this.makeRequest('/api/games');
            const gamesData = JSON.parse(gamesResponse.body);
            
            if (gamesData.data.length > 0) {
                const game = gamesData.data[0];
                this.assert(game.id, 'Game has ID');
                this.assert(game.awayTeam || game.name, 'Game has away team info');
                this.assert(game.homeTeam || game.name, 'Game has home team info');
                this.assert(game.status, 'Game has status');
                
                console.log('✅ Game data structure is valid');
            }
            
        } catch (error) {
            this.assert(false, `Data integrity test failed: ${error.message}`);
        }
    }

    async testMLEndpoints() {
        console.log('\n🧠 Testing ML Endpoints...');
        
        // Test prediction endpoint
        try {
            const predictionData = {
                gameId: 'test_game_1',
                modelType: 'neural_network'
            };
            
            const response = await this.makeRequest('/api/predict', 'POST', predictionData);
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Prediction endpoint returns 200');
            this.assert(data.success === true, 'Prediction response is successful');
            this.assert(data.prediction, 'Prediction data is provided');
            this.assert(data.prediction.homeWinProbability, 'Home win probability provided');
            this.assert(data.prediction.awayWinProbability, 'Away win probability provided');
            this.assert(data.prediction.confidence, 'Confidence level provided');
            
            console.log('✅ ML Prediction endpoint working');
        } catch (error) {
            this.assert(false, `ML Prediction endpoint failed: ${error.message}`);
        }

        // Test Monte Carlo simulation endpoint
        try {
            const simulationData = {
                gameId: 'test_game_1',
                iterations: 1000
            };
            
            const response = await this.makeRequest('/api/simulate', 'POST', simulationData);
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Simulation endpoint returns 200');
            this.assert(data.success === true, 'Simulation response is successful');
            this.assert(data.results, 'Simulation results provided');
            this.assert(data.results.homeWinProbability, 'Home win probability in results');
            this.assert(data.results.processingTime, 'Processing time provided');
            
            console.log('✅ Monte Carlo simulation endpoint working');
        } catch (error) {
            this.assert(false, `Monte Carlo endpoint failed: ${error.message}`);
        }
    }

    async testFantasyEndpoints() {
        console.log('\n🏆 Testing Fantasy Endpoints...');
        
        try {
            const response = await this.makeRequest('/api/fantasy/players?position=QB&limit=10');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Fantasy players endpoint returns 200');
            this.assert(data.success === true, 'Fantasy response is successful');
            this.assert(Array.isArray(data.data), 'Fantasy players data is an array');
            this.assert(data.data.length <= 10, 'Limit parameter works');
            
            if (data.data.length > 0) {
                const player = data.data[0];
                this.assert(player.name, 'Player has name');
                this.assert(player.position, 'Player has position');
                this.assert(player.team, 'Player has team');
                this.assert(player.projectedPoints, 'Player has projected points');
            }
            
            console.log(`✅ Fantasy players endpoint working (${data.data.length} players)`);
        } catch (error) {
            this.assert(false, `Fantasy endpoint failed: ${error.message}`);
        }
    }

    async testBettingEndpoints() {
        console.log('\n💰 Testing Betting Endpoints...');
        
        try {
            const response = await this.makeRequest('/api/betting/odds');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'Betting odds endpoint returns 200');
            this.assert(data.success === true, 'Betting response is successful');
            this.assert(Array.isArray(data.data), 'Betting odds data is an array');
            
            if (data.data.length > 0) {
                const game = data.data[0];
                this.assert(game.homeTeam, 'Game has home team');
                this.assert(game.awayTeam, 'Game has away team');
                this.assert(typeof game.spread === 'number', 'Game has spread');
                this.assert(typeof game.total === 'number', 'Game has total');
            }
            
            console.log(`✅ Betting odds endpoint working (${data.data.length} games)`);
        } catch (error) {
            this.assert(false, `Betting endpoint failed: ${error.message}`);
        }
    }

    async testNewsEndpoints() {
        console.log('\n📰 Testing News Endpoints...');
        
        try {
            const response = await this.makeRequest('/api/news?limit=5');
            const data = JSON.parse(response.body);
            
            this.assert(response.statusCode === 200, 'News endpoint returns 200');
            this.assert(data.success === true, 'News response is successful');
            this.assert(Array.isArray(data.data), 'News data is an array');
            this.assert(data.data.length <= 5, 'Limit parameter works');
            
            if (data.data.length > 0) {
                const article = data.data[0];
                this.assert(article.title, 'Article has title');
                this.assert(article.summary, 'Article has summary');
                this.assert(article.timestamp, 'Article has timestamp');
                this.assert(article.category, 'Article has category');
            }
            
            console.log(`✅ News endpoint working (${data.data.length} articles)`);
        } catch (error) {
            this.assert(false, `News endpoint failed: ${error.message}`);
        }
    }

    makeRequest(path, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'NFL-Analytics-Pro-Test-Suite/1.0'
                }
            };

            if (data && method !== 'GET') {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    assert(condition, message) {
        const test = {
            message,
            passed: !!condition,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(test);
        
        if (condition) {
            this.results.passed++;
        } else {
            this.results.failed++;
            console.log(`❌ ${message}`);
        }
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Total: ${this.results.tests.length}`);
        
        const successRate = ((this.results.passed / this.results.tests.length) * 100).toFixed(1);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        if (this.results.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.tests
                .filter(test => !test.passed)
                .forEach(test => {
                    console.log(`  • ${test.message}`);
                });
        }
        
        console.log('\n' + (this.results.failed === 0 ? 
            '🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION!' : 
            '⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYMENT'));
        console.log('='.repeat(60));
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ProductionSystemTester();
    
    console.log('⏳ Starting production system tests...');
    console.log('Make sure the server is running on http://localhost:3000\n');
    
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = ProductionSystemTester;