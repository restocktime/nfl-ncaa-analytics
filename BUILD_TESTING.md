# Build Testing Guide

This document explains how to test your build process locally before deploying to Vercel, helping catch common deployment issues early.

## Quick Start

Run a quick build test before deployment:

```bash
npm run test:build:quick
```

Run a comprehensive build test:

```bash
npm run test:build
```

## Available Scripts

### `npm run test:build:quick`
- Fast validation of essential build requirements
- Checks for critical files and basic build functionality
- Recommended before every deployment
- Takes 1-2 minutes to complete

### `npm run test:build`
- Comprehensive build validation
- Tests all aspects of the build process
- Validates output against Vercel expectations
- Checks for common deployment issues
- Takes 3-5 minutes to complete

### `npm run predeploy`
- Automatically runs quick build test before deployment
- Prevents deployment if critical issues are found

## What Gets Tested

### Project Structure Validation
- ✅ Required files exist (package.json, public/index.html)
- ✅ Build configuration is valid
- ⚠️ Warns about problematic directory structures

### Dependency Installation
- ✅ Root dependencies install successfully
- ✅ Frontend dependencies (if frontend/ exists)
- ✅ Server dependencies (if server/ exists)

### Build Process
- ✅ Build command executes without errors
- ✅ Build completes within reasonable time
- ✅ No directory navigation errors

### Build Output Validation
- ✅ Output directory is created
- ✅ Essential files are present in output
- ✅ File sizes are within deployment limits
- ✅ API functions are properly included

### Common Issue Detection
- ⚠️ Case sensitivity problems
- ⚠️ Missing environment variables
- ⚠️ Node.js version mismatches
- ⚠️ Package.json configuration issues

## Understanding Test Results

### ✅ Success (Green)
- Test passed successfully
- No action required

### ⚠️ Warning (Yellow)
- Potential issue detected
- Review recommended but not blocking
- May cause issues in production

### ❌ Error (Red)
- Critical issue that will cause deployment failure
- Must be fixed before deployment

## Common Issues and Solutions

### "Output directory does not exist after build"
**Cause:** Build command doesn't create expected output directory
**Solution:** Check `vercel.json` outputDirectory matches actual build output

### "Required file missing: package.json"
**Cause:** Script run from wrong directory
**Solution:** Run from project root directory

### "Build failed: command not found"
**Cause:** Build dependencies not installed
**Solution:** Run `npm install` first

### "Large file detected"
**Cause:** Build output contains files larger than 25MB
**Solution:** Optimize assets or exclude large files from build

### "Case sensitivity issue"
**Cause:** File references use different case than actual files
**Solution:** Ensure file references match exact case of files

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Test build locally
  run: npm run test:build:quick

- name: Deploy to Vercel
  if: success()
  run: vercel --prod
```

## Troubleshooting

### Script won't run
1. Ensure you're in the project root directory
2. Check that Node.js is installed (`node --version`)
3. Install dependencies (`npm install`)

### Build test passes but Vercel deployment fails
1. Run the comprehensive test: `npm run test:build`
2. Check Vercel deployment logs for specific errors
3. Ensure environment variables are configured in Vercel dashboard

### False positives in warnings
Some warnings may not apply to your specific setup. Review each warning and determine if action is needed for your project.

## Configuration

The build tester automatically reads configuration from:
- `package.json` - Build scripts and dependencies
- `vercel.json` - Deployment configuration
- Project structure - Actual file layout

No additional configuration is required for most projects.

## Support

If you encounter issues with the build tester itself:
1. Check that all required files exist
2. Ensure Node.js version compatibility
3. Review the test output for specific error messages
4. Check project structure matches expected layout

For Vercel-specific deployment issues, consult the [Vercel documentation](https://vercel.com/docs).