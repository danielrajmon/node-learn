# Microservices

This directory contains all extracted microservices for the Node-Learn platform.

## Structure

```
services/
├── shared/                    # Shared libraries & utilities
│   ├── src/
│   │   ├── events/           # Event types & NATS service
│   │   └── ...
│   └── migrations/           # Database migrations (event store)
│
├── api-gateway/              # Strangler proxy & request router
│   ├── src/
│   │   ├── main.ts
│   │   ├── gateway.module.ts
│   │   ├── gateway.controller.ts
│   │   ├── gateway.service.ts
│   │   ├── middleware/       # Correlation ID, auth, etc.
│   │   └── strategies/       # JWT strategy
│   ├── Dockerfile
│   └── package.json
│
├── auth/                     # (Phase 2) OAuth + JWT
├── question-service/         # (Phase 3) Question CRUD
├── quiz-service/             # (Phase 4) Answer submission + saga orchestrator
├── achievement-service/      # (Phase 5) Badge system
├── leaderboard-service/      # (Phase 6) Rankings
├── admin-service/            # (Phase 7) Admin operations
└── maintenance-service/      # (Phase 8) Background jobs
```

## Phases

### ✅ Phase 1: Infrastructure Setup (COMPLETE)
- NATS message broker
- Event schema & types
- API Gateway (strangler proxy)
- Event store database schema
- Development guide & scripts

### 📋 Phase 2: Extract Auth Service
- Standalone NestJS app
- OAuth + JWT tokens
- Publishes: `user.created`, `user.authenticated`

### 📋 Phase 3: Extract Question Service
- Question retrieval & filtering
- Read-only initially
- Publishes: `question.created`, `question.updated`, `question.deleted`

### 📋 Phase 4: Extract Quiz Service
- Answer submission
- Stats tracking
- **Saga Orchestrator** (answer submission workflow)
- Publishes: `answer.submitted`

### 📋 Phase 5: Extract Achievement Service
- Achievement unlocking logic
- Listens to: `answer.submitted`
- Publishes: `achievement.earned`

### 📋 Phase 6: Extract Leaderboard Service
- Top performer rankings
- Listens to: `answer.submitted`
- Publishes: `leaderboard.entry.updated`

### 📋 Phase 7: Extract Admin Service
- Question CRUD
- Admin operations

### 📋 Phase 8: Extract Maintenance Service
- Cron jobs
- Guest user stats reset

## Technology Stack

- **Framework**: NestJS 11
- **Message Queue**: NATS
- **Database**: PostgreSQL (per-service pattern)
- **Language**: TypeScript
- **Testing**: Jest + Supertest
- **Deployment**: Docker + Kubernetes

## Local Development

See [MICROSERVICES_DEV_GUIDE.md](../MICROSERVICES_DEV_GUIDE.md) for detailed setup.

### Quick Start

```bash
# Start all services
./scripts/dev.sh up

# View logs
./scripts/dev.sh logs

# Check health
./scripts/dev.sh health

# Stop services
./scripts/dev.sh down
```

## Event-Driven Architecture

All services communicate via **NATS pub/sub** using a shared event schema:

```typescript
interface DomainEvent<T> {
  id: string;              // UUID
  type: EventType;         // 'answer.submitted', 'achievement.earned', etc.
  aggregateId: string;     // userId, questionId, etc.
  payload: T;              // Event-specific data
  timestamp: Date;
  correlationId: string;   // For tracing across services
  serviceId: string;       // Which service published this
}
```

## Saga Pattern

Complex workflows (like answer submission) use **saga orchestration**:

```
User submits answer
    ↓
[Quiz Service] Validates & records answer
    ↓
Publishes: answer.submitted
    ↓
[Achievement Service] Checks conditions
    ↓
Publishes: achievement.earned (if earned)
    ↓
[Leaderboard Service] Updates rankings
    ↓
Publishes: leaderboard.entry.updated
```

If any step fails, compensation logic triggers rollbacks.

## Database Strategy

### Now (Phase 1)
All services share the monolith database:
- `event_store` - Shared event log
- `node_learn_db` - Existing data

### Later (After Extraction)
Database per service:
- `event_store` - Shared (all services write events)
- `auth_db` - Auth Service
- `question_db` - Question Service
- `quiz_db` - Quiz Service
- `achievement_db` - Achievement Service
- `leaderboard_db` - Leaderboard Service

Data synchronization via events.

## Strangler Pattern

The **API Gateway** routes requests to appropriate services while maintaining backward compatibility:

```
Request → API Gateway → Route decision:
├─ GET /api/questions → Question Service (when ready)
├─ POST /api/stats → Quiz Service (when ready)
├─ GET /api/achievements → Achievement Service (when ready)
└─ Everything else → Monolith (fallback)
```

This allows gradual migration without downtime.

## Shared Libraries

### `services/shared/src/events/`
- Event types & interfaces
- NATS subject naming convention
- Event payload schemas

### `services/shared/src/nats/`
- `NatsService` - Connect, publish, subscribe
- Auto-metadata injection (timestamps, correlation IDs)
- Error handling

### `services/shared/migrations/`
- Event store schema
- Database setup scripts

## Environment Variables

Each service reads from `.env`:

```env
# NATS
NATS_URL=nats://localhost:4222

# Database (shared initially)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=node_learn_db
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Service
SERVICE_ID=auth
PORT=3001
NODE_ENV=development

# Auth
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Testing

Each service has unit & integration tests:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Monitoring & Debugging

### View Events in Real-Time
```bash
nats sub '>' --server=nats://localhost:4222
```

### Trace Specific Request
```bash
# All logs with correlation ID
docker-compose logs | grep "correlation-id-here"

# Query event store
SELECT * FROM events WHERE correlation_id = 'trace-id';
```

### Service Health
```bash
./scripts/dev.sh health
```

### View Service Logs
```bash
./scripts/dev.sh logs-service backend
./scripts/dev.sh logs-service api-gateway
```

## Next Phase

Ready to start **Phase 2: Auth Service**?

See [MICROSERVICES_MIGRATION_PLAN.md](../MICROSERVICES_MIGRATION_PLAN.md) for full roadmap.

---

**Questions?** See [MICROSERVICES_DEV_GUIDE.md](../MICROSERVICES_DEV_GUIDE.md) for detailed setup, testing, and troubleshooting.
