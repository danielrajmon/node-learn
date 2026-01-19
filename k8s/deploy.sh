#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="danielrajmon"  # Docker Hub username
BACKEND_IMAGE="${REGISTRY}/node-learn-backend:latest"
AUTH_IMAGE="${REGISTRY}/node-learn-auth:latest"
QUESTIONS_IMAGE="${REGISTRY}/node-learn-questions:latest"
QUIZ_IMAGE="${REGISTRY}/node-learn-quiz:latest"
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

# Step 1: Build Docker images (multi-platform for amd64 + arm64)
echo -e "${YELLOW}Step 1: Building Docker images (multi-platform: amd64 + arm64)...${NC}"
echo "Building backend image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-backend:latest ./backend
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build backend image${NC}"
    exit 1
fi

echo "Building auth image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-auth:latest ./services/auth
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build auth image${NC}"
    exit 1
fi

echo "Building questions image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-questions:latest ./services/questions
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build questions image${NC}"
    exit 1
fi

echo "Building quiz image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-quiz:latest ./services/quiz
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build quiz image${NC}"
    exit 1
fi

echo "Building api-gateway image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-api-gateway:latest ./services/api-gateway
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build api-gateway image${NC}"
    exit 1
fi

echo "Building frontend image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-frontend:latest ./frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build frontend image${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Images built successfully (multi-platform)${NC}"
echo ""

# Step 2: Tag and push images (if using registry)
echo -e "${YELLOW}Step 2: Pushing images to registry...${NC}"
echo "Tagging and pushing backend image..."
docker tag node-learn-backend:latest ${BACKEND_IMAGE}
docker push ${BACKEND_IMAGE}

echo "Tagging and pushing frontend image..."
docker tag node-learn-frontend:latest ${FRONTEND_IMAGE}
docker push ${FRONTEND_IMAGE}

echo "Tagging and pushing auth image..."
docker tag node-learn-auth:latest ${AUTH_IMAGE}
docker push ${AUTH_IMAGE}

echo "Tagging and pushing questions image..."
docker tag node-learn-questions:latest ${QUESTIONS_IMAGE}
docker push ${QUESTIONS_IMAGE}

echo "Tagging and pushing quiz image..."
docker tag node-learn-quiz:latest ${QUIZ_IMAGE}
docker push ${QUIZ_IMAGE}

API_GATEWAY_IMAGE="${REGISTRY}/node-learn-api-gateway:latest"
echo "Tagging and pushing api-gateway image..."
docker tag node-learn-api-gateway:latest ${API_GATEWAY_IMAGE}
docker push ${API_GATEWAY_IMAGE}

echo -e "${GREEN}✓ Images pushed successfully${NC}"
echo ""

# Step 3: Create namespace
echo -e "${YELLOW}Step 3: Creating namespace...${NC}"
kubectl apply -f k8s/namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"
echo ""

# Step 4: Create app secret (JWT_SECRET)
echo -e "${YELLOW}Step 4: Creating app secret...${NC}"
kubectl create secret generic app-secret -n node-learn \
  --from-literal=JWT_SECRET="my-secret-key-change-in-production-12345" \
  --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ App secret created${NC}"
echo ""

# Step 5: Configure Traefik for HTTPS-only with static port
echo -e "${YELLOW}Step 4: Configuring Traefik service...${NC}"
kubectl apply -f k8s/traefik-service-patch.yaml
echo -e "${GREEN}✓ Traefik configured for HTTPS on port 61510${NC}"
echo ""

# Step 5: Deploy PostgreSQL
echo -e "${YELLOW}Step 5: Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n node-learn --timeout=120s
echo -e "${GREEN}✓ PostgreSQL deployed${NC}"
echo ""

# Step 6: Deploy NATS
echo -e "${YELLOW}Step 6: Deploying NATS...${NC}"
kubectl apply -f k8s/nats-deployment.yaml
echo "Waiting for NATS to be ready..."
kubectl wait --for=condition=ready pod -l app=nats -n node-learn --timeout=120s
echo -e "${GREEN}✓ NATS deployed${NC}"
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

# Step 8: Deploy auth
echo -e "${YELLOW}Step 8: Deploying auth...${NC}"
kubectl apply -f k8s/auth-deployment.yaml
echo "Forcing auth to restart and pull latest image..."
kubectl rollout restart deployment/auth -n node-learn
echo "Waiting for auth to be ready..."
kubectl wait --for=condition=ready pod -l app=auth -n node-learn --timeout=120s
echo -e "${GREEN}✓ Auth deployed${NC}"
echo ""

# Step 9: Deploy questions
echo -e "${YELLOW}Step 9: Deploying questions...${NC}"
kubectl apply -f k8s/question-deployment.yaml
echo "Forcing questions to restart and pull latest image..."
kubectl rollout restart deployment/questions -n node-learn
echo "Waiting for questions to be ready..."
kubectl wait --for=condition=ready pod -l app=questions -n node-learn --timeout=120s
echo -e "${GREEN}✓ Questions deployed${NC}"
echo ""

# Step 10: Deploy quiz
echo -e "${YELLOW}Step 10: Deploying quiz...${NC}"
kubectl apply -f k8s/quiz-deployment.yaml
echo "Forcing quiz to restart and pull latest image..."
kubectl rollout restart deployment/quiz -n node-learn
echo "Waiting for quiz to be ready..."
kubectl wait --for=condition=ready pod -l app=quiz -n node-learn --timeout=120s
echo -e "${GREEN}✓ Quiz deployed${NC}"
echo ""

# Step 11: Deploy api-gateway
echo -e "${YELLOW}Step 11: Deploying api-gateway...${NC}"
kubectl apply -f k8s/api-gateway-deployment.yaml
echo "Forcing api-gateway to restart and pull latest image..."
kubectl rollout restart deployment/api-gateway -n node-learn
echo "Waiting for api-gateway to be ready..."
kubectl wait --for=condition=ready pod -l app=api-gateway -n node-learn --timeout=120s
echo -e "${GREEN}✓ API Gateway deployed${NC}"
echo ""

# Step 12: Deploy frontend
echo -e "${YELLOW}Step 12: Deploying frontend...${NC}"
kubectl apply -f k8s/frontend-deployment.yaml
echo "Forcing frontend to restart and pull latest image..."
kubectl rollout restart deployment/frontend -n node-learn
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n node-learn --timeout=120s
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo ""

# Step 13: Deploy ingress
echo -e "${YELLOW}Step 13: Deploying ingress...${NC}"
kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo ""

# Step 14: Import questions into the database
if [ "$IMPORT_QUESTIONS" = true ]; then
    echo -e "${YELLOW}Step 14: Importing questions into the database...${NC}"
    # Delete existing job to force re-import
    kubectl delete job import-questions -n node-learn --ignore-not-found=true
    kubectl apply -f k8s/import-questions.yaml
    kubectl wait --for=condition=complete job/import-questions -n node-learn --timeout=60s
    echo -e "${GREEN}✓ Questions imported${NC}"
else
    echo -e "${YELLOW}Step 14: Skipping questions import.${NC}"
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
