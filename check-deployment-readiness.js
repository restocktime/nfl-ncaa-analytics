#!/usr/bin/env node

/**
 * Deployment Readiness Check
 * Verifies that the project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

class DeploymentReadinessChecker {
    constructor() {
        this.checks = [];
        this.warnings = [];
        this.errors = [];
    }

    async runAllChecks() {
        console.log('🔍 Checking deployment readiness...\n');

        // Run all checks
        this.checkVercelConfig();
        this.checkPackageJson();
        this.checkBuildOutput();
        this.checkAPIFunctions();
        this.checkEnvironmentConfig();

        // Print results
        this.printResults();

        return this.errors.length === 0;
    }

    checkVercelConfig() {
        console.log('📋 Checking Vercel configuration...');

        try {
            const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
            
            // Check required fields
            const requiredFields = ['buildCommand', 'outputDirectory', 'installCommand'];
            const missingFields = requiredFields.filter(field => !vercelConfig[field]);
            
            if (missingFields.length > 0) {
                this.errors.push(`Missing required Vercel config fields: ${missingFields.join(', ')}`);
            } else {
                this.checks.push('✅ Vercel configuration is complete');
            }

            // Check build command
            if (vercelConfig.buildCommand === 'npm run build') {
                this.checks.push('✅ Build command is correct');
            } else {
                this.errors.push('Build command should be "npm run build"');
            }

            // Check output directory
            if (vercelConfig.outputDirectory === 'dist') {
                this.checks.push('✅ Output directory is correct');
            } else {
                this.errors.push('Output directory should be "dist"');
            }

        } catch (error) {
            this.errors.push('vercel.json file is missing or invalid');
        }
    }

    checkPackageJson() {
        console.log('📦 Checking package.json configuration...');

        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Check build script
            if (packageJson.scripts && packageJson.scripts.build) {
                this.checks.push('✅ Build script is defined');
                
                // Check if build script looks correct
                const buildScript = packageJson.scripts.build;
                if (buildScript.includes('build:frontend') && buildScript.includes('build:public')) {
                    this.checks.push('✅ Build script includes all necessary steps');
                } else {
                    this.warnings.push('Build script may be incomplete');
                }
            } else {
                this.errors.push('Build script is missing from package.json');
            }

            // Check Node.js version
            if (packageJson.engines && packageJson.engines.node) {
                this.checks.push('✅ Node.js version is specified');
            } else {
                this.warnings.push('Node.js version not specified in engines');
            }

        } catch (error) {
            this.errors.push('package.json file is missing or invalid');
        }
    }

    checkBuildOutput() {
        console.log('🏗️  Checking build output...');

        // Check if dist directory exists (from previous build)
        if (fs.existsSync('dist')) {
            this.checks.push('✅ Build output directory exists');
            
            // Check for key files
            const keyFiles = ['index.html', 'app.js', 'styles.css'];
            const missingFiles = keyFiles.filter(file => !fs.existsSync(path.join('dist', file)));
            
            if (missingFiles.length === 0) {
                this.checks.push('✅ All key build files are present');
            } else {
                this.warnings.push(`Missing build files: ${missingFiles.join(', ')} (run npm run build)`);
            }
        } else {
            this.warnings.push('Build output directory not found (run npm run build)');
        }
    }

    checkAPIFunctions() {
        console.log('🔌 Checking API functions...');

        const apiFunctions = ['api/hardrock.js', 'api/test.js'];
        let foundFunctions = 0;

        apiFunctions.forEach(func => {
            if (fs.existsSync(func)) {
                foundFunctions++;
            }
        });

        if (foundFunctions > 0) {
            this.checks.push(`✅ Found ${foundFunctions} API function(s)`);
        } else {
            this.warnings.push('No API functions found');
        }
    }

    checkEnvironmentConfig() {
        console.log('🌍 Checking environment configuration...');

        // Check for environment files
        const envFiles = ['.env.example', '.env.production'];
        const foundEnvFiles = envFiles.filter(file => fs.existsSync(file));

        if (foundEnvFiles.length > 0) {
            this.checks.push(`✅ Environment configuration files found: ${foundEnvFiles.join(', ')}`);
        } else {
            this.warnings.push('No environment configuration files found');
        }
    }

    printResults() {
        console.log('\n=== DEPLOYMENT READINESS REPORT ===\n');

        // Print successful checks
        if (this.checks.length > 0) {
            console.log('✅ PASSED CHECKS:');
            this.checks.forEach(check => console.log(`  ${check}`));
            console.log('');
        }

        // Print warnings
        if (this.warnings.length > 0) {
            console.log('⚠️  WARNINGS:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
            console.log('');
        }

        // Print errors
        if (this.errors.length > 0) {
            console.log('❌ ERRORS:');
            this.errors.forEach(error => console.log(`  • ${error}`));
            console.log('');
        }

        // Overall status
        const isReady = this.errors.length === 0;
        console.log(`${isReady ? '🎉 READY FOR DEPLOYMENT' : '❌ NOT READY FOR DEPLOYMENT'}`);
        
        if (isReady) {
            console.log('\nYou can now deploy with: ./deploy-vercel.sh');
        } else {
            console.log('\nPlease fix the errors above before deploying.');
        }

        console.log('\n=== END REPORT ===');
    }
}

// Main execution
if (require.main === module) {
    const checker = new DeploymentReadinessChecker();
    checker.runAllChecks().then(isReady => {
        process.exit(isReady ? 0 : 1);
    });
}

module.exports = DeploymentReadinessChecker;