#!/bin/bash

echo "🚀 Sunday Edge Pro - Railway Manual Deployment"
echo "============================================="
echo ""
echo "Since Railway CLI needs permissions, let's do this manually:"
echo ""
echo "📋 Manual Railway Deployment Steps:"
echo "1. Go to https://railway.app and sign up/login"
echo "2. Click 'New Project' → 'Deploy from GitHub repo' OR 'Empty Project'"
echo "3. If using GitHub: Connect your repo and select the 'server' folder"
echo "4. If using empty project: We'll guide you through file upload"
echo ""
echo "🔑 Environment Variables to set in Railway:"
echo "   ODDS_API_KEY = 22e59e4eccd8562ad4b697aeeaccb0fb"
echo "   NODE_ENV = production"
echo "   PORT = 3001"
echo ""
echo "📁 Files to upload (if not using GitHub):"
echo "   - server/package.json"
echo "   - server/api-service.js"
echo "   - server/.env (optional)"
echo ""

# Create a deployment package
echo "📦 Creating deployment package..."
cd server
tar -czf ../sunday-edge-pro-api.tar.gz package.json api-service.js .env 2>/dev/null || tar -czf ../sunday-edge-pro-api.tar.gz package.json api-service.js
cd ..

echo "✅ Deployment package created: sunday-edge-pro-api.tar.gz"
echo ""
echo "🚀 Next Steps:"
echo "1. Open https://railway.app in your browser"
echo "2. Create new project"
echo "3. Upload the files or connect GitHub"
echo "4. Set the environment variables listed above"
echo "5. Railway will give you a URL like: https://yourapp.up.railway.app"
echo "6. Come back here and we'll update your frontend"
echo ""
echo "💡 Alternative: Try Vercel deployment (easier)"
read -p "Would you like to try Vercel instead? (y/n): " use_vercel

if [[ $use_vercel =~ ^[Yy]$ ]]; then
    echo "🔄 Switching to Vercel deployment..."
    ./deploy-vercel.sh
fi