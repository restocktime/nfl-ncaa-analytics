#!/bin/bash

# NFL Analytics Pro Server Startup Script
echo "🏈 Starting NFL Analytics Pro Server..."

# Stop any existing servers
pkill -f "node nfl-server.js" 2>/dev/null

# Start the server
node nfl-server.js

echo "🏈 Server startup complete!"