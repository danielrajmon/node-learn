#!/bin/bash

# Dev environment management scripts for Node-Learn Microservices
# Usage: ./scripts/dev-up.sh, ./scripts/dev-down.sh, etc.

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

# Dev up - Start all services
dev_up() {
  check_docker
  log_info "Starting all services..."
  cd "$PROJECT_ROOT"
  docker-compose up -d
  log_success "Services starting..."
  echo ""
  log_info "Waiting for services to become healthy (30-60 seconds)..."
  sleep 10
  
  # Check health
  log_info "Service status:"
  docker-compose ps
  
  echo ""
  log_success "✓ Setup complete!"
  echo ""
  echo "📝 Next steps:"
  echo "   - View logs:  ./scripts/dev-logs.sh"
  echo "   - Watch events: nats sub '>' --server=nats://localhost:4222"
  echo "   - API Gateway: http://localhost"
  echo "   - NATS Monitor: http://localhost:8222"
  echo "   - Frontend: http://localhost:4200"
}

# Dev down - Stop all services (keep data)
dev_down() {
  check_docker
  log_info "Stopping all services..."
  cd "$PROJECT_ROOT"
  docker-compose stop
  log_success "Services stopped (data preserved)"
}

# Dev logs - Follow logs from all services
dev_logs() {
  check_docker
  log_info "Tailing logs from all services (Ctrl+C to stop)..."
  cd "$PROJECT_ROOT"
  docker-compose logs -f --timestamps
}

# Dev logs - Follow logs from specific service
dev_logs_service() {
  if [ -z "$1" ]; then
    log_error "Usage: $0 logs-service <service>"
    echo "Available services: nats, postgres, backend, api-gateway, frontend"
    exit 1
  fi
  
  check_docker
  log_info "Tailing logs from $1..."
  cd "$PROJECT_ROOT"
  docker-compose logs -f "$1"
}

# Dev reset - Wipe everything (fresh start)
dev_reset() {
  check_docker
  log_warning "This will delete all data and recreate containers"
  read -p "Are you sure? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cancelled"
    exit 0
  fi
  
  log_info "Removing all containers and volumes..."
  cd "$PROJECT_ROOT"
  docker-compose down -v
  
  log_info "Rebuilding images..."
  docker-compose build
  
  log_info "Starting services..."
  docker-compose up -d
  
  log_success "Reset complete! Services starting..."
  sleep 5
  docker-compose ps
}

# Dev health - Check service health
dev_health() {
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
  
  # Backend (Monolith)
  if curl -s http://localhost:3000/api/admin/health > /dev/null 2>&1; then
    log_success "Backend Monolith: http://localhost:3000/api/admin/health"
  else
    log_error "Backend Monolith: unreachable"
  fi
  
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

# Dev test-saga - Run end-to-end saga test
dev_test_saga() {
  log_warning "Saga testing not yet implemented"
  echo ""
  echo "To manually test the saga:"
  echo "1. Get a JWT token from auth endpoint"
  echo "2. Submit an answer: POST /api/stats/record"
  echo "3. Watch events: nats sub '>'"
  echo "4. Check achievement: GET /api/achievements/earned"
  echo "5. Check leaderboard: GET /api/leaderboard"
}

# Dev shell - Open shell in service
dev_shell() {
  if [ -z "$1" ]; then
    log_error "Usage: $0 shell <service>"
    echo "Available services: backend, postgres, nats, api-gateway"
    exit 1
  fi
  
  check_docker
  log_info "Opening shell in $1..."
  docker exec -it "node-learn-$1" sh
}

# Show help
show_help() {
  cat << EOF
Node-Learn Microservices Development Script

Usage: $0 <command>

Commands:
  up              Start all services
  down            Stop all services (keep data)
  logs            Follow logs from all services
  logs-service    Follow logs from specific service (e.g., 'logs-service backend')
  reset           Wipe all data and rebuild (fresh start)
  health          Check service health
  shell           Open shell in a service (e.g., 'shell backend')
  test-saga       Run end-to-end saga test
  help            Show this help message

Examples:
  $0 up
  $0 logs
  $0 logs-service backend
  $0 shell postgres
  $0 health

For more info, see: MICROSERVICES_DEV_GUIDE.md
EOF
}

# Main command router
case "${1:-help}" in
  up)
    dev_up
    ;;
  down)
    dev_down
    ;;
  logs)
    dev_logs
    ;;
  logs-service)
    dev_logs_service "$2"
    ;;
  reset)
    dev_reset
    ;;
  health)
    dev_health
    ;;
  shell)
    dev_shell "$2"
    ;;
  test-saga)
    dev_test_saga
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    log_error "Unknown command: $1"
    echo ""
    show_help
    exit 1
    ;;
esac
