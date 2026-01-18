# Microservices Development Guide

**Last Updated:** January 18, 2026  
**Project:** Node-Learn Microservices Migration

This guide covers setting up and developing with the new microservices architecture locally.

---

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose (latest)
- Node.js 20+ (for local development)
- NATS CLI (optional, for event inspection)

### 2. Start Everything

```bash
# Build and start all services + dependencies
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Wait for services to become healthy:**
```bash
docker-compose ps
# All containers should show "healthy" after 1-2 minutes
```

### 3. First Test

```bash
# Check API Gateway health
curl http://localhost/health

# Check NATS is running
curl http://localhost:8222/healthz

# Test monolith backend (should still work)
curl http://localhost/api/questions
```

---

## Architecture

### Service Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API Gateway** | 80 | http://localhost | Main entry point |
| **Monolith** | 3000 | http://localhost:3000 | Fallback, legacy code |
| **Auth Service** | 3001 | (internal) | OAuth + JWT |
| **Question Service** | 3002 | (internal) | Question CRUD |
| **Quiz Service** | 3003 | (internal) | Answer submission |
| **Achievement Service** | 3004 | (internal) | Achievement unlocking |
| **Leaderboard Service** | 3005 | (internal) | Rankings |
| **Admin Service** | 3006 | (internal) | Admin operations |
| **NATS** | 4222 | nats://localhost | Message broker |
| **NATS Monitor** | 8222 | http://localhost:8222 | Event inspection |
| **PostgreSQL** | 5432 | localhost:5432 | Database |
| **Frontend** | 4200 | http://localhost:4200 | Angular UI |

### Request Flow

```
User Browser
    ↓
[Frontend: 4200] - Angular app
    ↓
[API Gateway: 80] - Routes requests + adds correlation ID
    ↓
┌─────────────────────────────────────┐
│  Service Routing (strangler pattern)│
├─────────────────────────────────────┤
│ GET  /api/questions    → Question Service
│ POST /api/stats        → Quiz Service
│ GET  /api/achievements → Achievement Service
│ GET  /api/leaderboard  → Leaderboard Service
│ ALL  /api/*            → Monolith (fallback)
└─────────────────────────────────────┘
    ↓
[PostgreSQL] + [NATS] + [Event Store]
```

---

## Common Development Tasks

### View All Logs

```bash
# Follow all service logs with timestamps
docker-compose logs -f --timestamps

# Follow specific service
docker-compose logs -f backend
docker-compose logs -f api-gateway
docker-compose logs -f nats

# View last 100 lines
docker-compose logs --tail=100
```

### Stop & Clean

```bash
# Stop all services (keep data)
docker-compose stop

# Stop and remove containers (keep volumes/data)
docker-compose down

# Complete wipe (removes volumes - all data lost)
docker-compose down -v

# Restart specific service
docker-compose restart quiz-service
```

### Rebuild Services

```bash
# Rebuild API Gateway after code changes
docker-compose build api-gateway
docker-compose up -d api-gateway

# Rebuild everything
docker-compose build
docker-compose up -d
```

---

## Event Inspection

### Using NATS CLI

```bash
# Install NATS CLI (first time only)
brew install nats-io/nats-tools/nats

# Watch all events in real-time
nats sub '>' --server=nats://localhost:4222

# Watch specific event type
nats sub 'answer.submitted' --server=nats://localhost:4222

# Watch events with timestamps
nats sub 'answer.*' --server=nats://localhost:4222

# Publish test event
nats pub 'test.event' '{"test": "data"}' --server=nats://localhost:4222
```

### Using Web UI

```bash
# Open NATS monitoring dashboard
open http://localhost:8222
```

### Using Database

```bash
# Connect to event store
psql -h localhost -U postgres -d postgres

# View recent events
SELECT id, event_type, aggregate_id, created_at, payload 
FROM events 
ORDER BY created_at DESC 
LIMIT 20;

# Events by type
SELECT event_type, COUNT(*) 
FROM events 
GROUP BY event_type;

# Events for specific user
SELECT event_type, created_at, payload 
FROM events 
WHERE aggregate_id = 'user-id-here' 
ORDER BY created_at DESC;
```

---

## Testing the Full Saga

### 1. Authenticate User

```bash
# Start OAuth flow
curl -X GET "http://localhost/api/auth/google/callback?code=test-code" \
  -H "Cookie: code=test-code" \
  -v

# Save the JWT token returned
export JWT_TOKEN="your.jwt.token.here"
```

### 2. Submit Answer (Triggers Saga)

```bash
# This publishes answer.submitted event
curl -X POST "http://localhost/api/stats/record" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionId": 1,
    "userAnswer": "callback",
    "isCorrect": true
  }' \
  -v
```

### 3. Watch Event Flow

In another terminal, watch NATS:
```bash
nats sub '>' --server=nats://localhost:4222

# You should see:
# - answer.submitted event
# - achievement.earned event (if conditions met)
# - leaderboard.entry.updated event
```

### 4. Verify State Changes

```bash
# Check if achievement was earned
curl -X GET "http://localhost/api/achievements/earned" \
  -H "Authorization: Bearer $JWT_TOKEN"

# Check leaderboard updated
curl -X GET "http://localhost/api/leaderboard/quiz-modes/1"

# Check user stats
curl -X GET "http://localhost/api/stats/user" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Debugging

### Check Service Health

```bash
# Gateway health
curl http://localhost/health | jq

# Individual service health (internal only)
docker exec node-learn-backend curl http://localhost:3000/health
docker exec node-learn-nats curl http://localhost:8222/healthz
```

### View Service Logs

```bash
# See why a service failed to start
docker-compose logs backend
docker-compose logs api-gateway
docker-compose logs postgres

# Real-time logs
docker-compose logs -f quiz-service
```

### Execute Commands in Container

```bash
# Connect to running service
docker exec -it node-learn-backend sh

# Check environment variables
docker exec node-learn-backend env | grep SERVICE

# Run database migrations
docker exec node-learn-backend npm run typeorm migration:run

# NATS CLI inside container
docker exec node-learn-nats nats sub '>' 
```

### Test Service Directly (Bypass Gateway)

```bash
# Skip gateway, test monolith directly
curl http://localhost:3000/api/questions

# Test auth service directly
curl http://localhost:3001/api/auth/status

# Test quiz service
curl -X POST http://localhost:3003/api/stats/record \
  -H "Content-Type: application/json" \
  -d '{"questionId": 1, "isCorrect": true}'
```

---

## Event Sourcing & Persistence

### Event Store

The event store is a single table that records every domain event for audit, debugging, and replay:

```sql
-- Query events for debugging
SELECT * FROM events WHERE correlation_id = 'trace-id-here';

-- Replay events for user
SELECT * FROM events WHERE aggregate_id = 'user-id' ORDER BY created_at;

-- Failed events
SELECT * FROM events WHERE event_type LIKE '%.failed%';

-- Events from service
SELECT COUNT(*) FROM events WHERE service_id = 'quiz-service';
```

### Database Per Service

Each microservice (when extracted) gets its own PostgreSQL database:

```bash
# Once services are deployed:
# - auth_db (Auth Service)
# - question_db (Question Service)
# - quiz_db (Quiz Service)
# - achievement_db (Achievement Service)
# - leaderboard_db (Leaderboard Service)
# - event_store (Shared by all)
```

For now, all services use the shared monolith database.

---

## Correlation IDs for Tracing

Every request includes a unique correlation ID (`x-correlation-id` header) that flows through all services:

```bash
# Trace a specific request
curl -X GET http://localhost/api/questions \
  -H "x-correlation-id: my-trace-123" \
  -v

# View all logs for that request
docker-compose logs | grep "my-trace-123"

# View events for that request
psql -h localhost -U postgres -d postgres \
  -c "SELECT * FROM events WHERE correlation_id = 'my-trace-123';"
```

---

## Environment Variables

Create `.env.docker` (for Docker Compose):

```env
# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=node_learn_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Services
SERVICE_ID=monolith
NODE_ENV=production

# OAuth (if testing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost/api/auth/google/callback
```

---

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down -v
docker-compose build
docker-compose up -d
```

### NATS not connecting

```bash
# Check NATS is running
docker-compose ps nats

# Check NATS logs
docker-compose logs nats

# Test NATS port
telnet localhost 4222
```

### Database connection errors

```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Connect directly to test
psql -h localhost -U postgres -d postgres -c "SELECT 1"

# Check logs
docker-compose logs postgres
```

### High latency / timeouts

```bash
# Check service logs for errors
docker-compose logs quiz-service

# Check NATS throughput
curl http://localhost:8222/varz | jq '.connections'

# Monitor resource usage
docker stats
```

### Events not flowing

```bash
# Check NATS subscriptions
curl http://localhost:8222/varz | jq '.subscriptions'

# Verify event publishing
nats sub 'answer.submitted' --server=nats://localhost:4222

# Make a test request and watch for events
# Then run: curl http://localhost/api/questions
```

---

## Performance Tips

1. **Local caching**: Services cache frequently accessed data (questions, achievements)
2. **Connection pooling**: PostgreSQL connection pool = 20 (dev), 100 (prod)
3. **Request timeouts**: 30s for HTTP, 5s for NATS RPC calls
4. **Event batching**: Bulk operations batch events for throughput
5. **Database indexes**: Check migration files for index strategy

---

## Next Steps

- Phase 2: Extract Auth Service
- Phase 3: Extract Question Service  
- Phase 4: Extract Quiz Service with saga orchestrator
- Phase 5: Extract Achievement Service
- Phase 6: Extract Leaderboard Service

See `MICROSERVICES_MIGRATION_PLAN.md` for full roadmap.

---

## Getting Help

- Check service logs: `docker-compose logs <service>`
- Inspect events: `nats sub '>'`
- Query database: `psql -h localhost -U postgres`
- View this guide: `MICROSERVICES_DEV_GUIDE.md`
