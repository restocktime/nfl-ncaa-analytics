#!/usr/bin/env node

/**
 * Button Functionality Validation Script
 * Tests all button onclick handlers and JavaScript functions
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Validating Button Functionality...\n');

// Read the HTML file
const htmlPath = path.join(__dirname, 'public', 'index.html');
const appJsPath = path.join(__dirname, 'public', 'app.js');

if (!fs.existsSync(htmlPath)) {
    console.error('❌ index.html not found');
    process.exit(1);
}

if (!fs.existsSync(appJsPath)) {
    console.error('❌ app.js not found');
    process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Extract onclick handlers from HTML
const onclickMatches = htmlContent.match(/onclick="([^"]+)"/g) || [];
const onclickFunctions = onclickMatches.map(match => {
    const func = match.match(/onclick="([^"(]+)/)[1];
    return func;
});

console.log('📋 Found onclick handlers:');
onclickFunctions.forEach(func => {
    console.log(`  - ${func}()`);
});

// Check if functions exist in app.js
const missingFunctions = [];
const existingFunctions = [];

onclickFunctions.forEach(func => {
    // Check for window.functionName or just functionName
    const patterns = [
        new RegExp(`window\\.${func}\\s*=\\s*function`, 'g'),
        new RegExp(`function\\s+${func}\\s*\\(`, 'g'),
        new RegExp(`${func}\\s*:\\s*function`, 'g'),
        new RegExp(`const\\s+${func}\\s*=`, 'g'),
        new RegExp(`let\\s+${func}\\s*=`, 'g'),
        new RegExp(`var\\s+${func}\\s*=`, 'g')
    ];
    
    const found = patterns.some(pattern => pattern.test(appJsContent));
    
    if (found) {
        existingFunctions.push(func);
    } else {
        // Check if it's a method call like nflApp.method
        if (func.includes('.')) {
            const [obj, method] = func.split('.');
            const objPattern = new RegExp(`window\\.${obj}\\s*=\\s*{[\\s\\S]*?${method}\\s*:`, 'g');
            if (objPattern.test(appJsContent)) {
                existingFunctions.push(func);
            } else {
                missingFunctions.push(func);
            }
        } else {
            missingFunctions.push(func);
        }
    }
});

console.log('\n✅ Functions found in app.js:');
existingFunctions.forEach(func => {
    console.log(`  ✓ ${func}()`);
});

if (missingFunctions.length > 0) {
    console.log('\n❌ Missing functions:');
    missingFunctions.forEach(func => {
        console.log(`  ✗ ${func}()`);
    });
} else {
    console.log('\n🎉 All onclick functions are properly defined!');
}

// Check for common JavaScript errors
console.log('\n🔍 Checking for potential issues...');

const issues = [];

// Check for syntax errors (basic)
try {
    // This is a very basic check - in a real scenario you'd use a proper JS parser
    const functionCount = (appJsContent.match(/function/g) || []).length;
    const braceCount = (appJsContent.match(/{/g) || []).length - (appJsContent.match(/}/g) || []).length;
    
    if (braceCount !== 0) {
        issues.push(`Potential brace mismatch: ${braceCount > 0 ? 'missing closing' : 'extra closing'} braces`);
    }
    
    console.log(`  ✓ Found ${functionCount} function declarations`);
    console.log(`  ✓ Brace balance: ${braceCount === 0 ? 'OK' : 'ISSUE'}`);
} catch (error) {
    issues.push(`Syntax check error: ${error.message}`);
}

// Check if comprehensive app is included
if (htmlContent.includes('comprehensive-nfl-app.js')) {
    console.log('  ✓ Comprehensive NFL app included');
} else {
    issues.push('Comprehensive NFL app script not included');
}

// Check if main app.js is included
if (htmlContent.includes('app.js')) {
    console.log('  ✓ Main app.js script included');
} else {
    issues.push('Main app.js script not included');
}

// Summary
console.log('\n📊 VALIDATION SUMMARY:');
console.log(`  Total onclick handlers: ${onclickFunctions.length}`);
console.log(`  Functions found: ${existingFunctions.length}`);
console.log(`  Missing functions: ${missingFunctions.length}`);
console.log(`  Issues found: ${issues.length}`);

if (missingFunctions.length === 0 && issues.length === 0) {
    console.log('\n🎉 ALL BUTTONS SHOULD BE WORKING! 🎉');
    console.log('\nTo test the buttons:');
    console.log('1. Open public/index.html in a browser');
    console.log('2. Or open public/test-buttons.html for comprehensive testing');
    console.log('3. Check browser console for any runtime errors');
} else {
    console.log('\n⚠️  ISSUES FOUND - BUTTONS MAY NOT WORK PROPERLY');
    if (issues.length > 0) {
        console.log('\nIssues to fix:');
        issues.forEach(issue => console.log(`  - ${issue}`));
    }
}

console.log('\n🔗 Test URLs:');
console.log('  Main app: file://' + path.resolve(htmlPath));
console.log('  Button test: file://' + path.resolve(__dirname, 'public', 'test-buttons.html'));