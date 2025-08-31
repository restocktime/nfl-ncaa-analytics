# Deployment Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting information for Vercel deployments, focusing on the corrected build process and common deployment issues. It includes setup instructions for new developers and solutions to frequently encountered problems.

## Corrected Build Process

### Project Structure Analysis

The project follows a single-directory structure with the following key components:

```
project-root/
├── package.json          # Main package.json with build scripts
├── vercel.json           # Vercel deployment configuration
├── public/               # Static assets and HTML files
├── src/                  # Source code (TypeScript/JavaScript)
├── frontend/             # React frontend (if applicable)
└── server/               # Backend API services
```

### Build Configuration

#### Package.json Build Scripts

The corrected build scripts in `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "tsc && npm run copy-assets",
    "build:frontend": "cd frontend && npm install && npm run build",
    "copy-assets": "cp -r public/* dist/",
    "start": "node dist/index.js",
    "dev": "npm run dev:backend",
    "dev:backend": "ts-node src/dev-server.ts"
  }
}
```

#### Vercel Configuration

The `vercel.json` configuration:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

## Common Deployment Issues and Solutions

### 1. Directory Navigation Errors

**Problem**: Build fails with "No such file or directory" when trying to `cd` into non-existent directories.

**Error Message**:
```
Error: ENOENT: no such file or directory, chdir 'client'
```

**Solution**:
- Remove references to non-existent directories in build scripts
- Update build commands to match actual project structure
- Use conditional directory changes: `[ -d client ] && cd client || echo "No client directory"`

### 2. Missing Dependencies

**Problem**: Build fails due to missing node_modules or package.json files.

**Error Message**:
```
Error: Cannot find module 'package.json'
npm ERR! missing script: build
```

**Solution**:
- Ensure package.json exists in the correct location
- Run `npm install` in the correct directory
- Check that all required dependencies are listed in package.json

### 3. Build Output Directory Issues

**Problem**: Vercel cannot find the built application files.

**Error Message**:
```
Error: No output directory found
```

**Solution**:
- Verify the `outputDirectory` in vercel.json matches the actual build output
- Ensure build scripts create files in the expected location
- Check that static assets are copied to the output directory

### 4. Environment Variable Issues

**Problem**: Application fails to load due to missing environment variables.

**Solution**:
- Set environment variables in Vercel dashboard
- Use `.env.example` as a template for required variables
- Ensure environment variables are properly referenced in code

### 5. API Route Configuration

**Problem**: API endpoints return 404 errors after deployment.

**Solution**:
- Verify API routes are configured in vercel.json
- Ensure API files are in the correct directory structure
- Check that serverless functions are properly exported

## Setup Instructions for New Developers

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Vercel CLI (optional but recommended)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your local configuration
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Test the build process locally**:
   ```bash
   npm run build
   node test-build-locally.js
   ```

### Vercel Deployment Setup

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link project to Vercel**:
   ```bash
   vercel link
   ```

4. **Deploy to preview**:
   ```bash
   vercel
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Troubleshooting Checklist

### Before Deployment

- [ ] Run `npm run build` locally without errors
- [ ] Verify all required files exist in the output directory
- [ ] Check that package.json scripts match project structure
- [ ] Ensure vercel.json configuration is correct
- [ ] Test environment variables are set properly

### During Deployment

- [ ] Monitor Vercel build logs for errors
- [ ] Check that all dependencies install successfully
- [ ] Verify build commands execute in correct directories
- [ ] Ensure output directory contains expected files

### After Deployment

- [ ] Test deployed application loads correctly
- [ ] Verify API endpoints respond properly
- [ ] Check browser console for JavaScript errors
- [ ] Test critical application functionality

## Debugging Commands

### Local Build Testing

```bash
# Test build process
npm run build

# Validate project structure
node validate-project-structure.js

# Test build output
node test-build-locally.js
```

### Vercel CLI Debugging

```bash
# View deployment logs
vercel logs <deployment-url>

# Check project configuration
vercel inspect

# Test functions locally
vercel dev
```

## Common Error Messages and Solutions

### "Cannot resolve module"

**Cause**: Missing dependencies or incorrect import paths
**Solution**: 
- Run `npm install` to ensure all dependencies are installed
- Check import paths are correct and files exist
- Verify TypeScript configuration if using TypeScript

### "Build command failed"

**Cause**: Build script errors or missing build tools
**Solution**:
- Check build script syntax in package.json
- Ensure all build tools are installed as dependencies
- Review build logs for specific error details

### "Function timeout"

**Cause**: Serverless function exceeds execution time limit
**Solution**:
- Optimize function performance
- Consider breaking large operations into smaller chunks
- Use appropriate Vercel plan for longer execution times

## Getting Help

### Internal Resources

- Check existing documentation in `/docs` directory
- Review project README.md for specific setup instructions
- Consult team members familiar with the deployment process

### External Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Deployment Guide](https://vercel.com/guides/deploying-nodejs)
- [Vercel Community Forum](https://github.com/vercel/vercel/discussions)

### Escalation Process

1. Check this troubleshooting guide
2. Search existing issues in project repository
3. Consult with senior developers
4. Create detailed issue report with:
   - Error messages
   - Build logs
   - Steps to reproduce
   - Environment details

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and update environment variables
- Monitor deployment performance
- Update documentation as project evolves

### Version Updates

- Test Node.js version updates in development first
- Update Vercel runtime configuration as needed
- Ensure all team members use compatible Node.js versions

---

*Last updated: [Current Date]*
*For questions or updates to this guide, contact the development team.*