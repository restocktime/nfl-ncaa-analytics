#!/bin/bash

# Build and push Docker images for all services
set -e

REGISTRY=${REGISTRY:-"ghcr.io/your-org/football-analytics"}
VERSION=${VERSION:-"latest"}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Services to build
services=(
    "api-gateway"
    "websocket-service"
    "data-ingestion-service"
    "probability-engine"
    "monte-carlo-service"
    "ml-model-service"
    "historical-stats-service"
)

log_info "Building and pushing Docker images..."
log_info "Registry: $REGISTRY"
log_info "Version: $VERSION"

for service in "${services[@]}"; do
    log_step "Building $service..."
    
    # Build the image
    docker build -f docker/Dockerfile.$service -t $REGISTRY/$service:$VERSION .
    
    # Push the image
    docker push $REGISTRY/$service:$VERSION
    
    log_info "✓ $service built and pushed"
done

log_info "🎉 All images built and pushed successfully!"