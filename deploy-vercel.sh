#!/bin/bash

echo "🚀 Sunday Edge Pro - Vercel Deployment"
echo "====================================="

# Check if Vercel CLI is installed, try to install it
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npx vercel@latest --version > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Vercel CLI ready"
    else
        echo "❌ Could not install Vercel CLI"
        echo "Please install manually: npm install -g vercel"
        exit 1
    fi
fi

echo "🔧 Setting up Vercel deployment..."

# Navigate to server directory
cd server

# Deploy using npx (no global install needed)
echo "🚀 Deploying to Vercel..."
echo "You'll be asked to:"
echo "1. Login to Vercel (if not already)"
echo "2. Confirm project name"
echo "3. Select deployment settings"
echo ""

npx vercel --prod

echo ""
echo "✅ Deployment should be complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the Vercel URL from the output above"
echo "2. Run the update script to configure your frontend"
echo "3. Upload your updated frontend to sundayedgepro.com"
echo ""
echo "🔗 Your Vercel dashboard: https://vercel.com/dashboard"