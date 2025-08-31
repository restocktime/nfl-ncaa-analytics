#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Project Structure Validation Script
 * 
 * This script validates the current project directory structure against
 * expected patterns for successful Vercel deployment.
 * 
 * Requirements addressed:
 * - 2.2: Validate build output against expected structure
 * - 3.2: Provide clear error messages with suggested fixes
 */

class ProjectStructureValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.warnings = [];
    this.validations = [];
    
    // Expected project structure patterns
    this.expectedStructure = {
      // Core files that should exist
      requiredFiles: [
        'package.json',
        'README.md'
      ],
      
      // Common frontend directories
      frontendDirs: [
        'public',
        'src',
        'frontend',
        'client',
        'dist',
        'build'
      ],
      
      // Build output directories
      buildOutputDirs: [
        'dist',
        'build',
        'public/dist',
        '.next',
        'out'
      ],
      
      // Package.json locations to check
      packageJsonLocations: [
        'package.json',
        'client/package.json',
        'frontend/package.json'
      ],
      
      // Vercel configuration files
      vercelConfigs: [
        'vercel.json',
        '.vercel.json'
      ]
    };
  }

  /**
   * Check if a file or directory exists
   */
  exists(filePath) {
    try {
      return fs.existsSync(path.join(this.projectRoot, filePath));
    } catch (error) {
      return false;
    }
  }

  /**
   * Get directory contents
   */
  getDirectoryContents(dirPath) {
    try {
      const fullPath = path.join(this.projectRoot, dirPath);
      if (!fs.existsSync(fullPath)) return [];
      
      const stats = fs.statSync(fullPath);
      if (!stats.isDirectory()) return [];
      
      return fs.readdirSync(fullPath);
    } catch (error) {
      return [];
    }
  }

  /**
   * Read and parse package.json
   */
  readPackageJson(packagePath = 'package.json') {
    try {
      const fullPath = path.join(this.projectRoot, packagePath);
      if (!fs.existsSync(fullPath)) return null;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.issues.push(`Failed to parse ${packagePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate core project files
   */
  validateCoreFiles() {
    console.log('🔍 Validating core project files...');
    
    this.expectedStructure.requiredFiles.forEach(file => {
      if (this.exists(file)) {
        this.validations.push(`✅ Found required file: ${file}`);
      } else {
        this.issues.push(`❌ Missing required file: ${file}`);
      }
    });
  }

  /**
   * Analyze project structure type
   */
  analyzeProjectStructure() {
    console.log('🏗️  Analyzing project structure...');
    
    const structure = {
      hasClientDir: this.exists('client'),
      hasFrontendDir: this.exists('frontend'),
      hasPublicDir: this.exists('public'),
      hasSrcDir: this.exists('src'),
      hasDistDir: this.exists('dist'),
      hasBuildDir: this.exists('build')
    };

    // Determine project type
    let projectType = 'unknown';
    if (structure.hasClientDir) {
      projectType = 'client-server';
    } else if (structure.hasFrontendDir) {
      projectType = 'frontend-backend';
    } else if (structure.hasPublicDir && structure.hasSrcDir) {
      projectType = 'single-page-app';
    } else if (structure.hasPublicDir) {
      projectType = 'static-site';
    }

    this.validations.push(`📁 Project type detected: ${projectType}`);
    
    // Check for frontend directories
    const frontendDirs = this.expectedStructure.frontendDirs.filter(dir => this.exists(dir));
    if (frontendDirs.length > 0) {
      this.validations.push(`📂 Frontend directories found: ${frontendDirs.join(', ')}`);
    }

    return { structure, projectType, frontendDirs };
  }

  /**
   * Validate package.json files and build scripts
   */
  validatePackageJsonFiles() {
    console.log('📦 Validating package.json files...');
    
    const packageJsonFiles = [];
    
    this.expectedStructure.packageJsonLocations.forEach(location => {
      if (this.exists(location)) {
        packageJsonFiles.push(location);
        this.validations.push(`✅ Found package.json at: ${location}`);
        
        const pkg = this.readPackageJson(location);
        if (pkg) {
          this.validateBuildScripts(pkg, location);
        }
      }
    });

    if (packageJsonFiles.length === 0) {
      this.issues.push('❌ No package.json files found');
    }

    return packageJsonFiles;
  }

  /**
   * Validate build scripts in package.json
   */
  validateBuildScripts(pkg, location) {
    const scripts = pkg.scripts || {};
    
    // Check for common build scripts
    const buildScripts = ['build', 'build:prod', 'build:production'];
    const hasAnyBuildScript = buildScripts.some(script => scripts[script]);
    
    if (hasAnyBuildScript) {
      this.validations.push(`✅ Build script found in ${location}`);
      
      // Check for problematic directory references
      buildScripts.forEach(scriptName => {
        if (scripts[scriptName]) {
          const script = scripts[scriptName];
          
          // Check for 'cd client' pattern
          if (script.includes('cd client') && !this.exists('client')) {
            this.issues.push(`❌ Build script references non-existent 'client' directory in ${location}`);
            this.issues.push(`   Script: ${scriptName}: "${script}"`);
          }
          
          // Check for other directory references
          const cdMatches = script.match(/cd\s+([^\s&|;]+)/g);
          if (cdMatches) {
            cdMatches.forEach(match => {
              const dir = match.replace('cd ', '').trim();
              if (!this.exists(dir)) {
                this.warnings.push(`⚠️  Build script references directory '${dir}' which may not exist`);
              }
            });
          }
        }
      });
    } else {
      this.warnings.push(`⚠️  No build script found in ${location}`);
    }

    // Check start script
    if (scripts.start) {
      this.validations.push(`✅ Start script found in ${location}`);
    }
  }

  /**
   * Validate build output directories
   */
  validateBuildOutputs() {
    console.log('🏭 Validating build output directories...');
    
    const existingOutputDirs = this.expectedStructure.buildOutputDirs.filter(dir => this.exists(dir));
    
    if (existingOutputDirs.length > 0) {
      this.validations.push(`✅ Build output directories found: ${existingOutputDirs.join(', ')}`);
      
      // Check if output directories have content
      existingOutputDirs.forEach(dir => {
        const contents = this.getDirectoryContents(dir);
        if (contents.length > 0) {
          this.validations.push(`📄 ${dir} contains ${contents.length} files/directories`);
        } else {
          this.warnings.push(`⚠️  ${dir} exists but is empty`);
        }
      });
    } else {
      this.warnings.push('⚠️  No build output directories found');
    }

    return existingOutputDirs;
  }

  /**
   * Validate Vercel configuration
   */
  validateVercelConfig() {
    console.log('⚡ Validating Vercel configuration...');
    
    const vercelConfigs = this.expectedStructure.vercelConfigs.filter(config => this.exists(config));
    
    if (vercelConfigs.length > 0) {
      this.validations.push(`✅ Vercel config found: ${vercelConfigs.join(', ')}`);
      
      // Read and validate vercel.json
      vercelConfigs.forEach(configFile => {
        try {
          const configPath = path.join(this.projectRoot, configFile);
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          if (config.buildCommand) {
            this.validations.push(`✅ Custom build command specified: ${config.buildCommand}`);
          }
          
          if (config.outputDirectory) {
            this.validations.push(`✅ Output directory specified: ${config.outputDirectory}`);
            if (!this.exists(config.outputDirectory)) {
              this.warnings.push(`⚠️  Specified output directory '${config.outputDirectory}' does not exist`);
            }
          }
          
          if (config.framework) {
            this.validations.push(`✅ Framework specified: ${config.framework}`);
          }
          
        } catch (error) {
          this.issues.push(`❌ Failed to parse ${configFile}: ${error.message}`);
        }
      });
    } else {
      this.warnings.push('⚠️  No Vercel configuration file found');
    }

    return vercelConfigs;
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations(analysisResults) {
    const recommendations = [];
    
    // Recommendations based on issues found
    if (this.issues.some(issue => issue.includes("references non-existent 'client' directory"))) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Build script references non-existent client directory',
        solution: 'Update package.json build script to remove "cd client" or create the client directory structure',
        example: 'Change "npm install && (cd client && npm install && npm run build)" to "npm install && npm run build"'
      });
    }

    if (!this.exists('vercel.json') && analysisResults.projectType !== 'static-site') {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'No Vercel configuration file',
        solution: 'Create vercel.json to specify build settings',
        example: '{"buildCommand": "npm run build", "outputDirectory": "dist"}'
      });
    }

    if (analysisResults.frontendDirs.length === 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'No clear frontend directory structure',
        solution: 'Organize code into standard directories (public, src, etc.)',
        example: 'Move static files to public/ directory'
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(analysisResults, recommendations) {
    const report = {
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      summary: {
        totalValidations: this.validations.length,
        totalIssues: this.issues.length,
        totalWarnings: this.warnings.length,
        projectType: analysisResults.projectType
      },
      structure: analysisResults.structure,
      validations: this.validations,
      issues: this.issues,
      warnings: this.warnings,
      recommendations: recommendations
    };

    return report;
  }

  /**
   * Print formatted report to console
   */
  printReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROJECT STRUCTURE VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📅 Generated: ${report.timestamp}`);
    console.log(`📁 Project Root: ${report.projectRoot}`);
    console.log(`🏗️  Project Type: ${report.summary.projectType}`);
    
    console.log('\n📈 SUMMARY:');
    console.log(`  ✅ Validations: ${report.summary.totalValidations}`);
    console.log(`  ❌ Issues: ${report.summary.totalIssues}`);
    console.log(`  ⚠️  Warnings: ${report.summary.totalWarnings}`);

    if (report.validations.length > 0) {
      console.log('\n✅ VALIDATIONS:');
      report.validations.forEach(validation => console.log(`  ${validation}`));
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (report.issues.length > 0) {
      console.log('\n❌ ISSUES:');
      report.issues.forEach(issue => console.log(`  ${issue}`));
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`\n  ${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`     Solution: ${rec.solution}`);
        if (rec.example) {
          console.log(`     Example: ${rec.example}`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    
    // Overall status
    if (report.summary.totalIssues === 0) {
      console.log('🎉 PROJECT STRUCTURE VALIDATION PASSED!');
    } else {
      console.log('🚨 PROJECT STRUCTURE VALIDATION FAILED!');
      console.log(`   Please address ${report.summary.totalIssues} issue(s) before deployment.`);
    }
    
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Save report to file
   */
  saveReport(report, filename = 'project-structure-report.json') {
    try {
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save report: ${error.message}`);
    }
  }

  /**
   * Run complete validation
   */
  async validate() {
    console.log('🚀 Starting project structure validation...\n');

    // Run all validations
    this.validateCoreFiles();
    const analysisResults = this.analyzeProjectStructure();
    this.validatePackageJsonFiles();
    this.validateBuildOutputs();
    this.validateVercelConfig();

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysisResults);

    // Generate and display report
    const report = this.generateReport(analysisResults, recommendations);
    this.printReport(report);

    // Save report to file
    this.saveReport(report);

    // Return exit code based on issues
    return this.issues.length === 0 ? 0 : 1;
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ProjectStructureValidator();
  
  validator.validate().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = ProjectStructureValidator;