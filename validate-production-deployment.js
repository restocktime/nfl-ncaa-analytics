#!/usr/bin/env node

/**
 * Production Deployment Validator
 * Comprehensive validation for production-ready NFL Analytics Pro
 */

const fs = require('fs');
const path = require('path');

class ProductionDeploymentValidator {
    constructor() {
        this.checks = [];
        this.warnings = [];
        this.errors = [];
    }

    async validateDeployment() {
        console.log('🔍 NFL Analytics Pro - Production Deployment Validation');
        console.log('=' .repeat(70));
        
        // Core file validation
        this.validateCoreFiles();
        
        // Configuration validation
        this.validateConfiguration();
        
        // Data source validation
        this.validateDataSources();
        
        // API validation
        this.validateAPIStructure();
        
        // Security validation
        this.validateSecurity();
        
        // Performance validation
        this.validatePerformance();
        
        // Print results
        this.printValidationResults();
        
        return this.errors.length === 0;
    }

    validateCoreFiles() {
        console.log('\n📁 Validating Core Files...');
        
        const requiredFiles = [
            'package.json',
            'server.js',
            'public/index.html',
            'public/styles.css',
            'public/app.js',
            'public/live-nfl-games-today.js',
            'public/nfl-2024-data.js',
            'api/hardrock.js',
            'api/test.js'
        ];

        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.checks.push(`✅ ${file} exists`);
                
                // Check file size
                const stats = fs.statSync(file);
                if (stats.size === 0) {
                    this.errors.push(`❌ ${file} is empty`);
                } else if (stats.size > 10 * 1024 * 1024) { // 10MB
                    this.warnings.push(`⚠️  ${file} is very large (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                }
            } else {
                this.errors.push(`❌ ${file} is missing`);
            }
        });

        // Check for build artifacts
        if (fs.existsSync('dist')) {
            this.checks.push('✅ Build directory exists');
            
            const distFiles = fs.readdirSync('dist');
            if (distFiles.length === 0) {
                this.warnings.push('⚠️  Build directory is empty');
            } else {
                this.checks.push(`✅ Build contains ${distFiles.length} files`);
            }
        } else {
            this.warnings.push('⚠️  No build directory found');
        }
    }

    validateConfiguration() {
        console.log('\n⚙️  Validating Configuration...');
        
        // Validate package.json
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            this.checks.push('✅ package.json is valid JSON');
            
            // Check required fields
            const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
            requiredFields.forEach(field => {
                if (packageJson[field]) {
                    this.checks.push(`✅ package.json has ${field}`);
                } else {
                    this.errors.push(`❌ package.json missing ${field}`);
                }
            });

            // Check required scripts
            const requiredScripts = ['start', 'build'];
            requiredScripts.forEach(script => {
                if (packageJson.scripts && packageJson.scripts[script]) {
                    this.checks.push(`✅ ${script} script defined`);
                } else {
                    this.errors.push(`❌ ${script} script missing`);
                }
            });

            // Check dependencies
            const requiredDeps = ['express', 'cors', 'helmet', 'compression'];
            requiredDeps.forEach(dep => {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    this.checks.push(`✅ ${dep} dependency present`);
                } else {
                    this.errors.push(`❌ ${dep} dependency missing`);
                }
            });

        } catch (error) {
            this.errors.push(`❌ package.json is invalid: ${error.message}`);
        }

        // Validate Vercel configuration
        if (fs.existsSync('vercel.json')) {
            try {
                const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
                
                this.checks.push('✅ vercel.json is valid JSON');
                
                // Check required Vercel fields
                if (vercelConfig.buildCommand) {
                    this.checks.push('✅ Vercel build command configured');
                } else {
                    this.errors.push('❌ Vercel build command missing');
                }

                if (vercelConfig.outputDirectory) {
                    this.checks.push('✅ Vercel output directory configured');
                } else {
                    this.errors.push('❌ Vercel output directory missing');
                }

            } catch (error) {
                this.errors.push(`❌ vercel.json is invalid: ${error.message}`);
            }
        } else {
            this.warnings.push('⚠️  vercel.json not found (required for Vercel deployment)');
        }
    }

    validateDataSources() {
        console.log('\n📊 Validating Data Sources...');
        
        // Validate NFL games data
        if (fs.existsSync('public/live-nfl-games-today.js')) {
            try {
                const gamesContent = fs.readFileSync('public/live-nfl-games-today.js', 'utf8');
                
                if (gamesContent.includes('LIVE_NFL_GAMES_TODAY')) {
                    this.checks.push('✅ NFL games data structure found');
                } else {
                    this.errors.push('❌ NFL games data structure missing');
                }

                if (gamesContent.includes('prediction')) {
                    this.checks.push('✅ Game predictions included');
                } else {
                    this.warnings.push('⚠️  Game predictions not found');
                }

            } catch (error) {
                this.errors.push(`❌ Error reading games data: ${error.message}`);
            }
        }

        // Validate NFL teams/players data
        if (fs.existsSync('public/nfl-2024-data.js')) {
            try {
                const teamsContent = fs.readFileSync('public/nfl-2024-data.js', 'utf8');
                
                if (teamsContent.includes('NFL_TEAMS_2024')) {
                    this.checks.push('✅ NFL teams data structure found');
                } else {
                    this.errors.push('❌ NFL teams data structure missing');
                }

                if (teamsContent.includes('NFL_PLAYERS_2024')) {
                    this.checks.push('✅ NFL players data structure found');
                } else {
                    this.warnings.push('⚠️  NFL players data not found');
                }

            } catch (error) {
                this.errors.push(`❌ Error reading teams/players data: ${error.message}`);
            }
        }
    }

    validateAPIStructure() {
        console.log('\n🔌 Validating API Structure...');
        
        // Validate server.js
        if (fs.existsSync('server.js')) {
            try {
                const serverContent = fs.readFileSync('server.js', 'utf8');
                
                // Check for required endpoints
                const requiredEndpoints = [
                    '/api/health',
                    '/api/status', 
                    '/api/games',
                    '/api/teams',
                    '/api/predict',
                    '/api/simulate'
                ];

                requiredEndpoints.forEach(endpoint => {
                    if (serverContent.includes(endpoint)) {
                        this.checks.push(`✅ ${endpoint} endpoint defined`);
                    } else {
                        this.errors.push(`❌ ${endpoint} endpoint missing`);
                    }
                });

                // Check for security middleware
                const securityMiddleware = ['helmet', 'cors', 'compression'];
                securityMiddleware.forEach(middleware => {
                    if (serverContent.includes(middleware)) {
                        this.checks.push(`✅ ${middleware} middleware configured`);
                    } else {
                        this.warnings.push(`⚠️  ${middleware} middleware not found`);
                    }
                });

                // Check for error handling
                if (serverContent.includes('error handling')) {
                    this.checks.push('✅ Error handling middleware present');
                } else {
                    this.warnings.push('⚠️  Error handling middleware not clearly defined');
                }

            } catch (error) {
                this.errors.push(`❌ Error reading server.js: ${error.message}`);
            }
        }

        // Validate API functions
        const apiFiles = ['api/hardrock.js', 'api/test.js'];
        apiFiles.forEach(apiFile => {
            if (fs.existsSync(apiFile)) {
                try {
                    const apiContent = fs.readFileSync(apiFile, 'utf8');
                    
                    if (apiContent.includes('export default') || apiContent.includes('module.exports')) {
                        this.checks.push(`✅ ${apiFile} has proper export`);
                    } else {
                        this.errors.push(`❌ ${apiFile} missing proper export`);
                    }

                    if (apiContent.includes('CORS')) {
                        this.checks.push(`✅ ${apiFile} handles CORS`);
                    } else {
                        this.warnings.push(`⚠️  ${apiFile} may not handle CORS properly`);
                    }

                } catch (error) {
                    this.errors.push(`❌ Error reading ${apiFile}: ${error.message}`);
                }
            }
        });
    }

    validateSecurity() {
        console.log('\n🔒 Validating Security...');
        
        // Check for environment variables handling
        if (fs.existsSync('server.js')) {
            const serverContent = fs.readFileSync('server.js', 'utf8');
            
            if (serverContent.includes('process.env')) {
                this.checks.push('✅ Environment variables used');
            } else {
                this.warnings.push('⚠️  No environment variables detected');
            }

            if (serverContent.includes('helmet')) {
                this.checks.push('✅ Security headers configured');
            } else {
                this.warnings.push('⚠️  Security headers not configured');
            }
        }

        // Check for sensitive data exposure
        const sensitivePatterns = [
            /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
            /password\s*[:=]\s*['"][^'"]+['"]/i,
            /secret\s*[:=]\s*['"][^'"]+['"]/i,
            /token\s*[:=]\s*['"][^'"]+['"]/i
        ];

        const checkFiles = ['server.js', 'public/app.js'];
        checkFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                sensitivePatterns.forEach(pattern => {
                    if (pattern.test(content)) {
                        this.warnings.push(`⚠️  Potential sensitive data in ${file}`);
                    }
                });
            }
        });

        // Check for .env files
        if (fs.existsSync('.env')) {
            this.warnings.push('⚠️  .env file present - ensure it\'s in .gitignore');
        }

        if (fs.existsSync('.env.example')) {
            this.checks.push('✅ .env.example template provided');
        }
    }

    validatePerformance() {
        console.log('\n⚡ Validating Performance...');
        
        // Check file sizes
        const performanceCriticalFiles = [
            'public/app.js',
            'public/styles.css',
            'public/nfl-2024-data.js'
        ];

        performanceCriticalFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const stats = fs.statSync(file);
                const sizeMB = stats.size / 1024 / 1024;
                
                if (sizeMB > 5) {
                    this.warnings.push(`⚠️  ${file} is large (${sizeMB.toFixed(2)}MB) - consider optimization`);
                } else if (sizeMB > 1) {
                    this.warnings.push(`⚠️  ${file} is moderately large (${sizeMB.toFixed(2)}MB)`);
                } else {
                    this.checks.push(`✅ ${file} size is reasonable (${sizeMB.toFixed(2)}MB)`);
                }
            }
        });

        // Check for compression
        if (fs.existsSync('server.js')) {
            const serverContent = fs.readFileSync('server.js', 'utf8');
            
            if (serverContent.includes('compression')) {
                this.checks.push('✅ Response compression enabled');
            } else {
                this.warnings.push('⚠️  Response compression not enabled');
            }
        }

        // Check for caching headers
        if (fs.existsSync('server.js')) {
            const serverContent = fs.readFileSync('server.js', 'utf8');
            
            if (serverContent.includes('maxAge') || serverContent.includes('Cache-Control')) {
                this.checks.push('✅ Caching headers configured');
            } else {
                this.warnings.push('⚠️  Caching headers not configured');
            }
        }
    }

    printValidationResults() {
        console.log('\n' + '='.repeat(70));
        console.log('🏁 PRODUCTION DEPLOYMENT VALIDATION RESULTS');
        console.log('='.repeat(70));
        
        console.log(`\n✅ PASSED CHECKS (${this.checks.length}):`);
        this.checks.forEach(check => console.log(`  ${check}`));
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }
        
        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`  ${error}`));
        }
        
        console.log('\n' + '='.repeat(70));
        
        if (this.errors.length === 0) {
            console.log('🎉 DEPLOYMENT VALIDATION PASSED!');
            console.log('✅ System is ready for production deployment');
            
            if (this.warnings.length > 0) {
                console.log(`⚠️  Consider addressing ${this.warnings.length} warnings for optimal performance`);
            }
        } else {
            console.log('❌ DEPLOYMENT VALIDATION FAILED!');
            console.log(`🔧 Please fix ${this.errors.length} critical errors before deployment`);
        }
        
        console.log('\n📊 SUMMARY:');
        console.log(`  • Checks Passed: ${this.checks.length}`);
        console.log(`  • Warnings: ${this.warnings.length}`);
        console.log(`  • Critical Errors: ${this.errors.length}`);
        
        const totalChecks = this.checks.length + this.warnings.length + this.errors.length;
        const successRate = ((this.checks.length / totalChecks) * 100).toFixed(1);
        console.log(`  • Success Rate: ${successRate}%`);
        
        console.log('='.repeat(70));
    }
}

// Run validation if this file is executed directly
if (require.main === module) {
    const validator = new ProductionDeploymentValidator();
    
    console.log('🔍 Starting production deployment validation...\n');
    
    validator.validateDeployment().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    });
}

module.exports = ProductionDeploymentValidator;