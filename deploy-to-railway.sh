#!/bin/bash

echo "🚀 Deploying Sunday Edge Pro to Railway..."
echo "================================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Run this script from the project root."
    exit 1
fi

echo "🔍 Checking project structure..."

# Check critical files
REQUIRED_FILES=("server.js" "package.json" "railway.toml" "public/index.html")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
    echo "✅ Found: $file"
done

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🧪 Testing server locally..."
# Start server in background for testing
node server.js > test-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "Testing health endpoint..."
if curl -s -f "http://localhost:3000/api/health" > /dev/null; then
    echo "✅ Health endpoint working"
else
    echo "❌ Health endpoint failed"
    kill $SERVER_PID
    exit 1
fi

# Test NFL API
echo "Testing NFL API..."
NFL_COUNT=$(curl -s "http://localhost:3000/api/games?sport=nfl" | jq -r '.count' 2>/dev/null || echo "0")
if [ "$NFL_COUNT" -gt 0 ]; then
    echo "✅ NFL API working ($NFL_COUNT games)"
else
    echo "⚠️ NFL API returned no games (might be off-season)"
fi

# Test NCAA API
echo "Testing NCAA API..."
NCAA_COUNT=$(curl -s "http://localhost:3000/api/ncaa/games" | jq -r '.count' 2>/dev/null || echo "0")
if [ "$NCAA_COUNT" -gt 0 ]; then
    echo "✅ NCAA API working ($NCAA_COUNT games)"
else
    echo "⚠️ NCAA API returned no games"
fi

# Stop test server
kill $SERVER_PID
rm -f test-server.log

echo ""
echo "🔑 Checking environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    # Don't show contents for security
else
    echo "⚠️ No .env file found - using defaults"
fi

echo ""
echo "🎯 Railway Configuration:"
echo "   Build command: npm install"
echo "   Start command: node server.js"  
echo "   Health check: /api/health"
echo "   Port: 3000"

echo ""
echo "🚀 Deploying to Railway..."
echo "   If this is your first deployment, you may need to:"
echo "   1. Run 'railway login'"
echo "   2. Run 'railway link' to connect to your project"

# Deploy to Railway
if railway deploy; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "   1. Check Railway dashboard for deployment status"
    echo "   2. Test your live site URL"
    echo "   3. Verify API endpoints are working"
    echo "   4. Check logs for any errors"
    echo ""
    echo "🔧 If you encounter issues:"
    echo "   - Check Railway logs: railway logs"
    echo "   - Verify environment variables in Railway dashboard"
    echo "   - Ensure all API endpoints return data"
    echo ""
    echo "📱 Your site should now be live!"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "   Check Railway logs for details: railway logs"
    echo "   Common issues:"
    echo "   - Missing environment variables"
    echo "   - Node.js version compatibility"
    echo "   - Port configuration"
    exit 1
fi

echo ""
echo "================================================"
echo "🏈 Sunday Edge Pro deployment complete!"
echo "================================================"