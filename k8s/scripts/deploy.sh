#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="danielrajmon"  # Docker Hub username
AUTH_IMAGE="${REGISTRY}/node-learn-auth:latest"
QUESTIONS_IMAGE="${REGISTRY}/node-learn-questions:latest"
QUIZ_IMAGE="${REGISTRY}/node-learn-quiz:latest"
ACHIEVEMENTS_IMAGE="${REGISTRY}/node-learn-achievements:latest"
LEADERBOARD_IMAGE="${REGISTRY}/node-learn-leaderboard:latest"
ADMIN_IMAGE="${REGISTRY}/node-learn-admin:latest"
FRONTEND_IMAGE="${REGISTRY}/node-learn-frontend:latest"

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

echo "Building auth image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-auth:latest -f services/auth/Dockerfile .
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
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-quiz:latest -f services/quiz/Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build quiz image${NC}"
    exit 1
fi

echo "Building achievements image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-achievements:latest -f services/achievements/Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build achievements image${NC}"
    exit 1
fi

echo "Building leaderboard image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-leaderboard:latest -f services/leaderboard/Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build leaderboard image${NC}"
    exit 1
fi

echo "Building admin image..."
docker buildx build --platform linux/amd64,linux/arm64 -t node-learn-admin:latest -f services/admin/Dockerfile .
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build admin image${NC}"
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

echo "Tagging and pushing achievements image..."
docker tag node-learn-achievements:latest ${ACHIEVEMENTS_IMAGE}
docker push ${ACHIEVEMENTS_IMAGE}

echo "Tagging and pushing leaderboard image..."
docker tag node-learn-leaderboard:latest ${LEADERBOARD_IMAGE}
docker push ${LEADERBOARD_IMAGE}

echo "Tagging and pushing admin image..."
docker tag node-learn-admin:latest ${ADMIN_IMAGE}
docker push ${ADMIN_IMAGE}

API_GATEWAY_IMAGE="${REGISTRY}/node-learn-api-gateway:latest"
echo "Tagging and pushing api-gateway image..."
docker tag node-learn-api-gateway:latest ${API_GATEWAY_IMAGE}
docker push ${API_GATEWAY_IMAGE}

echo -e "${GREEN}✓ Images pushed successfully${NC}"
echo ""

# Step 3: Create namespace
echo -e "${YELLOW}Step 3: Creating namespace...${NC}"
kubectl apply -f k8s/manifests/namespace.yaml
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
kubectl apply -f k8s/manifests/traefik-service-patch.yaml
echo -e "${GREEN}✓ Traefik configured for HTTPS on port 61510${NC}"
echo ""

# Step 5: Deploy PostgreSQL
echo -e "${YELLOW}Step 5: Deploying PostgreSQL...${NC}"
kubectl apply -f k8s/manifests/postgres-secret.yaml
kubectl apply -f k8s/manifests/postgres-init-configmap.yaml
kubectl apply -f k8s/manifests/postgres-pvc.yaml
kubectl apply -f k8s/deployments/postgres.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n node-learn --timeout=120s
echo -e "${GREEN}✓ PostgreSQL deployed${NC}"
echo ""

# Step 6: Deploy NATS
echo -e "${YELLOW}Step 6: Deploying NATS...${NC}"
kubectl apply -f k8s/deployments/nats.yaml
echo "Waiting for NATS to be ready..."
kubectl wait --for=condition=ready pod -l app=nats -n node-learn --timeout=120s
echo -e "${GREEN}✓ NATS deployed${NC}"
echo ""

# Step 7: Deploy auth
echo -e "${YELLOW}Step 7: Deploying auth...${NC}"
kubectl apply -f k8s/deployments/auth.yaml
echo "Forcing auth to restart and pull latest image..."
kubectl rollout restart deployment/auth -n node-learn
echo "Waiting for auth to be ready..."
kubectl wait --for=condition=ready pod -l app=auth -n node-learn --timeout=120s
echo -e "${GREEN}✓ Auth deployed${NC}"
echo ""

# Step 8: Deploy questions
echo -e "${YELLOW}Step 8: Deploying questions...${NC}"
kubectl apply -f k8s/deployments/question.yaml
echo "Forcing questions to restart and pull latest image..."
kubectl rollout restart deployment/questions -n node-learn
echo "Waiting for questions to be ready..."
kubectl wait --for=condition=ready pod -l app=questions -n node-learn --timeout=120s
echo -e "${GREEN}✓ Questions deployed${NC}"
echo ""

# Step 9: Deploy quiz
echo -e "${YELLOW}Step 9: Deploying quiz...${NC}"
kubectl apply -f k8s/deployments/quiz.yaml
echo "Forcing quiz to restart and pull latest image..."
kubectl rollout restart deployment/quiz -n node-learn
echo "Waiting for quiz to be ready..."
kubectl wait --for=condition=ready pod -l app=quiz -n node-learn --timeout=120s
echo -e "${GREEN}✓ Quiz deployed${NC}"
echo ""

# Step 10: Deploy achievements
echo -e "${YELLOW}Step 10: Deploying achievements...${NC}"
kubectl apply -f k8s/deployments/achievements.yaml
echo "Forcing achievements to restart and pull latest image..."
kubectl rollout restart deployment/achievements -n node-learn
echo "Waiting for achievements to be ready..."
kubectl wait --for=condition=ready pod -l app=achievements -n node-learn --timeout=120s
echo -e "${GREEN}✓ Achievements deployed${NC}"
echo ""

# Step 11: Deploy leaderboard
echo -e "${YELLOW}Step 11: Deploying leaderboard...${NC}"
kubectl apply -f k8s/deployments/leaderboard.yaml
echo "Forcing leaderboard to restart and pull latest image..."
kubectl rollout restart deployment/leaderboard -n node-learn
echo "Waiting for leaderboard to be ready..."
kubectl wait --for=condition=ready pod -l app=leaderboard -n node-learn --timeout=120s
echo -e "${GREEN}✓ Leaderboard deployed${NC}"
echo ""

# Step 12: Deploy admin
echo -e "${YELLOW}Step 12: Deploying admin...${NC}"
kubectl apply -f k8s/deployments/admin.yaml
echo "Forcing admin to restart and pull latest image..."
kubectl rollout restart deployment/admin -n node-learn
echo "Waiting for admin to be ready..."
kubectl wait --for=condition=ready pod -l app=admin -n node-learn --timeout=120s
echo -e "${GREEN}✓ Admin deployed${NC}"
echo ""

# Step 13: Deploy api-gateway
echo -e "${YELLOW}Step 13: Deploying api-gateway...${NC}"
kubectl apply -f k8s/deployments/api-gateway.yaml
echo "Forcing api-gateway to restart and pull latest image..."
kubectl rollout restart deployment/api-gateway -n node-learn
echo "Waiting for api-gateway to be ready..."
kubectl wait --for=condition=ready pod -l app=api-gateway -n node-learn --timeout=120s
echo -e "${GREEN}✓ API Gateway deployed${NC}"
echo ""

# Step 14: Deploy frontend
echo -e "${YELLOW}Step 14: Deploying frontend...${NC}"
kubectl apply -f k8s/deployments/frontend.yaml
echo "Forcing frontend to restart and pull latest image..."
kubectl rollout restart deployment/frontend -n node-learn
echo "Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n node-learn --timeout=120s
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo ""

# Step 15: Deploy ingress
echo -e "${YELLOW}Step 15: Deploying ingress...${NC}"
kubectl apply -f k8s/manifests/ingress.yaml
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo ""

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
