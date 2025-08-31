# Vercel Deployment Guide

## Overview

This guide covers the corrected deployment process for the NFL Analytics Pro platform on Vercel. The previous deployment issues have been resolved by fixing the build configuration and project structure.

## Fixed Issues

### Previous Problem
- Build command referenced non-existent `client` directory
- Command: `npm install && (cd client && npm install && npm run build)`
- Error: `cd: no such file or directory: client`

### Solution Applied
- Updated build configuration to match actual project structure
- Corrected build commands in `package.json` and `vercel.json`
- Added proper build validation and testing

## Current Configuration

### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "env": {
    "NODE_VERSION": "18.x"
  }
}
```

### package.json Build Scripts
```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:css && npm run build:public",
    "build:frontend": "cd frontend && npm install && ./node_modules/.bin/tsc && ./node_modules/.bin/vite build",
    "build:css": "./node_modules/.bin/postcss public/modern-theme.css -o public/dist/styles.min.css --map",
    "build:public": "mkdir -p dist && cp -r public/* dist/ && cp -r frontend/dist/* dist/",
    "test:build": "node test-build-locally.js"
  }
}
```

## Deployment Process

### 1. Pre-Deployment Validation
```bash
npm run test:build
```

This validates:
- Project structure
- Build process
- Output directory creation
- Asset generation

### 2. Deploy to Vercel
```bash
./deploy-vercel.sh
```

Or manually:
```bash
./node_modules/.bin/vercel --prod --confirm
```

### 3. Post-Deployment Validation
```bash
node validate-deployment.js <deployment-url>
```

## Build Process Details

### Frontend Build
1. Navigate to `frontend` directory
2. Install dependencies
3. Compile TypeScript
4. Build with Vite

### CSS Build
1. Process `public/modern-theme.css` with PostCSS
2. Generate minified output in `public/dist/`

### Public Assets
1. Create `dist` directory
2. Copy all public assets
3. Copy frontend build output

## Troubleshooting

### Common Issues

#### Build Fails with Directory Errors
- **Cause**: Incorrect directory references in build scripts
- **Solution**: Verify all paths in `package.json` scripts exist

#### Missing Dependencies
- **Cause**: Dependencies not installed in correct directories
- **Solution**: Run `npm install` in both root and `frontend` directories

#### Build Output Missing
- **Cause**: Build process not completing successfully
- **Solution**: Run `npm run test:build` to identify issues

### Debugging Steps

1. **Local Build Test**
   ```bash
   npm run test:build
   ```

2. **Check Build Output**
   ```bash
   ls -la dist/
   ```

3. **Validate Configuration**
   ```bash
   node validate-project-structure.js
   ```

## Environment Variables

### Required for Production
- `NODE_ENV=production`
- `NODE_VERSION=18.x`

### Optional API Keys
- Sports data API keys (if using external APIs)
- Database connection strings (if using databases)

## Performance Optimization

### Build Optimizations
- CSS minification with PostCSS
- JavaScript bundling with Vite
- Asset compression enabled
- Cache headers configured

### Vercel Settings
- Regions: `iad1` (US East)
- Node.js runtime: `18.x`
- Clean URLs enabled
- Trailing slash handling

## Monitoring

### Deployment Logs
- Check Vercel dashboard for build logs
- Monitor function execution logs
- Review performance metrics

### Health Checks
- Main page accessibility
- Asset loading
- API endpoint availability

## Support

### If Deployment Fails
1. Check build logs in Vercel dashboard
2. Run local build test: `npm run test:build`
3. Validate project structure: `node validate-project-structure.js`
4. Review this guide for configuration issues

### Contact
- Check GitHub issues for known problems
- Review Vercel documentation for platform-specific issues