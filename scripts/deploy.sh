#!/bin/bash

# Football Analytics System Kubernetes Deployment Script
# This script deploys the entire football analytics system to Kubernetes

set -e

# Configuration
NAMESPACE="football-analytics"
KUBECTL_TIMEOUT="300s"
ROLLBACK_ENABLED=true
DEPLOYMENT_VERSION=${1:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Create namespace if it doesn't exist
create_namespace() {
    log_info "Creating namespace: $NAMESPACE"
    kubectl apply -f k8s/namespace.yaml
    kubectl wait --for=condition=Ready namespace/$NAMESPACE --timeout=$KUBECTL_TIMEOUT
}

# Deploy configuration and secrets
deploy_config() {
    log_info "Deploying configuration and secrets..."
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
}

# Deploy databases and infrastructure services
deploy_infrastructure() {
    log_info "Deploying infrastructure services..."
    
    # Deploy databases
    kubectl apply -f k8s/services/redis-service.yaml
    kubectl apply -f k8s/services/postgres-service.yaml
    kubectl apply -f k8s/services/influxdb-service.yaml
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=available deployment/redis -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/postgres -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/influxdb -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    
    # Deploy monitoring
    kubectl apply -f k8s/monitoring/prometheus.yaml
    kubectl wait --for=condition=available deployment/prometheus -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
}

# Deploy application services
deploy_services() {
    log_info "Deploying application services..."
    
    # Deploy core services
    kubectl apply -f k8s/services/data-ingestion-service.yaml
    kubectl apply -f k8s/services/probability-engine.yaml
    kubectl apply -f k8s/services/monte-carlo-service.yaml
    kubectl apply -f k8s/services/ml-model-service.yaml
    kubectl apply -f k8s/services/historical-stats-service.yaml
    
    # Deploy API services
    kubectl apply -f k8s/services/api-gateway.yaml
    kubectl apply -f k8s/services/websocket-service.yaml
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    kubectl wait --for=condition=available deployment/data-ingestion-service -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/probability-engine -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/monte-carlo-service -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/ml-model-service -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/historical-stats-service -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/api-gateway -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    kubectl wait --for=condition=available deployment/websocket-service -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
}

# Deploy ingress and load balancer
deploy_ingress() {
    log_info "Deploying ingress and load balancer..."
    kubectl apply -f k8s/ingress.yaml
    
    # Wait for ingress to get an external IP
    log_info "Waiting for load balancer to get external IP..."
    timeout=300
    while [ $timeout -gt 0 ]; do
        external_ip=$(kubectl get service nginx-ingress-controller -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        if [ -n "$external_ip" ] && [ "$external_ip" != "null" ]; then
            log_info "Load balancer external IP: $external_ip"
            break
        fi
        sleep 10
        timeout=$((timeout - 10))
    done
    
    if [ $timeout -le 0 ]; then
        log_warn "Timeout waiting for external IP, but deployment continues..."
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check all pods are running
    log_info "Checking pod status..."
    kubectl get pods -n $NAMESPACE
    
    # Check services
    log_info "Checking service status..."
    kubectl get services -n $NAMESPACE
    
    # Check ingress
    log_info "Checking ingress status..."
    kubectl get ingress -n $NAMESPACE
    
    # Run health checks
    log_info "Running health checks..."
    
    # Wait for all deployments to be ready
    deployments=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
    for deployment in $deployments; do
        if ! kubectl wait --for=condition=available deployment/$deployment -n $NAMESPACE --timeout=60s; then
            log_error "Deployment $deployment is not ready"
            return 1
        fi
    done
    
    log_info "All deployments are ready"
    return 0
}

# Rollback function
rollback_deployment() {
    log_warn "Rolling back deployment..."
    
    # Get previous revision
    deployments=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
    for deployment in $deployments; do
        log_info "Rolling back $deployment..."
        kubectl rollout undo deployment/$deployment -n $NAMESPACE
    done
    
    # Wait for rollback to complete
    for deployment in $deployments; do
        kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    done
    
    log_info "Rollback completed"
}

# Main deployment function
main() {
    log_info "Starting Football Analytics System deployment (version: $DEPLOYMENT_VERSION)"
    
    # Store current state for potential rollback
    if [ "$ROLLBACK_ENABLED" = true ]; then
        log_info "Storing current state for potential rollback..."
        kubectl get deployments -n $NAMESPACE -o yaml > /tmp/football-analytics-backup-$(date +%Y%m%d-%H%M%S).yaml 2>/dev/null || true
    fi
    
    # Execute deployment steps
    check_prerequisites
    create_namespace
    deploy_config
    deploy_infrastructure
    deploy_services
    deploy_ingress
    
    # Verify deployment
    if verify_deployment; then
        log_info "Deployment completed successfully!"
        log_info "System is ready to serve traffic"
        
        # Display access information
        external_ip=$(kubectl get service nginx-ingress-controller -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
        log_info "API Gateway: https://api.football-analytics.com (External IP: $external_ip)"
        log_info "WebSocket: wss://ws.football-analytics.com (External IP: $external_ip)"
        log_info "Prometheus: http://$external_ip:9090 (if exposed)"
        
    else
        log_error "Deployment verification failed"
        
        if [ "$ROLLBACK_ENABLED" = true ]; then
            read -p "Do you want to rollback? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback_deployment
            fi
        fi
        
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"