# Deploying Node Learn to QNAP K3s

This guide will help you deploy the Node Learn quiz application to your QNAP K3s cluster.

## Prerequisites

- QNAP NAS with K3s installed
- `kubectl` configured to access your K3s cluster
- Docker installed on your local machine (for building images)
- Access to a Docker registry (Docker Hub, QNAP Container Registry, or private registry)

## Architecture

The application consists of three main components:
- **PostgreSQL**: Database for storing questions and answers
- **Backend**: NestJS API server (port 3000)
- **Frontend**: Angular SPA served by Nginx (port 80)

## Deployment Options

### Option 1: Using the Deployment Script (Recommended)

1. **Configure the registry** (edit `k8s/deploy.sh`):
   ```bash
   REGISTRY="your-docker-hub-username"
   # Or use QNAP Container Registry:
   # REGISTRY="your-qnap-ip:5000"
   ```

2. **Make the script executable**:
   ```bash
   chmod +x k8s/deploy.sh
   ```

3. **Run the deployment script**:
   ```bash
   ./k8s/deploy.sh
   ```

   The script will:
   - Build Docker images
   - Push images to your registry
   - Deploy all Kubernetes resources
   - Wait for services to be ready

### Option 2: Manual Deployment

#### Step 1: Build and Push Docker Images

```bash
# Build images
docker build -t node-learn-backend:latest ./backend
docker build -t node-learn-frontend:latest ./frontend

# Tag images for your registry
docker tag node-learn-backend:latest your-registry/node-learn-backend:latest
docker tag node-learn-frontend:latest your-registry/node-learn-frontend:latest

# Push to registry
docker push your-registry/node-learn-backend:latest
docker push your-registry/node-learn-frontend:latest
```

#### Step 2: Update Image References

Edit the deployment files to reference your images:
- `k8s/backend-deployment.yaml`: Update `image:` field
- `k8s/frontend-deployment.yaml`: Update `image:` field

#### Step 3: Deploy to K3s

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n node-learn --timeout=120s

# Deploy backend
kubectl apply -f k8s/backend-config.yaml
kubectl apply -f k8s/backend-deployment.yaml

# Wait for backend to be ready
kubectl wait --for=condition=ready pod -l app=backend -n node-learn --timeout=120s

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for frontend to be ready
kubectl wait --for=condition=ready pod -l app=frontend -n node-learn --timeout=120s

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### Option 3: Using Local Images (No Registry)

If you don't have a Docker registry, you can import images directly to K3s:

```bash
# Build images
docker build -t node-learn-backend:latest ./backend
docker build -t node-learn-frontend:latest ./frontend

# Save images to tar files
docker save node-learn-backend:latest > backend.tar
docker save node-learn-frontend:latest > frontend.tar

# Copy to QNAP and import
scp backend.tar frontend.tar admin@your-qnap-ip:/tmp/
ssh admin@your-qnap-ip
sudo k3s ctr images import /tmp/backend.tar
sudo k3s ctr images import /tmp/frontend.tar

# Update deployments to use imagePullPolicy: Never
# Then apply as shown in Option 2
```

## Configuration

### Database Credentials

Update `k8s/postgres-secret.yaml` with your desired credentials (or use a tool like Sealed Secrets for production):

```yaml
stringData:
  POSTGRES_USER: your-username
  POSTGRES_PASSWORD: your-secure-password
  POSTGRES_DB: node-learn-questions
```

### Storage

The PostgreSQL deployment uses a PersistentVolumeClaim. If your K3s has a specific storage class, update `k8s/postgres-pvc.yaml`:

```yaml
spec:
  storageClassName: your-storage-class  # e.g., local-path (default), nfs, etc.
```

### Ingress / Access

Update `k8s/ingress.yaml` with your desired hostname:

```yaml
spec:
  rules:
  - host: node-learn.your-domain.com  # Change this
```

Then add to your `/etc/hosts` or DNS:
```
<QNAP-IP> node-learn.your-domain.com
```

For TLS/HTTPS, uncomment the TLS section in `ingress.yaml` and configure cert-manager.

## Verification

### Check Deployment Status

```bash
# View all resources
kubectl get all -n node-learn

# Check pod status
kubectl get pods -n node-learn

# Check ingress
kubectl get ingress -n node-learn
```

### View Logs

```bash
# PostgreSQL logs
kubectl logs -f deployment/postgres -n node-learn

# Backend logs
kubectl logs -f deployment/backend -n node-learn

# Frontend logs
kubectl logs -f deployment/frontend -n node-learn
```

### Access the Application

1. Get your K3s ingress IP:
   ```bash
   kubectl get ingress -n node-learn
   ```

2. Access via browser:
   - http://huvinas.myqnapcloud.com:61723 (or your configured hostname)
   - Or directly via LoadBalancer IP if available

## Troubleshooting

### Pods not starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n node-learn

# Check logs
kubectl logs <pod-name> -n node-learn
```

### Image pull errors

- Verify your registry credentials
- For private registries, create an imagePullSecret:
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=your-registry \
    --docker-username=your-username \
    --docker-password=your-password \
    -n node-learn
  ```
  Then add to deployments:
  ```yaml
  spec:
    imagePullSecrets:
    - name: regcred
  ```

### Database connection issues

```bash
# Check if PostgreSQL is running
kubectl get pods -n node-learn -l app=postgres

# Test database connection from backend pod
kubectl exec -it deployment/backend -n node-learn -- sh
# Inside pod:
# apt-get update && apt-get install -y postgresql-client
# psql -h postgres -U postgres -d node-learn-questions
```

### Ingress not working

- Verify Traefik is running (default K3s ingress controller):
  ```bash
  kubectl get pods -n kube-system | grep traefik
  ```
- Check ingress controller logs:
  ```bash
  kubectl logs -n kube-system deployment/traefik
  ```

## Scaling

Scale the backend or frontend:

```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n node-learn

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n node-learn
```

## Cleanup

To remove the entire deployment:

```bash
kubectl delete namespace node-learn
```

Or remove individual components:

```bash
kubectl delete -f k8s/ingress.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/postgres-deployment.yaml
kubectl delete -f k8s/postgres-pvc.yaml
kubectl delete -f k8s/namespace.yaml
```

## Production Considerations

1. **Secrets Management**: Use Sealed Secrets or external secret managers
2. **Persistent Storage**: Configure proper backup strategy for PostgreSQL PVC
3. **Monitoring**: Set up Prometheus and Grafana for monitoring
4. **TLS/HTTPS**: Configure cert-manager for automatic SSL certificates
5. **Resource Limits**: Adjust CPU/memory limits based on your load
6. **High Availability**: Consider StatefulSet for PostgreSQL with replication
7. **Database Backups**: Set up automated PostgreSQL backups using CronJobs
8. **Ingress**: Configure rate limiting and security headers

## QNAP-Specific Notes

- **Container Station**: You can also manage K3s through QNAP's Container Station UI
- **Storage**: QNAP typically uses `local-path` as the default storage class
- **Networking**: Ensure your QNAP firewall allows ingress traffic (ports 80/443)
- **Resources**: Monitor QNAP resources to ensure adequate CPU/memory for the cluster
- **Updates**: Use `kubectl set image` for rolling updates without downtime

## Support

For issues specific to:
- K3s: https://docs.k3s.io/
- QNAP Container Station: QNAP support documentation
- Application: Check application logs and GitHub issues
