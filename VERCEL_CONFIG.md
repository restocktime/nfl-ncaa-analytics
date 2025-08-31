# Vercel Configuration Documentation

## Overview

This document explains the Vercel deployment configuration for the NFL Analytics Pro platform.

## Configuration Details

### Build Process

The build process consists of three main steps:

1. **Frontend Build** (`npm run build:frontend`)
   - Navigates to the `frontend/` directory
   - Installs frontend dependencies
   - Compiles TypeScript using `tsc`
   - Builds the React application using Vite

2. **CSS Build** (`npm run build:css`)
   - Processes CSS files using PostCSS
   - Minifies and optimizes stylesheets
   - Generates source maps

3. **Public Assets** (`npm run build:public`)
   - Creates the `dist/` directory
   - Copies all files from `public/` to `dist/`
   - Copies frontend build output to `dist/`

### Directory Structure

```
project-root/
├── api/                    # Serverless functions
│   ├── hardrock.js
│   └── test.js
├── frontend/               # React application
│   ├── src/
│   ├── dist/              # Vite build output
│   └── package.json
├── public/                # Static assets
├── dist/                  # Final build output (Vercel serves from here)
├── package.json           # Main build scripts
└── vercel.json           # Vercel configuration
```

### Key Configuration Settings

- **Build Command**: `npm run build` - Runs the complete build pipeline
- **Output Directory**: `dist` - Where Vercel serves static files from
- **Install Command**: `npm install` - Installs root dependencies
- **Node Version**: 18.x - Specified for consistency
- **Framework**: null - Treated as static site with serverless functions

### Security Headers

The configuration includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Caching Strategy

Static assets (JS, CSS, images) are cached for 1 year with immutable flag for optimal performance.

### API Functions

Two serverless functions are configured:
- `api/hardrock.js` - Hard Rock betting integration
- `api/test.js` - API testing endpoint

Both run on Node.js 18.x runtime.

### Routing

- All non-API routes are served as static files
- Clean URLs are enabled (no .html extensions)
- Trailing slashes are disabled

## Troubleshooting

### Common Issues

1. **Build Fails with "client directory not found"**
   - This was the original issue - the build script was trying to `cd client`
   - Fixed by using the correct directory structure without client references

2. **Frontend Build Fails**
   - Ensure `frontend/package.json` exists
   - Verify Vite and TypeScript are properly configured
   - Check that all frontend dependencies are installed

3. **Missing Static Assets**
   - Verify `public/` directory contains all required files
   - Ensure `dist/` directory is created during build
   - Check that copy commands in build scripts work correctly

### Verification

Run the verification script to check configuration:

```bash
node verify-vercel-config.js
```

This script validates:
- vercel.json syntax and structure
- Required directories exist
- Build scripts are properly configured
- No problematic directory references