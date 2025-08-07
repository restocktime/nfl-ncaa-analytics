#!/bin/bash

# Football Analytics System Kubernetes Scaling Script
# This script provides scaling capabilities for the football analytics system

set -e

# Configuration
NAMESPACE="football-analytics"
KUBECTL_TIMEOUT="300s"

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

# Scale deployment
scale_deployment() {
    local deployment=$1
    local replicas=$2
    
    log_info "Scaling $deployment to $replicas replicas..."
    
    kubectl scale deployment/$deployment --replicas=$replicas -n $NAMESPACE
    
    # Wait for scaling to complete
    log_info "Waiting for scaling to complete..."
    kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    
    log_info "Scaling completed for $deployment"
}

# Show current scaling status
show_scaling_status() {
    log_info "Current scaling status:"
    echo
    
    # Show deployments with replica counts
    kubectl get deployments -n $NAMESPACE -o custom-columns="NAME:.metadata.name,READY:.status.readyReplicas,UP-TO-DATE:.status.updatedReplicas,AVAILABLE:.status.availableReplicas,DESIRED:.spec.replicas"
    echo
    
    # Show HPA status
    log_info "Horizontal Pod Autoscaler status:"
    kubectl get hpa -n $NAMESPACE 2>/dev/null || log_warn "No HPA found"
    echo
    
    # Show resource usage
    log_info "Resource usage by pods:"
    kubectl top pods -n $NAMESPACE 2>/dev/null || log_warn "Metrics server not available"
}

# Scale for game day traffic
scale_for_game_day() {
    log_info "Scaling system for game day traffic..."
    
    # Scale critical services for high load
    scale_deployment "api-gateway" 6
    scale_deployment "websocket-service" 5
    scale_deployment "probability-engine" 8
    scale_deployment "monte-carlo-service" 15
    scale_deployment "data-ingestion-service" 4
    scale_deployment "ml-model-service" 5
    scale_deployment "historical-stats-service" 3
    
    log_info "Game day scaling completed"
}

# Scale for normal traffic
scale_for_normal() {
    log_info "Scaling system for normal traffic..."
    
    # Scale back to normal levels
    scale_deployment "api-gateway" 3
    scale_deployment "websocket-service" 2
    scale_deployment "probability-engine" 3
    scale_deployment "monte-carlo-service" 2
    scale_deployment "data-ingestion-service" 2
    scale_deployment "ml-model-service" 2
    scale_deployment "historical-stats-service" 2
    
    log_info "Normal scaling completed"
}

# Scale for maintenance mode
scale_for_maintenance() {
    log_info "Scaling system for maintenance mode..."
    
    # Scale down to minimum for maintenance
    scale_deployment "api-gateway" 1
    scale_deployment "websocket-service" 1
    scale_deployment "probability-engine" 1
    scale_deployment "monte-carlo-service" 1
    scale_deployment "data-ingestion-service" 1
    scale_deployment "ml-model-service" 1
    scale_deployment "historical-stats-service" 1
    
    log_info "Maintenance mode scaling completed"
}

# Configure HPA
configure_hpa() {
    local deployment=$1
    local min_replicas=$2
    local max_replicas=$3
    local cpu_threshold=${4:-70}
    local memory_threshold=${5:-80}
    
    log_info "Configuring HPA for $deployment (min: $min_replicas, max: $max_replicas)"
    
    # Create HPA configuration
    cat <<EOF | kubectl apply -f -
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${deployment}-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: $deployment
  minReplicas: $min_replicas
  maxReplicas: $max_replicas
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: $cpu_threshold
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: $memory_threshold
EOF
    
    log_info "HPA configured for $deployment"
}

# Configure all HPAs
configure_all_hpa() {
    log_info "Configuring HPA for all services..."
    
    configure_hpa "api-gateway" 3 10 70 80
    configure_hpa "websocket-service" 2 8 70 80
    configure_hpa "probability-engine" 3 12 70 80
    configure_hpa "monte-carlo-service" 2 20 80 85
    configure_hpa "data-ingestion-service" 2 6 70 80
    configure_hpa "ml-model-service" 2 8 70 80
    configure_hpa "historical-stats-service" 2 6 70 80
    
    log_info "All HPAs configured"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  status                           Show current scaling status"
    echo "  scale <deployment> <replicas>    Scale specific deployment"
    echo "  game-day                         Scale for game day traffic"
    echo "  normal                           Scale for normal traffic"
    echo "  maintenance                      Scale for maintenance mode"
    echo "  configure-hpa                    Configure HPA for all services"
    echo "  configure-hpa <deployment> <min> <max> [cpu] [memory]  Configure HPA for specific deployment"
    echo
    echo "Examples:"
    echo "  $0 status"
    echo "  $0 scale api-gateway 5"
    echo "  $0 game-day"
    echo "  $0 normal"
    echo "  $0 maintenance"
    echo "  $0 configure-hpa"
    echo "  $0 configure-hpa api-gateway 3 10 70 80"
}

# Main function
main() {
    local command=$1
    local arg1=$2
    local arg2=$3
    local arg3=$4
    local arg4=$5
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    case $command in
        "status")
            show_scaling_status
            ;;
        "scale")
            if [ -z "$arg1" ] || [ -z "$arg2" ]; then
                log_error "Deployment name and replica count required"
                show_usage
                exit 1
            fi
            scale_deployment $arg1 $arg2
            ;;
        "game-day")
            scale_for_game_day
            ;;
        "normal")
            scale_for_normal
            ;;
        "maintenance")
            scale_for_maintenance
            ;;
        "configure-hpa")
            if [ -n "$arg1" ]; then
                if [ -z "$arg2" ] || [ -z "$arg3" ]; then
                    log_error "Min and max replicas required for specific HPA configuration"
                    show_usage
                    exit 1
                fi
                configure_hpa $arg1 $arg2 $arg3 $arg4 $arg5
            else
                configure_all_hpa
            fi
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'log_error "Operation interrupted"; exit 1' INT TERM

# Run main function
main "$@"