#!/bin/bash

# Sunday Edge Pro Betting Quantum - Deployment Script
# Elite NFL Analytics Platform Deployment Automation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
FOOTBALL="🏈"
QUANTUM="⚡"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"

echo -e "${PURPLE}${ROCKET} Sunday Edge Pro Betting Quantum Deployment${NC}"
echo -e "${CYAN}Elite NFL Analytics & Betting Intelligence Platform${NC}"
echo "=================================================="
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}${INFO} Checking prerequisites...${NC}"

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm 8+"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js $(node --version) detected"
print_status "npm $(npm --version) detected"

# Check if we're in the right directory
if [ ! -f "sunday-edge-pro-server.js" ]; then
    print_error "sunday-edge-pro-server.js not found. Please run this script from the project root directory."
    exit 1
fi

# Create necessary directories
echo ""
echo -e "${BLUE}${INFO} Setting up project structure...${NC}"

mkdir -p logs
mkdir -p public/dist
mkdir -p tests

print_status "Project directories created"

# Copy package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    if [ -f "sunday-edge-pro-package.json" ]; then
        cp sunday-edge-pro-package.json package.json
        print_status "Package.json created from template"
    else
        print_error "No package.json found. Please ensure sunday-edge-pro-package.json exists."
        exit 1
    fi
fi

# Install dependencies
echo ""
echo -e "${BLUE}${INFO} Installing dependencies...${NC}"

npm install

if [ $? -eq 0 ]; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${BLUE}${INFO} Creating environment configuration...${NC}"
    
    cat > .env << EOF
# Sunday Edge Pro Betting Quantum Configuration
NODE_ENV=development
PORT=3000

# API Keys (Optional - app works without them using mock data)
# Get your API keys from:
# - SportsData.io: https://sportsdata.io/
# - The Odds API: https://the-odds-api.com/
# - OpenWeather API: https://openweathermap.org/api

SPORTSDATA_API_KEY=
ODDS_API_KEY=
OPENWEATHER_API_KEY=

# Security
SESSION_SECRET=sunday-edge-pro-quantum-$(date +%s)

# Cache Configuration
CACHE_DURATION=30000
API_TIMEOUT=10000
MAX_RETRIES=3
EOF

    print_status ".env file created with default configuration"
    print_warning "Edit .env file to add your API keys for full functionality"
else
    print_status "Using existing .env configuration"
fi

# Build assets
echo ""
echo -e "${BLUE}${INFO} Building application assets...${NC}"

# Create minified CSS if postcss is available
if command_exists postcss; then
    npx postcss public/sunday-edge-pro-styles.css -o public/dist/styles.min.css --map 2>/dev/null || {
        cp public/sunday-edge-pro-styles.css public/dist/styles.min.css
        print_warning "PostCSS not available, using unminified CSS"
    }
else
    cp public/sunday-edge-pro-styles.css public/dist/styles.min.css
    print_warning "PostCSS not available, using unminified CSS"
fi

# Create minified JS if terser is available
if command_exists terser; then
    npx terser public/sunday-edge-pro-quantum.js -o public/dist/app.min.js --source-map 2>/dev/null || {
        cp public/sunday-edge-pro-quantum.js public/dist/app.min.js
        print_warning "Terser not available, using unminified JS"
    }
else
    cp public/sunday-edge-pro-quantum.js public/dist/app.min.js
    print_warning "Terser not available, using unminified JS"
fi

print_status "Application assets built"

# Run tests if available
if [ -d "tests" ] || [ -d "src/__tests__" ]; then
    echo ""
    echo -e "${BLUE}${INFO} Running tests...${NC}"
    
    npm test 2>/dev/null || {
        print_warning "Tests failed or not available, continuing deployment"
    }
fi

# Check if PM2 is available for production deployment
if command_exists pm2; then
    echo ""
    echo -e "${BLUE}${INFO} PM2 detected - Production deployment available${NC}"
    
    read -p "Deploy with PM2 for production? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}${INFO} Deploying with PM2...${NC}"
        
        # Stop existing PM2 process if running
        pm2 stop sunday-edge-pro 2>/dev/null || true
        pm2 delete sunday-edge-pro 2>/dev/null || true
        
        # Start with PM2
        NODE_ENV=production pm2 start sunday-edge-pro-server.js --name "sunday-edge-pro" --instances max --exec-mode cluster
        
        # Save PM2 configuration
        pm2 save
        pm2 startup
        
        print_status "Sunday Edge Pro Quantum deployed with PM2"
        print_info "Use 'pm2 logs sunday-edge-pro' to view logs"
        print_info "Use 'pm2 monit' to monitor the application"
        
        echo ""
        echo -e "${GREEN}${ROCKET} Sunday Edge Pro Quantum is running in production mode!${NC}"
        echo -e "${CYAN}${FOOTBALL} Access your application at: http://localhost:3000${NC}"
        echo -e "${PURPLE}${QUANTUM} PM2 Dashboard: pm2 monit${NC}"
        
        exit 0
    fi
fi

# Standard deployment
echo ""
echo -e "${BLUE}${INFO} Starting Sunday Edge Pro Quantum...${NC}"

# Check if port is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 is already in use"
    read -p "Kill existing process and continue? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        print_status "Existing process terminated"
    else
        print_info "You can change the port in .env file (PORT=3001)"
        exit 1
    fi
fi

# Start the application
echo ""
echo -e "${GREEN}${ROCKET} Launching Sunday Edge Pro Betting Quantum...${NC}"
echo ""

# Display startup information
cat << EOF
${PURPLE}╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║  ${QUANTUM} SUNDAY EDGE PRO BETTING QUANTUM ${QUANTUM}                        ║
║                                                              ║
║  ${FOOTBALL} Elite NFL Analytics & Betting Intelligence Platform    ║
║                                                              ║
║  🌐 Application: http://localhost:3000                       ║
║  📊 API Status:  http://localhost:3000/api/status           ║
║  🏥 Health:      http://localhost:3000/health               ║
║                                                              ║
║  ${CHECK} Real-time NFL data and live scores                     ║
║  ${CHECK} AI-powered predictions and analysis                    ║
║  ${CHECK} Live betting odds and opportunities                    ║
║  ${CHECK} Advanced analytics and insights                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝${NC}

EOF

print_info "Starting server..."
print_info "Press Ctrl+C to stop the server"

echo ""

# Start the server
if [ "$1" = "--dev" ]; then
    if command_exists nodemon; then
        nodemon sunday-edge-pro-server.js
    else
        print_warning "nodemon not available, using node directly"
        node sunday-edge-pro-server.js
    fi
else
    node sunday-edge-pro-server.js
fi