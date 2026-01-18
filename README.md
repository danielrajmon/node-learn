# Node-Learn

A full-stack **Node.js Interview Questions Learning Platform** built with NestJS backend, Angular frontend, and PostgreSQL database. Currently undergoing a **microservices migration** using event-driven architecture with NATS message broker.

## Overview

Node-Learn is a quiz platform where users can:
- Take quizzes on Node.js interview questions
- Track their progress and statistics
- Earn achievements and badges
- Compete on leaderboards
- Search and filter questions by topic, difficulty, and type

### Current Architecture

**Phase 1 Complete**: Infrastructure setup with:
- ✅ NATS message broker for event-driven communication
- ✅ API Gateway (strangler proxy) for safe migration
- ✅ Event sourcing foundation (event store database schema)
- ✅ Correlation ID tracing for observability

**Monolith Modules** (gradual extraction in progress):
- Question Management (CRUD, filtering, search)
- Answer Submission & Stats Tracking
- Authentication (Google OAuth + JWT)
- Achievement System (20+ badges)
- Leaderboard Rankings
- Admin Tools
- User Management

### Technology Stack

- **Backend**: NestJS 11 + TypeORM + PostgreSQL 16
- **Frontend**: Angular 21 (standalone components)
- **Message Queue**: NATS
- **Authentication**: Google OAuth 2.0 + JWT
- **Infrastructure**: Docker Compose (local), Kubernetes (production)
- **Testing**: Jest, Supertest

## Microservices Migration Plan

See [MICROSERVICES_MIGRATION_PLAN.md](MICROSERVICES_MIGRATION_PLAN.md) for detailed roadmap.

### Phases

1. **✅ Phase 1: Infrastructure Setup** (Complete)
   - NATS broker + JetStream configuration
   - Event type schema & types
   - API Gateway (strangler pattern)
   - Event store database

2. **📋 Phase 2: Auth Service** (Ready to start)
   - Extract OAuth + JWT logic
   - Publish user.created, user.authenticated events

3. **📋 Phase 3: Question Service** (Ready to start)
   - Extract question retrieval
   - Publish question.* events

4. **📋 Phase 4: Quiz Service** (Saga orchestrator)
   - Answer submission workflow
   - **Saga Pattern** for distributed transactions

5. **📋 Phase 5: Achievement Service**
   - Badge unlocking logic
   - Event-driven achievement checking

6. **📋 Phase 6: Leaderboard Service**
   - Top performer rankings
   - Event-driven updates

7. **📋 Phase 7: Admin Service**
   - Question curation & CRUD

8. **📋 Phase 8: Maintenance Service**
   - Background jobs & cron tasks

## Local Development

### Quick Start

```bash
# 1. Start all services
npm run start

# 2. Wait for health checks (30-60 seconds)
npm run health

# 3. Access endpoints (Phase 1 - Monolith + Infrastructure)
# - Frontend: http://localhost:4200
# - Backend API: http://localhost:3000
# - NATS Monitor: http://localhost:8222
# 
# Note: API Gateway deploys in Phase 2
```

### Dev Scripts

```bash
npm run dev              # Helper for service management
npm run logs            # Follow all service logs
npm run health          # Check service health
npm run stop            # Stop all services
npm run reset           # Wipe everything & rebuild
```

### Environment Setup

Create `.env.docker`:
```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=node_learn_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
NATS_URL=nats://localhost:4222
```

### Testing the Full Saga

```bash
# 1. Watch events in real-time
nats sub '>' --server=nats://localhost:4222

# 2. In another terminal, submit an answer
curl -X POST http://localhost:3000/api/stats/record \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"questionId": 1, "userAnswer": "callback"}'

# 3. Observe event flow:
# - answer.submitted
# - achievement.earned (if conditions met)
# - leaderboard.entry.updated
```

### Troubleshooting

See [MICROSERVICES_DEV_GUIDE.md](MICROSERVICES_DEV_GUIDE.md) for detailed debugging, testing, and common issues.

## Kubernetes Deployment

See [k8s/](k8s/) folder for production manifests.

```bash
# Deploy to K8s cluster
./k8s/deploy.sh

# Check status
kubectl get pods -n node-learn
kubectl logs -f deployment/backend -n node-learn
```

## API Documentation

Interactive API docs available at: `http://localhost:3000/api`

### Main Endpoints

**Questions**
- `GET /api/questions` - List questions with filters
- `GET /api/questions/:id` - Get question by ID
- `GET /api/questions/random` - Get random question

**Quiz**
- `POST /api/stats/record` - Submit answer
- `GET /api/stats/user` - User statistics
- `GET /api/stats/question/:id` - Question stats

**Achievements**
- `GET /api/achievements` - All achievements
- `GET /api/achievements/earned` - User's earned badges

**Leaderboard**
- `GET /api/leaderboard` - Global rankings
- `GET /api/leaderboard/quiz-modes/:id` - Mode-specific rankings

**Auth**
- `GET /api/auth/google` - OAuth login
- `GET /api/auth/me` - Current user

## Event-Driven Architecture

### Event Types

- `answer.submitted` - User submitted a quiz answer
- `achievement.earned` - User unlocked a badge
- `leaderboard.entry.updated` - Ranking changed
- `question.created|updated|deleted` - Question changes
- `user.created|authenticated` - User lifecycle

### Saga Pattern

Answer submission follows saga orchestration:
```
1. Quiz Service validates & records answer
   ↓
2. Publishes: answer.submitted event
   ↓
3. Achievement Service checks conditions
   ↓
4. Publishes: achievement.earned (if earned)
   ↓
5. Leaderboard Service updates rankings
   ↓
6. Publishes: leaderboard.entry.updated
```

If any step fails, compensation logic triggers rollbacks.

## Database Schema

### Core Tables

- `users` - User accounts (email, Google ID, admin flag)
- `questions` - Quiz questions with metadata
- `choices` - Answer options for questions
- `user_question_stats` - Per-user question performance
- `achievements` - Badge definitions
- `user_achievements` - Earned badges
- `quiz_modes` - Quiz configurations
- `leaderboards` - Top 6 performers per mode
- `events` - Event store (immutable audit trail)

## TODOs

### Core Features
- [ ] Complete Phase 2-8 microservices extraction
- [ ] Add unit/integration/e2e tests
- [ ] Improve search performance with full-text indexing
- [ ] Add Redis caching for frequently accessed data
- [ ] Implement admin dashboard

### UI/UX
- [ ] Responsive design (desktop/tablet/mobile)
- [ ] Improve home page content
- [ ] Don't re-show correct answers in text questions
- [ ] Make code examples foldable
- [ ] Dark mode support

### Data & Analytics
- [ ] Database export/import page
- [ ] Admin tools for data migration
- [ ] User analytics dashboard
- [ ] Performance metrics

### Documentation
- [ ] Architectural decision records (ADRs)
- [ ] API design patterns
- [ ] Deployment troubleshooting guide
- [ ] Performance tuning guide

## Ideas for Features

### User Experience
- Move user administration to separate page
- Hide Admin page in header for non-admin users
- Add learning paths/curated question sequences
- Implement spaced repetition recommendations

### Achievements
- "Unlucky" - Get all answers wrong in a quiz
- "Perfect Score" - Answer all quiz questions correctly
- "Comeback" - Get wrong answer, then correct within 3 questions
- "Speed Runner" - Complete quiz in under 5 minutes
- "Master" - 100% accuracy on all Node.js advanced questions

### Advanced Features
- [ ] Question explanations with code examples
- [ ] User-generated questions (with review workflow)
- [ ] Question difficulty calibration
- [ ] Study group collaboration
- [ ] Timed challenges & tournaments

## Questions to Add

- Angular service vs controller vs module
- Observables / RxJS
- What is a DTO in NestJS?
- NestJS features & decorators
- When is choreography better than orchestration?
- Redis (caching, sessions, pub/sub)
- Database indexes (B-tree, Hash, Full-text)
- SQL joins (LEFT, RIGHT, INNER, OUTER, CROSS)
- Design patterns with lifelike code examples
- Event sourcing vs snapshots
- Distributed tracing & observability
- Circuit breaker pattern
- Retry & backoff strategies
- Strangler pattern (API Gateway & monolith migration)

## Project Structure

```
node-learn/
├── backend/                   # Monolith (gradual deprecation)
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── achievements/
│   │   ├── admin/
│   │   ├── answer/
│   │   ├── auth/
│   │   ├── leaderboard/
│   │   ├── maintenance/
│   │   ├── question/
│   │   ├── quiz/
│   │   └── stats/
│   └── Dockerfile
├── frontend/                  # Angular app
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   └── styles/
│   └── Dockerfile
├── services/                  # Microservices (Phase 2+)
│   ├── shared/               # Shared libraries
│   │   ├── src/events/       # Event types
│   │   ├── src/nats/         # NATS service
│   │   └── migrations/       # Event store schema
│   ├── api-gateway/          # Strangler proxy
│   ├── auth-service/         # (Phase 2)
│   ├── question-service/     # (Phase 3)
│   ├── quiz-service/         # (Phase 4)
│   ├── achievement-service/  # (Phase 5)
│   ├── leaderboard-service/  # (Phase 6)
│   ├── admin-service/        # (Phase 7)
│   └── maintenance-service/  # (Phase 8)
├── k8s/                       # Kubernetes manifests
│   ├── namespace.yaml
│   ├── postgres-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── ingress.yaml
│   └── deploy.sh
├── scripts/
│   └── dev.sh                # Development helper
├── MICROSERVICES_MIGRATION_PLAN.md
├── MICROSERVICES_DEV_GUIDE.md
├── PHASE_1_COMPLETE.md
├── docker-compose.yml
└── README.md
```

## Contributing

1. Read [MICROSERVICES_MIGRATION_PLAN.md](MICROSERVICES_MIGRATION_PLAN.md)
2. Follow the phase-by-phase extraction pattern
3. Add unit tests for new services
4. Document event contracts
5. Test saga workflows locally first

## Performance Targets

- Answer submission: < 200ms (synchronous + async saga)
- Achievement check: < 5s timeout (NATS RPC)
- Leaderboard query: < 100ms
- Question search: < 500ms (with caching)
- Page load: < 2s (frontend + API)

## Security

- Google OAuth 2.0 for authentication
- JWT tokens with expiration
- Admin role-based access control
- SQL injection prevention (TypeORM parameterized queries)
- CORS protection
- HTTPS recommended for production

## License

ISC

## Author

danielrajmon

## Resources

- [MICROSERVICES_MIGRATION_PLAN.md](MICROSERVICES_MIGRATION_PLAN.md) - Full roadmap
- [MICROSERVICES_DEV_GUIDE.md](MICROSERVICES_DEV_GUIDE.md) - Local development
- [PHASE_1_COMPLETE.md](PHASE_1_COMPLETE.md) - Infrastructure summary
- [services/README.md](services/README.md) - Microservices overview
- [NATS Documentation](https://docs.nats.io/)
- [NestJS Docs](https://docs.nestjs.com/)
