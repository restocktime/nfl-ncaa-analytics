#!/bin/bash

echo "🚀 Opening Football Analytics Dashboard..."
echo ""
echo "🌐 Dashboard URL: http://localhost:3000"
echo "📊 API Endpoints: http://localhost:3000/api-docs"
echo "🔌 WebSocket: ws://localhost:8082"
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
echo "🎉 Enjoy your Football Analytics System!"