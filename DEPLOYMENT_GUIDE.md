# Football Analytics System - Deployment Guide

This guide walks you through deploying the Football Analytics System to a Kubernetes cluster.

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes Cluster**: EKS, GKE, AKS, or local cluster (minikube/kind)
2. **kubectl**: Configured to connect to your cluster
3. **Docker**: For building container images
4. **Container Registry**: Access to push images (GitHub Container Registry, ECR, etc.)

### Verify Prerequisites

```bash
# Check kubectl connection
kubectl cluster-info

# Check Docker
docker --version

# Check registry access (example for GitHub Container Registry)
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

## 📦 Step 1: Build and Push Images

```bash
# Set your registry
export REGISTRY="ghcr.io/your-org/football-analytics"
export VERSION="v1.0.0"

# Build and push all service images
./scripts/build-images.sh
```

## ⚙️ Step 2: Configure Deployment

```bash
# Update configuration with your values
export DOMAIN="your-domain.com"
./scripts/update-config.sh
```

### Update Secrets

Edit `k8s/secrets.yaml` with your actual API keys and credentials:

```bash
# Generate base64 encoded secrets
echo -n "your-postgres-password" | base64
echo -n "your-redis-password" | base64
echo -n "your-api-key" | base64
```

### Customize Configuration

Review and update `k8s/configmap.yaml` with your environment-specific settings.

## 🚀 Step 3: Deploy to Kubernetes

```bash
# Deploy the entire system
./scripts/deploy.sh v1.0.0

# Or deploy with default latest tag
./scripts/deploy.sh
```

## 📊 Step 4: Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n football-analytics

# Check services
kubectl get services -n football-analytics

# Check ingress
kubectl get ingress -n football-analytics

# View logs
kubectl logs -f deployment/api-gateway -n football-analytics
```

## 🔍 Step 5: Test the System

```bash
# Run smoke tests
npm run test:smoke:production

# Test WebSocket connection
npm run test:websocket:production

# Check health endpoints
curl https://api.your-domain.com/health
curl https://api.your-domain.com/ready
```

## 📈 Monitoring and Scaling

### View Metrics

```bash
# Access Prometheus (if exposed)
kubectl port-forward service/prometheus-service 9090:9090 -n football-analytics
# Open http://localhost:9090
```

### Scale Services

```bash
# Scale for game day traffic
./scripts/scale.sh game-day

# Scale specific service
./scripts/scale.sh scale api-gateway 5

# Return to normal scaling
./scripts/scale.sh normal
```

### Check Auto-scaling

```bash
# View HPA status
kubectl get hpa -n football-analytics

# Watch auto-scaling in action
kubectl get hpa -n football-analytics -w
```

## 🔄 CI/CD Integration

### GitHub Actions Setup

1. **Set Repository Secrets:**
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION
   EKS_CLUSTER_NAME
   GITHUB_TOKEN
   SLACK_WEBHOOK
   ```

2. **Push to trigger deployment:**
   ```bash
   # Deploy to staging
   git push origin develop
   
   # Deploy to production
   git push origin main
   
   # Deploy specific version
   git tag v1.0.0
   git push origin v1.0.0
   ```

## 🛠️ Troubleshooting

### Common Issues

#### Pods not starting
```bash
kubectl describe pod <pod-name> -n football-analytics
kubectl logs <pod-name> -n football-analytics
```

#### Service connectivity issues
```bash
kubectl get endpoints -n football-analytics
kubectl exec -it <pod-name> -n football-analytics -- nslookup <service-name>
```

#### Ingress not working
```bash
kubectl describe ingress football-analytics-ingress -n football-analytics
kubectl get events -n football-analytics
```

### Rollback Procedures

```bash
# View rollout history
./scripts/rollback.sh history

# Rollback specific deployment
./scripts/rollback.sh rollback api-gateway

# Rollback all deployments
./scripts/rollback.sh rollback-all

# Check rollback status
./scripts/rollback.sh status
```

## 🔧 Advanced Configuration

### Custom Resource Limits

Edit service YAML files to adjust resource requests and limits:

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

### Custom Auto-scaling

```bash
# Configure custom HPA
./scripts/scale.sh configure-hpa api-gateway 3 10 70 80
```

### Environment-specific Deployments

```bash
# Development environment
kubectl create namespace football-analytics-dev
# Update namespace in configs and deploy

# Staging environment
kubectl create namespace football-analytics-staging
# Update namespace in configs and deploy
```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Kubernetes cluster is accessible
- [ ] Docker images are built and pushed
- [ ] Secrets are updated with real values
- [ ] Configuration is customized for environment
- [ ] DNS records are configured (if using custom domain)

### During deployment
- [ ] Monitor deployment progress
- [ ] Check pod status and logs
- [ ] Verify service endpoints
- [ ] Test health checks

### Post-deployment
- [ ] Run smoke tests
- [ ] Verify monitoring is working
- [ ] Test auto-scaling configuration
- [ ] Update documentation
- [ ] Notify team of successful deployment

## 🆘 Support

### Getting Help

1. **Check logs:**
   ```bash
   kubectl logs -f deployment/<service-name> -n football-analytics
   ```

2. **Check system status:**
   ```bash
   kubectl get all -n football-analytics
   ```

3. **Run diagnostics:**
   ```bash
   kubectl describe deployment <deployment-name> -n football-analytics
   ```

### Emergency Procedures

#### Complete System Rollback
```bash
./scripts/rollback.sh rollback-all
```

#### Scale Down for Maintenance
```bash
./scripts/scale.sh maintenance
```

#### Emergency Stop
```bash
kubectl scale deployment --all --replicas=0 -n football-analytics
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prometheus Documentation](https://prometheus.io/docs/)

---

**Need help?** Contact the DevOps team or check the troubleshooting section above.