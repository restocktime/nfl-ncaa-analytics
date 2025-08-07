#!/bin/bash

# Update Kubernetes configuration with actual values
set -e

REGISTRY=${REGISTRY:-"ghcr.io/your-org/football-analytics"}
VERSION=${VERSION:-"latest"}
DOMAIN=${DOMAIN:-"football-analytics.com"}

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

log_info "Updating Kubernetes configuration..."
log_info "Registry: $REGISTRY"
log_info "Version: $VERSION"
log_info "Domain: $DOMAIN"

# Update image references in service manifests
log_step "Updating image references..."
find k8s/services -name "*.yaml" -exec sed -i.bak "s|football-analytics/|$REGISTRY/|g" {} \;
find k8s/services -name "*.yaml" -exec sed -i.bak "s|:latest|:$VERSION|g" {} \;

# Update domain references in ingress
log_step "Updating domain references..."
sed -i.bak "s|football-analytics.com|$DOMAIN|g" k8s/ingress.yaml

# Clean up backup files
find k8s -name "*.bak" -delete

log_info "✓ Configuration updated successfully!"
log_info "Next steps:"
echo "  1. Update secrets in k8s/secrets.yaml with actual values"
echo "  2. Review and customize k8s/configmap.yaml"
echo "  3. Run: ./scripts/deploy.sh"