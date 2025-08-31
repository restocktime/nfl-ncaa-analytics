#!/usr/bin/env node

/**
 * Local Build Testing Script for Vercel Deployment
 * 
 * This script tests the build process locally before deployment to catch
 * common issues and validate that build output matches Vercel expectations.
 * 
 * Requirements covered:
 * - 2.2: Validate that build output matches expectations
 * - 3.1: Check for common deployment issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

class BuildTester {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.buildStartTime = 0;
        this.buildEndTime = 0;
        this.config = this.loadConfiguration();
    }

    /**
     * Load build configuration from package.json and vercel.json
     */
    loadConfiguration() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        let vercelConfig = {};
        
        try {
            vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        } catch (error) {
            this.warnings.push('No vercel.json found - using default configuration');
        }

        return {
            buildCommand: vercelConfig.buildCommand || packageJson.scripts?.build || 'npm run build',
            outputDirectory: vercelConfig.outputDirectory || 'dist',
            installCommand: vercelConfig.installCommand || 'npm install',
            framework: vercelConfig.framework,
            nodeVersion: vercelConfig.env?.NODE_VERSION || process.version
        };
    }

    /**
     * Log messages with timestamps and colors
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    /**
     * Execute command and capture output
     */
    executeCommand(command, options = {}) {
        try {
            this.log(`Executing: ${command}`, 'info');
            const output = execSync(command, {
                encoding: 'utf8',
                stdio: 'pipe',
                ...options
            });
            return { success: true, output };
        } catch (error) {
            return { 
                success: false, 
                error: error.message,
                stdout: error.stdout?.toString() || '',
                stderr: error.stderr?.toString() || ''
            };
        }
    }

    /**
     * Check if required directories and files exist
     */
    validateProjectStructure() {
        this.log('Validating project structure...', 'info');
        
        const requiredFiles = [
            'package.json',
            'public/index.html'
        ];

        const optionalFiles = [
            'vercel.json',
            'frontend/package.json',
            'server/package.json'
        ];

        // Check required files
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                this.errors.push(`Required file missing: ${file}`);
            }
        }

        // Check optional files and warn if missing
        for (const file of optionalFiles) {
            if (!fs.existsSync(file)) {
                this.warnings.push(`Optional file missing: ${file}`);
            }
        }

        // Check for common problematic directories
        const problematicDirs = ['client', 'build'];
        for (const dir of problematicDirs) {
            if (fs.existsSync(dir)) {
                this.warnings.push(`Found directory '${dir}' - ensure build commands reference correct paths`);
            }
        }
    }

    /**
     * Clean previous build artifacts
     */
    cleanBuildArtifacts() {
        this.log('Cleaning previous build artifacts...', 'info');
        
        const dirsToClean = [
            this.config.outputDirectory,
            'frontend/dist',
            'public/dist'
        ];

        for (const dir of dirsToClean) {
            if (fs.existsSync(dir)) {
                try {
                    fs.rmSync(dir, { recursive: true, force: true });
                    this.log(`Cleaned: ${dir}`, 'success');
                } catch (error) {
                    this.warnings.push(`Failed to clean ${dir}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Test dependency installation
     */
    testDependencyInstallation() {
        this.log('Testing dependency installation...', 'info');
        
        // Test root dependencies
        const installResult = this.executeCommand(this.config.installCommand);
        if (!installResult.success) {
            this.errors.push(`Root dependency installation failed: ${installResult.error}`);
            return false;
        }

        // Test frontend dependencies if frontend exists
        if (fs.existsSync('frontend/package.json')) {
            const frontendInstall = this.executeCommand('npm install', { cwd: 'frontend' });
            if (!frontendInstall.success) {
                this.errors.push(`Frontend dependency installation failed: ${frontendInstall.error}`);
                return false;
            }
        }

        // Test server dependencies if server exists
        if (fs.existsSync('server/package.json')) {
            const serverInstall = this.executeCommand('npm install', { cwd: 'server' });
            if (!serverInstall.success) {
                this.errors.push(`Server dependency installation failed: ${serverInstall.error}`);
                return false;
            }
        }

        this.log('Dependency installation successful', 'success');
        return true;
    }

    /**
     * Test the build process
     */
    testBuildProcess() {
        this.log('Testing build process...', 'info');
        
        this.buildStartTime = performance.now();
        const buildResult = this.executeCommand(this.config.buildCommand);
        this.buildEndTime = performance.now();

        if (!buildResult.success) {
            this.errors.push(`Build failed: ${buildResult.error}`);
            if (buildResult.stderr) {
                this.errors.push(`Build stderr: ${buildResult.stderr}`);
            }
            return false;
        }

        const buildTime = ((this.buildEndTime - this.buildStartTime) / 1000).toFixed(2);
        this.log(`Build completed in ${buildTime} seconds`, 'success');
        
        return true;
    }

    /**
     * Validate build output matches Vercel expectations
     */
    validateBuildOutput() {
        this.log('Validating build output...', 'info');
        
        const outputDir = this.config.outputDirectory;
        
        // Check if output directory exists
        if (!fs.existsSync(outputDir)) {
            this.errors.push(`Output directory '${outputDir}' does not exist after build`);
            return false;
        }

        // Check for essential files in output
        const essentialFiles = [
            'index.html',
            'app.js',
            'styles.css'
        ];

        let foundFiles = 0;
        for (const file of essentialFiles) {
            const filePath = path.join(outputDir, file);
            if (fs.existsSync(filePath)) {
                foundFiles++;
                const stats = fs.statSync(filePath);
                this.log(`Found ${file} (${stats.size} bytes)`, 'success');
            } else {
                this.warnings.push(`Expected file not found in output: ${file}`);
            }
        }

        // Check for API functions if they exist
        if (fs.existsSync('api')) {
            const apiFiles = fs.readdirSync('api').filter(f => f.endsWith('.js'));
            for (const apiFile of apiFiles) {
                if (fs.existsSync(path.join('api', apiFile))) {
                    this.log(`API function found: ${apiFile}`, 'success');
                }
            }
        }

        // Validate file sizes (warn if too large)
        this.validateFileSizes(outputDir);
        
        return foundFiles > 0;
    }

    /**
     * Check for files that might be too large for deployment
     */
    validateFileSizes(outputDir) {
        const maxFileSize = 25 * 1024 * 1024; // 25MB limit for Vercel
        const maxTotalSize = 100 * 1024 * 1024; // 100MB total limit
        
        let totalSize = 0;
        
        const checkDirectory = (dir) => {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                
                if (file.isDirectory()) {
                    checkDirectory(filePath);
                } else {
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    
                    if (stats.size > maxFileSize) {
                        this.warnings.push(`Large file detected: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                    }
                }
            }
        };
        
        checkDirectory(outputDir);
        
        if (totalSize > maxTotalSize) {
            this.warnings.push(`Total build size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds recommended limit`);
        } else {
            this.log(`Total build size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'success');
        }
    }

    /**
     * Check for common deployment issues
     */
    checkCommonIssues() {
        this.log('Checking for common deployment issues...', 'info');
        
        // Check for case sensitivity issues
        this.checkCaseSensitivity();
        
        // Check for missing environment variables
        this.checkEnvironmentVariables();
        
        // Check for Node.js version compatibility
        this.checkNodeVersion();
        
        // Check for package.json issues
        this.checkPackageJsonIssues();
    }

    /**
     * Check for case sensitivity issues in file references
     */
    checkCaseSensitivity() {
        const outputDir = this.config.outputDirectory;
        if (!fs.existsSync(outputDir)) return;
        
        // Check HTML files for case-sensitive references
        const htmlFiles = this.findFiles(outputDir, '.html');
        
        for (const htmlFile of htmlFiles) {
            const content = fs.readFileSync(htmlFile, 'utf8');
            
            // Check for common case issues
            const caseIssues = [
                { pattern: /src=["'][^"']*[A-Z][^"']*\.js["']/g, type: 'JavaScript' },
                { pattern: /href=["'][^"']*[A-Z][^"']*\.css["']/g, type: 'CSS' },
                { pattern: /src=["'][^"']*[A-Z][^"']*\.(png|jpg|jpeg|gif|svg)["']/g, type: 'Image' }
            ];
            
            for (const issue of caseIssues) {
                const matches = content.match(issue.pattern);
                if (matches) {
                    this.warnings.push(`Potential case sensitivity issue in ${htmlFile}: ${issue.type} references with uppercase characters`);
                }
            }
        }
    }

    /**
     * Check for missing environment variables
     */
    checkEnvironmentVariables() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Look for environment variable usage in scripts
        const scripts = packageJson.scripts || {};
        for (const [scriptName, script] of Object.entries(scripts)) {
            if (script.includes('$') || script.includes('process.env')) {
                this.warnings.push(`Script '${scriptName}' may use environment variables - ensure they're configured in Vercel`);
            }
        }
    }

    /**
     * Check Node.js version compatibility
     */
    checkNodeVersion() {
        const currentVersion = process.version;
        const requiredVersion = this.config.nodeVersion;
        
        if (requiredVersion && currentVersion !== requiredVersion) {
            this.warnings.push(`Node.js version mismatch: current ${currentVersion}, required ${requiredVersion}`);
        }
    }

    /**
     * Check for common package.json issues
     */
    checkPackageJsonIssues() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check for missing main field
        if (!packageJson.main && !packageJson.scripts?.start) {
            this.warnings.push('No main field or start script defined in package.json');
        }
        
        // Check for engines field
        if (!packageJson.engines) {
            this.warnings.push('No engines field in package.json - consider specifying Node.js version');
        }
        
        // Check for build script
        if (!packageJson.scripts?.build) {
            this.warnings.push('No build script defined in package.json');
        }
    }

    /**
     * Find files with specific extension recursively
     */
    findFiles(dir, extension) {
        const files = [];
        
        const search = (currentDir) => {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(currentDir, item.name);
                
                if (item.isDirectory()) {
                    search(fullPath);
                } else if (item.name.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        };
        
        search(dir);
        return files;
    }

    /**
     * Generate test report
     */
    generateReport() {
        this.log('\n=== BUILD TEST REPORT ===', 'info');
        
        const buildTime = this.buildEndTime > 0 ? 
            ((this.buildEndTime - this.buildStartTime) / 1000).toFixed(2) : 'N/A';
        
        console.log(`Build Time: ${buildTime} seconds`);
        console.log(`Configuration: ${JSON.stringify(this.config, null, 2)}`);
        
        if (this.errors.length === 0) {
            this.log('\n✅ BUILD TEST PASSED', 'success');
            this.log('Your project should deploy successfully to Vercel!', 'success');
        } else {
            this.log('\n❌ BUILD TEST FAILED', 'error');
            this.log('The following errors must be fixed before deployment:', 'error');
            this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
        }
        
        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS', 'warning');
            this.log('The following issues should be reviewed:', 'warning');
            this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
        }
        
        this.log('\n=== END REPORT ===', 'info');
        
        return this.errors.length === 0;
    }

    /**
     * Run all tests
     */
    async runTests() {
        this.log('Starting local build test...', 'info');
        
        try {
            // Step 1: Validate project structure
            this.validateProjectStructure();
            
            // Step 2: Clean previous builds
            this.cleanBuildArtifacts();
            
            // Step 3: Test dependency installation
            if (!this.testDependencyInstallation()) {
                return this.generateReport();
            }
            
            // Step 4: Test build process
            if (!this.testBuildProcess()) {
                return this.generateReport();
            }
            
            // Step 5: Validate build output
            if (!this.validateBuildOutput()) {
                return this.generateReport();
            }
            
            // Step 6: Check for common issues
            this.checkCommonIssues();
            
            // Step 7: Generate report
            return this.generateReport();
            
        } catch (error) {
            this.errors.push(`Unexpected error during testing: ${error.message}`);
            return this.generateReport();
        }
    }
}

// Run the tests if this script is executed directly
if (require.main === module) {
    const tester = new BuildTester();
    tester.runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = BuildTester;