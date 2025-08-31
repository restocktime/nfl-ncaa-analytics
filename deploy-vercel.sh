#!/bin/bash

# Vercel Deployment Script
# This script deploys the corrected build configuration to Vercel

set -e

echo "🚀 Starting Vercel deployment with corrected configuration..."

# Run pre-deployment validation
echo "📋 Running pre-deployment validation..."
npm run test:build

if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment validation failed. Aborting deployment."
    exit 1
fi

echo "✅ Pre-deployment validation passed"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
./node_modules/.bin/vercel --prod --confirm

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔍 Vercel will provide the deployment URL above"
else
    echo "❌ Deployment failed"
    exit 1
fi

echo "🎉 Deployment process completed!"