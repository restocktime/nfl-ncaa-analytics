# Project Structure Validation

This document explains how to use the project structure validation script to ensure your project is properly configured for Vercel deployment.

## Overview

The `validate-project-structure.js` script analyzes your project directory structure and identifies potential issues that could cause Vercel deployment failures.

## Usage

### Basic Validation

Run the validation script from your project root:

```bash
node validate-project-structure.js
```

### What It Checks

The script validates:

1. **Core Files**: Ensures required files like `package.json` and `README.md` exist
2. **Project Structure**: Identifies project type (static site, SPA, client-server, etc.)
3. **Package.json Files**: Finds and validates all package.json files in the project
4. **Build Scripts**: Checks for problematic directory references in build commands
5. **Build Outputs**: Verifies existence of build output directories
6. **Vercel Configuration**: Validates vercel.json settings

### Output

The script generates:

- **Console Report**: Detailed validation results with color-coded status
- **JSON Report**: Machine-readable report saved as `project-structure-report.json`
- **Exit Code**: 0 for success, 1 for validation failures

### Common Issues Detected

#### Build Script References Non-existent Directory

**Problem**: Build command like `cd client && npm run build` when no `client` directory exists

**Solution**: Update package.json build script:
```json
{
  "scripts": {
    "build": "npm run build"
  }
}
```

#### Missing Vercel Configuration

**Problem**: No vercel.json file for custom build settings

**Solution**: Create vercel.json:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

#### Empty Build Output Directories

**Problem**: Build directories exist but contain no files

**Solution**: Run your build command locally to generate output files

### Integration with CI/CD

Add validation to your deployment pipeline:

```bash
# In your deployment script
node validate-project-structure.js
if [ $? -ne 0 ]; then
  echo "Project structure validation failed"
  exit 1
fi
```

### Customization

The script can be extended by modifying the `expectedStructure` object in the `ProjectStructureValidator` class to match your specific project requirements.

## Requirements Addressed

- **2.2**: Validates build output against expected structure
- **3.2**: Provides clear error messages with suggested fixes