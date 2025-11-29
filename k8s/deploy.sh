#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="danielrajmon"  # Docker Hub username
BACKEND_IMAGE="${REGISTRY}/node-learn-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/node-learn-frontend:latest"
IMPORT_QUESTIONS=true  # Set to false to skip import

# Check if KUBECONFIG is set
if [ -z "$KUBECONFIG" ]; then
    echo -e "${RED}Error: KUBECONFIG environment variable is not set.${NC}"
    echo "Please set KUBECONFIG to your kubeconfig file before running this script."
    echo "Example: export KUBECONFIG=\$HOME/.kube/qnap-k3s-config"
    exit 1
else
    echo -e "${GREEN}✓ Using kubeconfig: $KUBECONFIG${NC}"
fi

echo -e "${GREEN}Node Learn K3s Deployment Script${NC}"
echo "=================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
if ! command_exists kubectl; then
    echo -e "${RED}kubectl is not installed. Please install kubectl.${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}docker is not installed. Please install Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required tools are installed${NC}"

# Verify kubectl connection
echo -e "${YELLOW}Verifying kubectl connection...${NC}"
if ! kubectl get nodes &>/dev/null; then
    echo -e "${RED}Cannot connect to Kubernetes cluster${NC}"
    echo "Please check your kubeconfig settings"
    exit 1
fi
echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
kubectl get nodes
echo ""

# Step 1: Build Docker images
echo -e "${YELLOW}Step 1: Building Docker images...${NC}"
echo "Building backend image for amd64..."
docker buildx build --platform linux/amd64 -t node-learn-backend:latest ./backend
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build backend image${NC}"
    exit 1
fi

echo "Building frontend image for amd64..."
docker buildx build --platform linux/amd64 -t node-learn-frontend:latest ./frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build frontend image${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

# Step 2: Tag and push images (if using registry)
echo -e "${YELLOW}Step 2: Pushing images to registry...${NC}"
echo "Tagging and pushing backend image..."
docker tag node-learn-backend:latest ${BACKEND_IMAGE}
docker push ${BACKEND_IMAGE}

echo "Tagging and pushing frontend image..."
docker tag node-learn-frontend:latest ${FRONTEND_IMAGE}
docker push ${FRONTEND_IMAGE}

echo -e "${GREEN}✓ Images pushed successfully${NC}"
echo ""

# Step 3: Create namespace
echo -e "${YELLOW}Step 3: Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"
echo ""

# Step 4: Configure Traefik for HTTPS-only with static port
echo -e "${YELLOW}Step 4: Configuring Traefik service...${NC}"
kubectl apply -f k8s/traefik-service-patch.yaml
echo -e "${GREEN}✓ Traefik configured for HTTPS on port 61510${NC}"
echo ""

# Step 5: Create/update questions seed ConfigMap
echo -e "${YELLOW}Step 5: Creating/updating questions seed ConfigMap...${NC}"
if [ -f backend/src/seed/questions-export.json ]; then
    kubectl create configmap questions-seed --from-file=questions-export.json=backend/src/seed/questions-export.json -n node-learn --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✓ Questions seed ConfigMap applied${NC}"
else
    echo -e "${YELLOW}questions-export.json not found, skipping ConfigMap creation.${NC}"
fi
echo ""

# Step 6: Deploy PostgreSQL
echo -e "${YELLOW}Step 6: Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n node-learn --timeout=120s
echo -e "${GREEN}✓ PostgreSQL deployed${NC}"
echo ""

# Step 7: Deploy backend
echo -e "${YELLOW}Step 7: Deploying backend...${NC}"
kubectl apply -f k8s/backend-config.yaml
kubectl apply -f k8s/backend-deployment.yaml
echo "Forcing backend to restart and pull latest image..."
kubectl rollout restart deployment/backend -n node-learn
echo "Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n node-learn --timeout=120s
echo -e "${GREEN}✓ Backend deployed${NC}"
echo ""

# Step 8: Deploy frontend
echo -e "${YELLOW}Step 8: Deploying frontend...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml
echo "Forcing frontend to restart and pull latest image..."
kubectl rollout restart deployment/frontend -n node-learn
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n node-learn --timeout=120s
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo ""

# Step 9: Deploy ingress
echo -e "${YELLOW}Step 9: Deploying ingress...${NC}"
kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo ""

# Step 10: Import questions into the database
if [ "$IMPORT_QUESTIONS" = true ]; then
    echo -e "${YELLOW}Step 10: Importing questions into the database...${NC}"
    # Delete existing job to force re-import
    kubectl delete job import-questions -n node-learn --ignore-not-found=true
    kubectl apply -f k8s/import-questions.yaml
    kubectl wait --for=condition=complete job/import-questions -n node-learn --timeout=60s
    echo -e "${GREEN}✓ Questions imported${NC}"
else
    echo -e "${YELLOW}Step 10: Skipping questions import.${NC}"
fi

# Show deployment status
echo -e "${GREEN}Deployment Summary:${NC}"
echo "===================="
kubectl get all -n node-learn
echo ""

echo -e "${GREEN}Ingress Status:${NC}"
kubectl get ingress -n node-learn
echo ""

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "Access the application at http://huvinas.myqnapcloud.com:61510"
