#!/bin/bash

echo "🚀 Starting NFL Live Games System..."

# Kill any existing servers
echo "🧹 Cleaning up existing servers..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start database server (runs in background)
echo "🗄️  Starting NFL Database Server on port 3001..."
cd /Users/iby/Desktop/nfl:ncaa
node public/nfl-database-server.js > nfl-db-server.log 2>&1 &
DB_PID=$!
echo "   Database server started (PID: $DB_PID)"
sleep 2

# Start web server
echo "🌐 Starting Web Server on port 8080..."
echo ""
echo "✅ Servers are starting!"
echo "📍 Open: http://localhost:8080/nfl-live-games.html"
echo "📍 Database API: http://localhost:3001/api/nfl/teams"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start web server in foreground
python3 -m http.server 8080 --directory public
