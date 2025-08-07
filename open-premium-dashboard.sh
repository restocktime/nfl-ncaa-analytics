#!/bin/bash

echo "🚀 Opening Football Analytics Pro - Premium Dashboard..."
echo ""
echo "✨ PREMIUM FEATURES:"
echo "  🔐 User Authentication & Profiles"
echo "  ⚖️  Advanced Team & Player Comparison"
echo "  📊 Real-time Charts & Analytics"
echo "  🎨 High-end Design & Animations"
echo "  🔔 Smart Notifications System"
echo "  📱 Responsive Premium UI"
echo ""
echo "🌐 Dashboard URL: http://localhost:3000"
echo "📊 API Status: http://localhost:3000/api/v1/system/status"
echo "🔌 WebSocket: ws://localhost:8082"
echo ""
echo "🔑 AUTHENTICATION OPTIONS:"
echo "  📧 Create Account: Click 'Create account' and register"
echo "  🔐 Login: Use any registered email/password"
echo "  🌐 Google OAuth: Click 'Sign in with Google' (REAL Google OAuth!)"
echo "  📝 Demo Login: demo@footballanalytics.com / password123"
echo ""

# Try to open in default browser
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:3000
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo ""
echo "🎉 Welcome to Football Analytics Pro!"
echo "💎 Experience premium sports intelligence at its finest!"