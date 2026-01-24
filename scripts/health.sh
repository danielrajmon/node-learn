#!/bin/bash
# Health check script for Node-Learn Microservices
# Usage: ./scripts/health.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check if docker-compose is available
check_docker() {
  if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed. Please install Docker Desktop."
    exit 1
  fi
}

# Health check
check_health() {
  check_docker
  log_info "Checking service health..."
  echo ""
  
  # Get status
  cd "$PROJECT_ROOT"
  docker-compose ps
  
  echo ""
  log_info "Core Infrastructure:"
  
  # Database
  if docker exec node-learn-postgresql pg_isready -U postgres > /dev/null 2>&1; then
    log_success "PostgreSQL: Ready (localhost:5432)"
  else
    log_error "PostgreSQL: Not ready"
  fi
  
  # NATS
  if curl -s http://localhost:8222/healthz > /dev/null 2>&1; then
    log_success "NATS: Healthy (localhost:8222)"
  else
    log_error "NATS: unreachable"
  fi
  
  echo ""
  log_info "API Gateway & Frontend:"
  
  # API Gateway
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    log_success "API Gateway: http://localhost:3000/health"
  else
    log_error "API Gateway: unreachable"
  fi
  
  # Frontend
  if curl -s http://localhost:4200 > /dev/null 2>&1; then
    log_success "Frontend: http://localhost:4200"
  else
    log_error "Frontend: unreachable"
  fi
  
  echo ""
  log_info "Backend Services:"
  
  # Auth Service
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    log_success "Auth Service: http://localhost:3001/health"
  else
    log_error "Auth Service: unreachable"
  fi
  
  # Questions Service
  if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    log_success "Questions Service: http://localhost:3002/health"
  else
    log_error "Questions Service: unreachable"
  fi
  
  # Quiz Service
  if curl -s http://localhost:3003/health > /dev/null 2>&1; then
    log_success "Quiz Service: http://localhost:3003/health"
  else
    log_error "Quiz Service: unreachable"
  fi
  
  # Achievements Service
  if curl -s http://localhost:3004/health > /dev/null 2>&1; then
    log_success "Achievements Service: http://localhost:3004/health"
  else
    log_error "Achievements Service: unreachable"
  fi
  
  # Leaderboard Service
  if curl -s http://localhost:3005/leaderboard/health > /dev/null 2>&1; then
    log_success "Leaderboard Service: http://localhost:3005/leaderboard/health"
  else
    log_error "Leaderboard Service: unreachable"
  fi
  
  # Maintenance Service
  if curl -s http://localhost:3010/health > /dev/null 2>&1; then
    log_success "Maintenance Service: http://localhost:3010/health"
  else
    log_error "Maintenance Service: unreachable"
  fi
  
  # Admin Service
  if curl -s http://localhost:3007/admin/health > /dev/null 2>&1; then
    log_success "Admin Service: http://localhost:3007/admin/health"
  else
    log_error "Admin Service: unreachable"
  fi
  
  # Maintenance Service
  if curl -s http://localhost:3010/health > /dev/null 2>&1; then
    log_success "Maintenance Service: http://localhost:3010/health"
  else
    log_error "Maintenance Service: unreachable"
  fi
  
  echo ""
  log_info "API Endpoints (via Gateway):"
  
  # Test gateway routing to quiz service for answers
  if curl -s http://localhost:3000/api/answers/1 > /dev/null 2>&1; then
    log_success "Quiz Answers: GET /api/answers/:id"
  else
    log_warning "Quiz Answers: GET /api/answers/:id (no data)"
  fi
  
  # Test gateway routing for stats
  if curl -s http://localhost:3000/api/stats/user/1 > /dev/null 2>&1; then
    log_success "Stats: GET /api/stats/user/:userId"
  else
    log_warning "Stats: GET /api/stats/user/:userId (no data)"
  fi
  
  echo ""
  log_info "Access endpoints:"
  echo "   - Frontend: http://localhost:4200"
  echo "   - API Gateway: http://localhost:3000"
  echo "   - NATS Monitor: http://localhost:8222"
  echo "   - Database: localhost:5432"
}

check_health
