# Deployment Quick Reference

## Essential Commands

### Local Development
```bash
# Start development server
npm run dev

# Build project locally
npm run build

# Test build output
node test-build-locally.js

# Validate project structure
node validate-project-structure.js
```

### Vercel Deployment
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check project status
vercel ls
```

## Quick Fixes

### Build Fails - Directory Not Found
```bash
# Check if directory exists before changing
[ -d client ] && cd client || echo "Directory not found"
```

### Missing Dependencies
```bash
# Install all dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables
```bash
# Copy example environment file
cp .env.example .env.development

# Set Vercel environment variables
vercel env add VARIABLE_NAME
```

## Emergency Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

## Support Contacts
- Development Team: [team-contact]
- Vercel Support: [vercel-support]
- Documentation: See DEPLOYMENT_TROUBLESHOOTING.md