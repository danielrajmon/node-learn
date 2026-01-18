# Microservices Development Guide

**Last Updated:** January 18, 2026  
**Project:** Node-Learn Microservices Migration  
**Phase Status:** Phase 3 Complete (Auth & Questions Services extracted, deployed to K8s)

This guide covers setting up and developing with the new microservices architecture locally.

---

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose (latest)
- Node.js 20+ (for local development)
- NATS CLI (optional, for event inspection)

### 2. Start Everything

```bash
# Build and start all services + dependencies in foreground with logs
npm run start

# (or run in background:)
docker-compose up -d

# Check status
docker-compose ps

# View logs (when running in background)
npm run logs
```

**Wait for services to become healthy:**
```bash
docker-compose ps
# All containers should show "healthy" after 1-2 minutes
```

### 3. First Test

```bash
# Check API Gateway health
curl http://localhost:3000/health

# Check NATS is running
curl http://localhost:8222/healthz

# Test auth (through gateway)
curl http://localhost:3000/api/auth/health

# Test monolith backend (still works through gateway)
curl http://localhost:3000/api/questions

# Access Swagger documentation (API documentation UI)
open http://localhost:3000/api/docs
# or: curl http://localhost:3000/api/docs
```

---

## Architecture

### Service Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **API Gateway** | 3000 | http://localhost:3000 | Main entry point (strangler proxy) |
| **Monolith** | 3000 (internal) | http://backend:3000 | Fallback, legacy code |
| **Auth** | 3001 | (internal) | OAuth + JWT - ✅ Phase 2 |
| **Questions** | 3002 | (internal) | Question CRUD - ✅ Phase 3 |
| **Quiz Service** | 3003 | (internal) | Answer submission (planned) |
| **Achievement Service** | 3004 | (internal) | Achievement unlocking (planned) |
| **Leaderboard Service** | 3005 | (internal) | Rankings (planned) |
| **Admin Service** | 3006 | (internal) | Admin operations (planned) |
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
[API Gateway: 3000] - Strangler proxy routes requests + adds correlation ID
    ↓
┌──────────────────────────────────────────────────────┐
│  Service Routing (Phase 3: Auth + Questions)        │
├──────────────────────────────────────────────────────┤
│ GET  /api/auth/*            → Auth (3001)         ✅│
│ GET  /api/questions/*       → Questions (3002)    ✅│
│ POST /api/stats             → Monolith (3000)      │
│ POST /api/answer            → Monolith (3000)      │
│ GET  /api/achievements      → Monolith (3000)      │
│ GET  /api/leaderboard       → Monolith (3000)      │
│ ALL  /api/admin/*           → Monolith (3000)      │
│ Everything else             → Monolith (3000)      │
└──────────────────────────────────────────────────────┘
    ↓
[PostgreSQL] + [NATS] + [Event Store]
```

**Strangler Pattern:** New services intercept specific routes while the monolith remains as a reliable fallback.

---

## Phase 2: Auth Service Extraction - Complete ✅

### What Was Extracted

The **Auth Service** (port 3001) is now a separate NestJS microservice:

- **Location:** `services/auth/`
- **Responsibilities:** 
  - User authentication (JWT tokens)
  - OAuth2 integration (Google)
  - User profile management
  - Event publishing (user.login events to NATS)
- **Database:** Shared PostgreSQL (user credentials and profiles)
- **Messaging:** Publishes `user.login` events to NATS broker

### Testing Auth Service

```bash
# Health check
curl http://localhost:3000/api/auth/health

# Google OAuth flow (redirects to Google)
curl -X GET http://localhost:3000/api/auth/google

# Get authenticated user profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Architecture Improvements

1. **Strangler Proxy:** API Gateway (port 3000) routes `/api/auth/*` to auth
2. **Event Publishing:** Auth service publishes events to NATS when users log in
3. **Service Discovery:** Services communicate via Docker/K8s service DNS
4. **Shared Database:** Auth service shares PostgreSQL with monolith (transition phase)
5. **NATS Integration:** Full event-driven architecture in place

### Docker Compose Setup

```yaml
auth:
  ports: ["3001:3001"]
  depends_on: [nats, postgres]
  env: JWT_SECRET, GOOGLE_*, DATABASE_URL, NATS_URL
  health_check: GET /api/auth/health
```

### Kubernetes Deployment

```bash
# Deploy auth to K8s
./k8s/deploy.sh

# Verify deployment
kubectl get deployments -n node-learn
kubectl logs -n node-learn deployment/auth
```

---

## Phase 3: Questions Service Extraction - Complete ✅

### What Was Extracted

The **Questions Service** (port 3002) is now a separate NestJS microservice:

- **Location:** `services/questions/`
- **Responsibilities:** 
  - Read-only question data (GET endpoints)
  - Question retrieval by ID
  - Random question selection
  - Question listing and filtering
- **Database:** Shared PostgreSQL (read-only access to questions table)
- **Gateway Routing:** `GET /api/questions/*` routes to questions:3002

### Testing Questions Service

```bash
# Health check (through gateway)
curl http://localhost:3000/api/questions/health

# Get all questions
curl http://localhost:3000/api/questions | jq length

# Get random question
curl http://localhost:3000/api/questions/random | jq '.id'

# Get specific question
curl http://localhost:3000/api/questions/1 | jq '.question'
```

### Kubernetes Deployment

```bash
# Deploy questions service to K8s
./k8s/deploy.sh

# Verify deployment
kubectl get deployments -n node-learn | grep questions
kubectl logs -n node-learn deployment/questions

# Test in K8s
curl https://huvinas.myqnapcloud.com:61510/api/questions | jq length
```

### Architecture Notes

1. **Strangler Pattern:** Gateway routes `/api/questions/*` (GET only) to questions service
2. **Service Discovery:** Questions service resolves via DNS (`questions:3002` in Docker, `questions.node-learn.svc.cluster.local` in K8s)
3. **Path Handling:** Traefik strips `/api` prefix in K8s; gateway handles routing correctly
4. **Monolith Fallback:** Non-migrated endpoints still route to backend monolith

---

## Common Development Tasks

### View All Logs

```bash
# Follow all service logs with timestamps (recommended)
npm run logs

# Or manually with docker-compose
docker-compose logs -f --timestamps

# Follow specific service
docker-compose logs -f auth
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
docker-compose restart auth
docker-compose restart api-gateway
```

### Rebuild Microservices

```bash
# Rebuild auth after code changes
docker-compose build auth
docker-compose up -d auth

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
# Health check auth service (through gateway)
curl http://localhost:3000/api/auth/health

# Get user profile (requires JWT)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 2. Submit Answer (Still Routed to Monolith)

```bash
# This goes to monolith (not yet extracted)
curl -X POST "http://localhost:3000/api/stats/record" \
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
# - user.login event (when auth publishes it)
# - answer.submitted event (from monolith)
# - achievement.earned event (if conditions met)
# - leaderboard.entry.updated event
```

### 4. Verify Auth Service Events

```bash
# Watch auth service events specifically
nats sub 'user.*' --server=nats://localhost:4222

# Make a login request and watch for user.login events
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

---

## Phase 2 & 3 Integration Testing Checklist

Use this checklist to verify that Phase 2 (Auth) and Phase 3 (Questions) extractions are working correctly:

### Container Health Checks ✅
- [x] `docker-compose ps` shows all containers healthy (auth, questions, api-gateway, backend, nats, postgres, frontend)
- [x] `curl http://localhost:3001/auth/health` returns 200 (auth direct)
- [x] `curl http://localhost:3002/questions/health` returns 200 (questions direct)
- [x] `curl http://localhost:3000/api/auth/health` returns 200 (through gateway)
- [x] `curl http://localhost:3000/api/questions` returns questions array (through gateway)

### API Gateway Routing ✅
- [x] `curl http://localhost:3000/api/auth/health` → auth (3001)
- [x] `curl http://localhost:3000/api/questions` → questions (3002)
- [x] `curl http://localhost:3000/api/stats/user/123` → backend monolith (adds /api prefix)
- [x] `curl http://localhost:3000/api/achievements` → backend monolith
- [x] `curl http://localhost:3000/api/leaderboard/mode/1` → backend monolith
- [x] All requests include x-correlation-id header for tracing

### Event Publishing ✅
- [ ] Auth service connects to NATS on startup (check logs: "Connected to NATS")
- [ ] `nats sub 'user.*'` shows subscriptions active
- [ ] After login/authentication, `user.login` events appear in NATS stream
- [ ] Events contain proper metadata (id, timestamp, correlationId, serviceId)

### Service Communication ✅
- [x] Auth service can resolve `postgres:5432` (internal DNS)
- [x] Auth service can resolve `nats:4222` (internal DNS)
- [x] Auth service retrieves user data from PostgreSQL
- [x] Auth service publishes events to NATS broker
- [x] Questions service can resolve `postgres:5432` (internal DNS)
- [x] Questions service reads question data from PostgreSQL

### Error Handling ✅
- [x] Invalid auth requests return proper error responses
- [x] Invalid question IDs return 404 errors
- [x] Service logs show correlation IDs for debugging
- [x] Failed NATS connections don't crash the service
- [x] Gateway properly handles service timeouts

### Kubernetes Deployment ✅
- [x] `./k8s/deploy.sh` successfully builds and pushes auth & questions images
- [x] `kubectl get deployments -n node-learn` shows auth & questions running
- [x] Auth & Questions pods can reach PostgreSQL and NATS via K8s DNS
- [x] Health checks pass: `kubectl get pods -n node-learn`
- [x] Ingress routing configured: Traefik strips `/api`, gateway handles routing
- [x] Questions endpoint working: `curl https://huvinas.myqnapcloud.com:61510/api/questions`
- [x] Monolith fallback working: unmigrated services route to backend correctly
- [x] Ingress routing configured: Traefik strips `/api`, gateway handles routing
- [x] Questions endpoint working: `curl https://huvinas.myqnapcloud.com:61510/api/questions`
- [x] Monolith fallback working: unmigrated services route to backend correctly

---

## Debugging

### Check Service Health

```bash
# Gateway health
curl http://localhost:3000/health | jq

# Auth service health (through gateway)
curl http://localhost:3000/api/auth/health

# Individual service health (internal only)
docker exec node-learn-auth curl http://localhost:3001/auth/health
docker exec node-learn-backend curl http://localhost:3000/api/health
docker exec node-learn-api-gateway curl http://localhost:3000/health
docker exec node-learn-nats curl http://localhost:8222/healthz
```

### View Service Logs

```bash
# See why a service failed to start
docker-compose logs auth
docker-compose logs api-gateway
docker-compose logs backend
docker-compose logs postgres

# Real-time logs
docker-compose logs -f auth
```

### Execute Commands in Container

```bash
# Connect to auth
docker exec -it node-learn-auth sh

# Check environment variables
docker exec node-learn-auth env | grep -E "JWT|NATS"

# NATS CLI inside container
docker exec node-learn-nats nats sub '>'
```

### Test Service Directly (Bypass Gateway)

```bash
# Test auth service directly (port 3001)
curl http://localhost:3001/api/auth/health

# Test through gateway (port 3000)
curl http://localhost:3000/api/auth/health

# Test monolith directly
curl http://localhost:3000/api/questions
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
SELECT COUNT(*) FROM events WHERE service_id = 'quiz';
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
docker-compose logs quiz

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

### Phase 2 Completed ✅

- ✅ Auth Service extracted as standalone microservice
- ✅ API Gateway with strangler proxy pattern operational
- ✅ NATS event broker integrated
- ✅ Docker Compose orchestration working
- ✅ K8s deployment configured and deployed
- ✅ Event publishing (user.login events to NATS)
- ✅ Service health checks and logging

### Phase 3 Completed ✅

- ✅ Questions Service extracted as standalone microservice
- ✅ Gateway routing updated for questions endpoints
- ✅ Docker Compose configuration added
- ✅ K8s deployment configured and deployed (k8s/question-deployment.yaml)
- ✅ Read-only access to questions table
- ✅ Service discovery working in both Docker and K8s
- ✅ Path routing fixed (Traefik `/api` prefix handling)
- ✅ Monolith routing fixed (gateway adds `/api` prefix for backend)

### Phase 4: Extract Quiz Service (Planned)

```
Location: services/quiz/
Responsibility: POST /api/stats (answer submission)
Extraction Pattern: Saga orchestrator pattern
Gateway Routing: POST /api/stats → quiz:3003
Database: Shared PostgreSQL
Events: answer.submitted, answer.evaluated, achievement.checked
```

### Phase 5-6: Extract Achievement & Leaderboard Services

- Achievement Service: services/achievements/ (port 3004)
- Leaderboard Service: services/leaderboard/ (port 3005)

### Phase 7: Database Per Service

Once all services are extracted, migrate to independent databases:
- postgres-auth (auth)
- postgres-question (questions)
- postgres-quiz (quiz)
- postgres-achievement (achievements)
- postgres-leaderboard (leaderboard)
- postgres-event-store (shared by all for event sourcing)

See `MICROSERVICES_MIGRATION_PLAN.md` for full roadmap.

---

## Getting Help

- **Service Logs:** `npm run logs` or `docker-compose logs -f <service>`
- **Event Inspection:** `nats sub '>'` (watch NATS topics)
- **Database Queries:** `psql -h localhost -U postgres`
- **Gateway Routing:** Check `services/api-gateway/src/gateway.controller.ts`
- **Auth Service Code:** `services/auth/src/`
- **Full Guide:** This file (`MICROSERVICES_DEV_GUIDE.md`)
