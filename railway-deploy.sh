#!/bin/bash

echo "🚀 Sunday Edge Pro - Railway Deployment Setup"
echo "============================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔧 Setting up Railway deployment..."

# Navigate to server directory
cd server

# Initialize Railway project
echo "🚂 Initializing Railway project..."
railway login
railway init --name "sunday-edge-pro-api"

# Set environment variables
echo "🔑 Setting environment variables..."
railway variables set ODDS_API_KEY=22e59e4eccd8562ad4b697aeeaccb0fb
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the Railway URL shown above"
echo "2. Update your frontend API client with this URL"
echo "3. Test your deployed backend"
echo ""
echo "🔗 Your Railway dashboard: https://railway.app/dashboard"