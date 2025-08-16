#!/bin/bash

# Sunday Edge Pro - Backend API Service Starter
echo "🚀 Starting Sunday Edge Pro API Service..."

# Navigate to server directory
cd server

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit server/.env file with your API keys"
fi

# Start the API service
echo "🔥 Starting API service on port 3001..."
npm start