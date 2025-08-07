#!/bin/bash

# Football Analytics System - Local Development Startup
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_info "✓ Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        log_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    log_info "✓ Docker Compose is available"
}

# Build TypeScript code
build_code() {
    log_step "Building TypeScript code..."
    if command -v npm &> /dev/null; then
        npm run build
        log_info "✓ TypeScript code built"
    else
        log_warn "npm not found, skipping TypeScript build"
    fi
}

# Start services
start_services() {
    log_step "Starting Football Analytics System..."
    
    # Use docker compose if available, otherwise docker-compose
    if docker compose version &> /dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    $COMPOSE_CMD -f docker-compose.dev.yml up -d
    
    log_info "✓ Services started"
}

# Wait for services to be ready
wait_for_services() {
    log_step "Waiting for services to be ready..."
    
    # Wait for database
    log_info "Waiting for PostgreSQL..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker exec $(docker ps -q -f name=postgres) pg_isready -U football_user > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_warn "PostgreSQL may not be ready yet, but continuing..."
    else
        log_info "✓ PostgreSQL is ready"
    fi
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    timeout=30
    while [ $timeout -gt 0 ]; do
        if docker exec $(docker ps -q -f name=redis) redis-cli ping > /dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        log_warn "Redis may not be ready yet, but continuing..."
    else
        log_info "✓ Redis is ready"
    fi
    
    # Wait for API Gateway
    log_info "Waiting for API Gateway..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            break
        fi
        sleep 3
        timeout=$((timeout - 3))
    done
    
    if [ $timeout -le 0 ]; then
        log_warn "API Gateway may not be ready yet, but continuing..."
    else
        log_info "✓ API Gateway is ready"
    fi
}

# Show access information
show_access_info() {
    echo ""
    echo "=================================================="
    log_info "🎉 Football Analytics System is running!"
    echo "=================================================="
    echo ""
    echo "🌐 Access URLs:"
    echo "  📊 Frontend Dashboard: http://localhost:5173"
    echo "  🔌 API Gateway:        http://localhost:3000"
    echo "  ⚡ WebSocket Service:   ws://localhost:8080"
    echo ""
    echo "🔍 API Endpoints:"
    echo "  Health Check:     http://localhost:3000/health"
    echo "  API Docs:         http://localhost:3000/api-docs"
    echo "  Games:            http://localhost:3000/api/v1/games"
    echo "  Teams:            http://localhost:3000/api/v1/teams"
    echo "  Predictions:      http://localhost:3000/api/v1/predictions"
    echo ""
    echo "🗄️  Database Access:"
    echo "  PostgreSQL:       localhost:5432 (football_user/dev_password)"
    echo "  Redis:            localhost:6379"
    echo "  InfluxDB:         localhost:8086 (admin/dev_password)"
    echo ""
    echo "📋 Useful Commands:"
    echo "  View logs:        docker-compose -f docker-compose.dev.yml logs -f"
    echo "  Stop services:    docker-compose -f docker-compose.dev.yml down"
    echo "  Restart:          ./start-local.sh"
    echo ""
    log_info "Happy analyzing! 🏈"
}

# Main execution
main() {
    log_info "🚀 Starting Football Analytics System locally..."
    
    check_docker
    check_docker_compose
    build_code
    start_services
    wait_for_services
    show_access_info
}

# Handle interruption
trap 'log_error "Startup interrupted"; exit 1' INT TERM

# Run main function
main "$@"