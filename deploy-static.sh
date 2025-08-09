#!/bin/bash

# Quick Static Site Deployment Prep Script
echo "🏈 Preparing NFL Analytics Pro for static deployment..."

# Create deployment directory
mkdir -p deploy-ready
cp -r public/* deploy-ready/

# Copy redirect files for different platforms
cp _redirects deploy-ready/
cp netlify.toml deploy-ready/

# Create a simple index file for root if needed
if [ ! -f "deploy-ready/index.html" ]; then
    echo "Error: index.html not found in public directory"
    exit 1
fi

echo "✅ Deployment files ready in 'deploy-ready' folder"
echo ""
echo "🚀 Quick Deploy Options:"
echo "1. Netlify: Drag 'deploy-ready' folder to netlify.com"
echo "2. Vercel: Import this repo to vercel.com" 
echo "3. GitHub Pages: Push to GitHub, enable Pages in repo settings"
echo ""
echo "🌐 Your NFL Analytics Pro app is ready to go live!"