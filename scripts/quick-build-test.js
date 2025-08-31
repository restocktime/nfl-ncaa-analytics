#!/usr/bin/env node

/**
 * Quick Build Test Script
 * 
 * A simplified version of the build tester for quick validation
 * before deployment. Focuses on the most critical checks.
 */

const fs = require('fs');
const { execSync } = require('child_process');

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function quickTest() {
    log('🚀 Running quick build test...', 'info');
    
    try {
        // Check essential files
        const essentialFiles = ['package.json', 'public/index.html'];
        for (const file of essentialFiles) {
            if (!fs.existsSync(file)) {
                log(`❌ Missing essential file: ${file}`, 'error');
                return false;
            }
        }
        
        // Quick build test
        log('Building project...', 'info');
        execSync('npm run build', { stdio: 'inherit' });
        
        // Check output
        const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        const outputDir = config.outputDirectory || 'dist';
        
        if (!fs.existsSync(outputDir)) {
            log(`❌ Output directory '${outputDir}' not created`, 'error');
            return false;
        }
        
        if (!fs.existsSync(`${outputDir}/index.html`)) {
            log(`❌ index.html not found in output directory`, 'error');
            return false;
        }
        
        log('✅ Quick build test passed!', 'success');
        return true;
        
    } catch (error) {
        log(`❌ Build failed: ${error.message}`, 'error');
        return false;
    }
}

if (require.main === module) {
    const success = quickTest();
    process.exit(success ? 0 : 1);
}

module.exports = quickTest;