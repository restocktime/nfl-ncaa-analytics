#!/bin/bash

# Football Analytics System Kubernetes Rollback Script
# This script provides rollback capabilities for the football analytics system

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

# Show rollout history
show_history() {
    local deployment=$1
    log_info "Rollout history for $deployment:"
    kubectl rollout history deployment/$deployment -n $NAMESPACE
}

# Show all deployment histories
show_all_histories() {
    log_info "Showing rollout history for all deployments..."
    
    deployments=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$deployments" ]; then
        log_warn "No deployments found in namespace $NAMESPACE"
        return 1
    fi
    
    for deployment in $deployments; do
        echo "----------------------------------------"
        show_history $deployment
        echo
    done
}

# Rollback specific deployment
rollback_deployment() {
    local deployment=$1
    local revision=$2
    
    log_info "Rolling back deployment: $deployment"
    
    if [ -n "$revision" ]; then
        log_info "Rolling back to revision: $revision"
        kubectl rollout undo deployment/$deployment --to-revision=$revision -n $NAMESPACE
    else
        log_info "Rolling back to previous revision"
        kubectl rollout undo deployment/$deployment -n $NAMESPACE
    fi
    
    # Wait for rollback to complete
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    
    log_info "Rollback completed for $deployment"
}

# Rollback all deployments
rollback_all_deployments() {
    local revision=$1
    
    log_warn "Rolling back ALL deployments in namespace $NAMESPACE"
    
    deployments=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$deployments" ]; then
        log_error "No deployments found in namespace $NAMESPACE"
        return 1
    fi
    
    # Confirm rollback
    echo "Deployments to rollback: $deployments"
    read -p "Are you sure you want to rollback all deployments? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        return 0
    fi
    
    # Rollback in reverse dependency order (API services first, then core services, then infrastructure)
    rollback_order="api-gateway websocket-service historical-stats-service ml-model-service monte-carlo-service probability-engine data-ingestion-service"
    
    for deployment in $rollback_order; do
        if echo "$deployments" | grep -q "$deployment"; then
            rollback_deployment $deployment $revision
        fi
    done
    
    # Rollback any remaining deployments
    for deployment in $deployments; do
        if ! echo "$rollback_order" | grep -q "$deployment"; then
            rollback_deployment $deployment $revision
        fi
    done
    
    log_info "All deployments rolled back successfully"
}

# Check deployment status
check_status() {
    log_info "Checking deployment status..."
    
    # Check pods
    log_info "Pod status:"
    kubectl get pods -n $NAMESPACE
    echo
    
    # Check deployments
    log_info "Deployment status:"
    kubectl get deployments -n $NAMESPACE
    echo
    
    # Check services
    log_info "Service status:"
    kubectl get services -n $NAMESPACE
    echo
    
    # Check ingress
    log_info "Ingress status:"
    kubectl get ingress -n $NAMESPACE
}

# Restore from backup
restore_from_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_warn "Restoring from backup: $backup_file"
    
    # Confirm restore
    read -p "This will replace current deployments. Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        return 0
    fi
    
    # Apply backup
    kubectl apply -f "$backup_file"
    
    # Wait for deployments to be ready
    log_info "Waiting for restored deployments to be ready..."
    deployments=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
    
    for deployment in $deployments; do
        kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=$KUBECTL_TIMEOUT
    done
    
    log_info "Restore completed successfully"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  history                    Show rollout history for all deployments"
    echo "  history <deployment>       Show rollout history for specific deployment"
    echo "  rollback <deployment>      Rollback specific deployment to previous revision"
    echo "  rollback <deployment> <revision>  Rollback specific deployment to specific revision"
    echo "  rollback-all              Rollback all deployments to previous revision"
    echo "  rollback-all <revision>   Rollback all deployments to specific revision"
    echo "  status                    Check current deployment status"
    echo "  restore <backup-file>     Restore from backup file"
    echo
    echo "Examples:"
    echo "  $0 history"
    echo "  $0 history api-gateway"
    echo "  $0 rollback api-gateway"
    echo "  $0 rollback api-gateway 3"
    echo "  $0 rollback-all"
    echo "  $0 rollback-all 2"
    echo "  $0 status"
    echo "  $0 restore /tmp/football-analytics-backup-20240101-120000.yaml"
}

# Main function
main() {
    local command=$1
    local arg1=$2
    local arg2=$3
    
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
        "history")
            if [ -n "$arg1" ]; then
                show_history $arg1
            else
                show_all_histories
            fi
            ;;
        "rollback")
            if [ -z "$arg1" ]; then
                log_error "Deployment name required for rollback"
                show_usage
                exit 1
            fi
            rollback_deployment $arg1 $arg2
            ;;
        "rollback-all")
            rollback_all_deployments $arg1
            ;;
        "status")
            check_status
            ;;
        "restore")
            if [ -z "$arg1" ]; then
                log_error "Backup file required for restore"
                show_usage
                exit 1
            fi
            restore_from_backup $arg1
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