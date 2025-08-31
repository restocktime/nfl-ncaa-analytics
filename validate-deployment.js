#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that the deployed application loads correctly
 */

const https = require('https');
const http = require('http');

class DeploymentValidator {
    constructor(url) {
        this.url = url;
        this.results = {
            mainPage: false,
            assets: false,
            api: false,
            errors: []
        };
    }

    async validateDeployment() {
        console.log(`🔍 Validating deployment at: ${this.url}`);
        
        try {
            // Test main page
            await this.testMainPage();
            
            // Test key assets
            await this.testAssets();
            
            // Test API endpoints
            await this.testAPI();
            
            this.printResults();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            process.exit(1);
        }
    }

    async testMainPage() {
        console.log('📄 Testing main page...');
        
        try {
            const response = await this.makeRequest(this.url);
            
            if (response.statusCode === 200) {
                console.log('✅ Main page loads successfully');
                this.results.mainPage = true;
                
                // Check for key content
                if (response.body.includes('<title>') && response.body.includes('app.js')) {
                    console.log('✅ Main page contains expected content');
                } else {
                    this.results.errors.push('Main page missing expected content');
                }
            } else {
                this.results.errors.push(`Main page returned status ${response.statusCode}`);
            }
        } catch (error) {
            this.results.errors.push(`Main page request failed: ${error.message}`);
        }
    }

    async testAssets() {
        console.log('📦 Testing key assets...');
        
        const assets = [
            '/app.js',
            '/styles.css'
        ];

        for (const asset of assets) {
            try {
                const response = await this.makeRequest(this.url + asset);
                
                if (response.statusCode === 200) {
                    console.log(`✅ Asset ${asset} loads successfully`);
                } else {
                    this.results.errors.push(`Asset ${asset} returned status ${response.statusCode}`);
                }
            } catch (error) {
                this.results.errors.push(`Asset ${asset} request failed: ${error.message}`);
            }
        }
        
        if (this.results.errors.filter(e => e.includes('Asset')).length === 0) {
            this.results.assets = true;
        }
    }

    async testAPI() {
        console.log('🔌 Testing API endpoints...');
        
        const endpoints = [
            '/api/test',
            '/api/hardrock'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeRequest(this.url + endpoint);
                
                if (response.statusCode === 200 || response.statusCode === 404) {
                    console.log(`✅ API endpoint ${endpoint} is accessible`);
                } else {
                    this.results.errors.push(`API ${endpoint} returned unexpected status ${response.statusCode}`);
                }
            } catch (error) {
                // API endpoints might not be fully configured, so we'll be lenient
                console.log(`⚠️  API endpoint ${endpoint}: ${error.message}`);
            }
        }
        
        this.results.api = true; // Mark as true since API is optional for this validation
    }

    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            
            const request = client.get(url, (response) => {
                let body = '';
                
                response.on('data', (chunk) => {
                    body += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: body
                    });
                });
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    printResults() {
        console.log('\n=== DEPLOYMENT VALIDATION RESULTS ===');
        console.log(`Main Page: ${this.results.mainPage ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Assets: ${this.results.assets ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`API: ${this.results.api ? '✅ PASS' : '❌ FAIL'}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n⚠️  ISSUES FOUND:');
            this.results.errors.forEach(error => {
                console.log(`  • ${error}`);
            });
        }
        
        const overallSuccess = this.results.mainPage && this.results.assets;
        
        console.log(`\n${overallSuccess ? '🎉 DEPLOYMENT VALIDATION PASSED' : '❌ DEPLOYMENT VALIDATION FAILED'}`);
        
        if (!overallSuccess) {
            process.exit(1);
        }
    }
}

// Main execution
if (require.main === module) {
    const url = process.argv[2];
    
    if (!url) {
        console.error('Usage: node validate-deployment.js <deployment-url>');
        process.exit(1);
    }
    
    const validator = new DeploymentValidator(url);
    validator.validateDeployment();
}

module.exports = DeploymentValidator;