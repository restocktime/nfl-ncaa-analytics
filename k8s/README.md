# Football Analytics System - Kubernetes Deployment

This directory contains Kubernetes manifests and deployment scripts for the Football Analytics System.

## Architecture Overview

The system is deployed as a microservices architecture on Kubernetes with the following components:

### Infrastructure Services
- **PostgreSQL with TimescaleDB**: Primary database for relational data
- **Redis**: Caching layer and session storage
- **InfluxDB**: Time-series database for metrics and real-time data
- **Prometheus**: Monitoring and metrics collection

### Application Services
- **API Gateway**: Main entry point, handles authentication and routing
- **WebSocket Service**: Real-time communication for live updates
- **Data Ingestion Service**: Manages external API integrations
- **Probability Engine**: Core prediction and probability calculations
- **Monte Carlo Service**: Simulation workloads with auto-scaling
- **ML Model Service**: Machine learning model management and inference
- **Historical Stats Service**: Historical data analysis and statistics

## Prerequisites

1. **Kubernetes Cluster**: Version 1.20+
2. **kubectl**: Configured to connect to your cluster
3. **Docker**: For building and pushing images
4. **Ingress Controller**: NGINX Ingress Controller installed
5. **Cert Manager**: For SSL certificate management (optional)
6. **Metrics Server**: For HPA functionality (optional)

## Quick Start

### 1. Deploy the System

```bash
# Deploy entire system
./scripts/deploy.sh

# Deploy with specific version
./scripts/deploy.sh v1.2.0
```

### 2. Check Deployment Status

```bash
# Check all resources
kubectl get all -n football-analytics

# Check specific services
kubectl get pods -n football-analytics
kubectl get services -n football-analytics
kubectl get ingress -n football-analytics
```

### 3. Access the System

- **API Gateway**: https://api.football-analytics.com
- **WebSocket**: wss://ws.football-analytics.com
- **Prometheus**: http://prometheus.football-analytics.com (if exposed)

## Configuration

### Environment Variables

Key configuration is managed through ConfigMaps and Secrets:

- **ConfigMap**: `football-analytics-config` - Non-sensitive configuration
- **Secret**: `football-analytics-secrets` - API keys, passwords, and sensitive data

### Scaling Configuration

The system includes Horizontal Pod Autoscalers (HPA) for automatic scaling:

- **API Gateway**: 3-10 replicas (CPU: 70%, Memory: 80%)
- **WebSocket Service**: 2-8 replicas (CPU: 70%, Memory: 80%)
- **Probability Engine**: 3-12 replicas (CPU: 70%, Memory: 80%)
- **Monte Carlo Service**: 2-20 replicas (CPU: 80%, Memory: 85%)
- **Other Services**: 2-6 replicas (CPU: 70%, Memory: 80%)

## Deployment Scripts

### deploy.sh
Main deployment script with the following features:
- Prerequisites checking
- Sequential deployment of services
- Health verification
- Automatic rollback on failure
- External IP detection

```bash
./scripts/deploy.sh [version]
```

### rollback.sh
Rollback management script:
- View rollout history
- Rollback specific deployments
- Rollback all deployments
- Restore from backup files

```bash
# Show rollout history
./scripts/rollback.sh history

# Rollback specific deployment
./scripts/rollback.sh rollback api-gateway

# Rollback all deployments
./scripts/rollback.sh rollback-all
```

### scale.sh
Scaling management script:
- Manual scaling of deployments
- Predefined scaling profiles (game-day, normal, maintenance)
- HPA configuration management

```bash
# Scale for game day traffic
./scripts/scale.sh game-day

# Scale specific service
./scripts/scale.sh scale api-gateway 5

# Configure HPA
./scripts/scale.sh configure-hpa
```

## Monitoring and Observability

### Prometheus Metrics

The system exposes metrics on `/metrics` endpoints:
- API response times and error rates
- Prediction accuracy metrics
- Resource utilization
- Custom business metrics

### Health Checks

All services implement health check endpoints:
- `/health`: Liveness probe
- `/ready`: Readiness probe

### Logging

Structured logging with correlation IDs for distributed tracing.

## Security

### Network Policies
- Services communicate only through defined interfaces
- Database access restricted to authorized services
- External traffic only through ingress controller

### Secrets Management
- API keys stored in Kubernetes secrets
- Database credentials encrypted at rest
- TLS certificates managed by cert-manager

### RBAC
- Service accounts with minimal required permissions
- Role-based access control for different environments

## Disaster Recovery

### Backup Strategy
- Automated database backups to cloud storage
- Configuration backups before deployments
- Model artifacts stored in persistent volumes

### Recovery Procedures
1. Database restoration from backups
2. Configuration restoration using backup files
3. Service deployment using rollback scripts

## Performance Optimization

### Resource Requests and Limits
- CPU and memory requests/limits defined for all services
- Quality of Service (QoS) classes configured appropriately

### Caching Strategy
- Redis for application-level caching
- CDN for static assets
- Database query optimization

### Auto-scaling
- HPA based on CPU and memory utilization
- Custom metrics scaling for business-specific loads
- Cluster auto-scaling for node management

## Troubleshooting

### Common Issues

1. **Pods not starting**
   ```bash
   kubectl describe pod <pod-name> -n football-analytics
   kubectl logs <pod-name> -n football-analytics
   ```

2. **Service connectivity issues**
   ```bash
   kubectl get endpoints -n football-analytics
   kubectl exec -it <pod-name> -n football-analytics -- nslookup <service-name>
   ```

3. **Ingress not working**
   ```bash
   kubectl describe ingress football-analytics-ingress -n football-analytics
   kubectl get events -n football-analytics
   ```

### Debug Commands

```bash
# Check cluster resources
kubectl top nodes
kubectl top pods -n football-analytics

# Check service mesh (if applicable)
kubectl get virtualservices -n football-analytics
kubectl get destinationrules -n football-analytics

# Check persistent volumes
kubectl get pv
kubectl get pvc -n football-analytics
```

## Maintenance

### Regular Tasks
- Monitor resource usage and adjust limits
- Review and rotate secrets
- Update container images
- Clean up old persistent volume snapshots

### Upgrade Procedures
1. Test in staging environment
2. Create backup of current state
3. Deploy new version using blue-green strategy
4. Verify functionality
5. Clean up old resources

## Environment-Specific Configurations

### Development
- Single replica for most services
- Reduced resource limits
- Debug logging enabled

### Staging
- Production-like scaling
- Integration testing enabled
- Monitoring and alerting active

### Production
- Full scaling configuration
- High availability setup
- Comprehensive monitoring and alerting
- Disaster recovery procedures active

## Support and Documentation

For additional support:
- Check service logs: `kubectl logs -f deployment/<service-name> -n football-analytics`
- Monitor metrics: Access Prometheus dashboard
- Review documentation: See individual service README files
- Contact: System administrators or DevOps team