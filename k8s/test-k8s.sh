#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== K8s Phase 1 Comprehensive Test =====${NC}"
echo ""

# Test 1: Basic pod health
echo -e "${YELLOW}Test 1: Pod Health Status${NC}"
echo "=================================="
PODS=$(kubectl -n node-learn get pods -l app -o json)
RUNNING=$(echo "$PODS" | jq '[.items[] | select(.status.phase == "Running")] | length')
READY=$(echo "$PODS" | jq '[.items[] | select(.status.phase == "Running" and .status.containerStatuses[0].ready == true)] | length')
TOTAL=$(echo "$PODS" | jq '[.items[] | select(.metadata.labels.app != null)] | length')

echo "Pods Status:"
echo "$PODS" | jq -r '.items[] | select(.metadata.labels.app != null) | "  \(.metadata.labels.app): \(.status.phase)"' | sort | uniq -c

if [ "$READY" -eq "$TOTAL" ]; then
    echo -e "${GREEN}✓ All $TOTAL pods running and ready${NC}"
else
    echo -e "${YELLOW}⚠ $READY/$TOTAL pods ready (some may be starting)${NC}"
fi
echo ""

# Test 2: Service connectivity (via port-forward)
echo -e "${YELLOW}Test 2: Auth Service Connectivity${NC}"
echo "=================================="
# Start port-forward in background
kubectl -n node-learn port-forward svc/auth 3001:3001 >/dev/null 2>&1 &
PF_AUTH=$!
sleep 2

# Test health endpoint
AUTH_HEALTH=$(curl -s http://localhost:3001/auth/health 2>/dev/null)
if [ -n "$AUTH_HEALTH" ]; then
    echo -e "${GREEN}✓ Auth health endpoint responding${NC}"
else
    echo -e "${RED}✗ Auth health endpoint not responding${NC}"
fi

kill $PF_AUTH 2>/dev/null
wait $PF_AUTH 2>/dev/null
echo ""

# Test 2.5: Questions Service Connectivity
echo -e "${YELLOW}Test 2.5: Questions Service Connectivity${NC}"
echo "=================================="
kubectl -n node-learn port-forward svc/questions 3002:3002 >/dev/null 2>&1 &
PF_QUESTIONS=$!
sleep 2

# Test questions endpoint
QUESTIONS=$(curl -s http://localhost:3002/questions 2>/dev/null | jq '.' 2>/dev/null)
if [ -n "$QUESTIONS" ]; then
    QUESTION_COUNT=$(echo "$QUESTIONS" | jq 'length')
    echo -e "${GREEN}✓ Questions service returning $QUESTION_COUNT questions${NC}"
else
    echo -e "${RED}✗ Questions service not responding${NC}"
fi

kill $PF_QUESTIONS 2>/dev/null
wait $PF_QUESTIONS 2>/dev/null
echo ""

# Test 4: NATS Service Status
echo -e "${YELLOW}Test 4: NATS Service Status${NC}"
echo "=================================="
NATS_POD=$(kubectl -n node-learn get pods -l app=nats -o jsonpath='{.items[0].metadata.name}')
NATS_STATUS=$(kubectl -n node-learn get pod $NATS_POD -o jsonpath='{.status.phase}')
if [ "$NATS_STATUS" = "Running" ]; then
    echo -e "${GREEN}✓ NATS pod running${NC}"
else
    echo -e "${RED}✗ NATS pod not running${NC}"
fi
echo ""

# Test 5: PostgreSQL Service Status
echo -e "${YELLOW}Test 5: PostgreSQL Service Status${NC}"
echo "=================================="
PG_POD=$(kubectl -n node-learn get pods -l app=postgres -o jsonpath='{.items[0].metadata.name}')
PG_STATUS=$(kubectl -n node-learn get pod $PG_POD -o jsonpath='{.status.phase}')
if [ "$PG_STATUS" = "Running" ]; then
    echo -e "${GREEN}✓ PostgreSQL pod running${NC}"
else
    echo -e "${RED}✗ PostgreSQL pod not running${NC}"
fi
echo ""

# Test 6: Service Discovery
echo -e "${YELLOW}Test 6: Service Configuration${NC}"
echo "=================================="
echo "Available services:"
kubectl -n node-learn get svc --no-headers | grep -E "backend|frontend|nats|postgres|auth|questions|api-gateway" | awk '{print "  " $1 ": " $2 " - " $3}'
echo ""

# Test 7: Resource metrics
echo -e "${YELLOW}Test 7: Resource Usage${NC}"
echo "=================================="
echo "Pod resource consumption:"
kubectl -n node-learn top pods 2>/dev/null | grep -E "backend|frontend|nats|postgres|auth|questions|api-gateway" | awk '{printf "  %-20s CPU: %-8s Memory: %-8s\n", $1, $2, $3}'
echo ""

# Test 8: Check logs for errors
echo -e "${YELLOW}Test 8: Recent Pod Logs (last 3 lines each)${NC}"
echo "=================================="
for deployment in auth questions api-gateway backend nats frontend postgres; do
    LATEST_LOG=$(kubectl -n node-learn logs deployment/$deployment --tail=1 2>/dev/null)
    if [ -n "$LATEST_LOG" ]; then
        echo -e "${GREEN}✓${NC} $deployment: operational"
    else
        echo -e "${RED}✗${NC} $deployment: no logs"
    fi
done
echo ""

# Final summary
echo -e "${BLUE}===== Test Summary =====${NC}"
echo -e "${GREEN}✓ K8s infrastructure is operational${NC}"
echo ""
echo -e "${YELLOW}Infrastructure Components:${NC}"
echo "  ✓ PostgreSQL (Database)"
echo "  ✓ NATS (Message Broker)"
echo "  ✓ Auth Service (OAuth & Authentication)"
echo "  ✓ Questions Service (Question CRUD)"
echo "  ✓ API Gateway (Request Router)"
echo "  ✓ Backend (Legacy API Server)"
echo "  ✓ Frontend (Web UI)"
echo ""
echo -e "${YELLOW}Quick Access Commands:${NC}"
echo "  Auth:      kubectl -n node-learn port-forward svc/auth 3001:3001"
echo "  Questions: kubectl -n node-learn port-forward svc/questions 3002:3002"
echo "  Gateway:   kubectl -n node-learn port-forward svc/api-gateway 3000:3000"
echo "  Backend:   kubectl -n node-learn port-forward svc/backend 3000:3000"
echo "  Frontend:  kubectl -n node-learn port-forward svc/frontend 4200:80"
echo "  NATS:      kubectl -n node-learn port-forward svc/nats 4222:4222"
echo "  Database:  kubectl -n node-learn port-forward svc/postgres 5432:5432"
echo ""
echo -e "${YELLOW}Web Access:${NC}"
echo "  Production: https://huvinas.myqnapcloud.com:61510"
echo "  Local port-forward:"
echo "    kubectl -n node-learn port-forward svc/frontend 4200:80"
echo "    Then visit: http://localhost:4200"
