# Node-Learn Microservices Migration Plan

**Status:** Planning  
**Last Updated:** January 18, 2026

---

## Executive Summary

Convert the monolithic NestJS backend into event-driven microservices using:
- **Message Queue:** NATS for async communication
- **Transaction Pattern:** Saga pattern with orchestration for distributed workflows
- **Deployment:** Kubernetes (existing k8s/ folder) + Docker Compose for local dev
- **Database:** Database-per-service with event sourcing for consistency

---

## Architecture Overview

### Current State (Monolith)
```
Single Backend (NestJS + TypeORM + PostgreSQL)
├── Question Module
├── Answer Module
├── Auth Module
├── Stats Module
├── Achievements Module
├── Quiz Module
├── Leaderboard Module
├── Admin Module
└── Maintenance Module
```

### Target State (Microservices)
```
API Gateway / Strangler Proxy
├── Auth Service (OAuth + JWT)
├── Question Service (CRUD, read-heavy)
├── Quiz Service (Orchestrator - saga pattern)
├── Achievement Service (Event listener)
├── Leaderboard Service (Event listener)
├── Admin Service (Question curation)
└── Maintenance Service (Background jobs)

Message Bus (NATS)
├── answer.submitted
├── achievement.earned
├── leaderboard.entry.updated
├── question.created
├── question.updated
└── question.deleted

Databases (One per Service + Shared Event Log)
├── auth_db
├── question_db
├── quiz_db
├── achievement_db
├── leaderboard_db
└── event_store (shared event log)
```

---

## Migration Phases

### Phase 1: Infrastructure Setup

**Goal:** Establish foundation for all services to communicate

#### 1.1 NATS Setup
- [ ] Add NATS Docker container to docker-compose.yml
- [ ] Create NATS configuration file (nats.conf)
- [ ] Add NATS client packages to backend monolith
- [ ] Create shared event types/schema (src/events/types.ts)
- [ ] Document NATS topics/subjects:
  ```
  answer.submitted
  achievement.earned
  achievement.unlocked
  leaderboard.entry.updated
  question.created
  question.updated
  question.deleted
  user.created
  user.stats.reset
  ```

#### 1.2 API Gateway / Strangler Proxy
- [ ] Create new service folder: `backend-gateway/`
- [ ] Implement request routing based on path
- [ ] Routes initially point to monolith (fallback)
- [ ] Gradually update routes to point to new services
- [ ] Add request tracing headers (X-Trace-ID)

#### 1.3 Observability & Logging
- [ ] Add Winston logger shared across all services
- [ ] Implement correlation IDs for request tracing
- [ ] Set up structured logging format (JSON)
- [ ] Document logging patterns

#### 1.4 Event Store & Schema
- [ ] Create event sourcing database schema
- [ ] Implement EventStore service (base for all services)
- [ ] Events table: `id, type, payload, timestamp, service_id, correlation_id`
- [ ] Add event versioning strategy

#### 1.5 Documentation
- [ ] Create MICROSERVICES_DEV_GUIDE.md (setup & deployment)
- [ ] Document event contract for each service
- [ ] Create deployment checklist

---

### Phase 2: Extract Auth Service

**Goal:** Prove service extraction patterns with low-risk service

**Why first:** No dependencies on other modules, pure identity service

#### 2.1 Create Auth Service
- [ ] Create new folder: `services/auth-service/`
- [ ] Copy Auth module from monolith
- [ ] Migrate to standalone NestJS app
- [ ] Dependencies:
  - PostgreSQL (new auth_db)
  - NATS client
  - Google OAuth library (existing)

#### 2.2 Database Migration
- [ ] Create auth_db schema with users table
- [ ] Migrate user data from monolith to auth_db
- [ ] Implement user creation event listener (for future services)
- [ ] Keep user sync logic from monolith temporarily

#### 2.3 Events
- [ ] Publish: `user.created`, `user.authenticated`
- [ ] No subscribers (for now - other services not extracted yet)

#### 2.4 Testing & Deployment
- [ ] Write integration tests (Jest + Supertest)
- [ ] Create Dockerfile for auth-service
- [ ] Add to docker-compose.yml
- [ ] Test OAuth flow end-to-end
- [ ] Document how to run locally

#### 2.5 Strangler Routing
- [ ] Update API Gateway to route `/api/auth/*` → Auth Service
- [ ] Keep `/api/auth/*` → Monolith as fallback
- [ ] Test dual-running (requests hit both, compare responses)

---

### Phase 3: Extract Question Service

**Goal:** Extract read-heavy, mostly independent service

**Why second:** Admin CRUD still in monolith, but question retrieval is isolated

#### 3.1 Create Question Service
- [ ] Create folder: `services/question-service/`
- [ ] Move Question + Choice entities
- [ ] NestJS app with TypeORM

#### 3.2 Database Setup
- [ ] Create question_db schema
- [ ] Migrate questions + choices from monolith
- [ ] Read-only initially (admin still uses monolith)

#### 3.3 Events
- [ ] Publish: `question.created`, `question.updated`, `question.deleted`
- [ ] Subscribe: None yet

#### 3.4 API Endpoints
- [ ] `GET /questions` (list with filters)
- [ ] `GET /questions/:id`
- [ ] `GET /questions/random`
- [ ] `POST /admin/questions` (routes to monolith still)

#### 3.5 Strangler Routing
- [ ] Route `/api/questions/*` (GET) → Question Service
- [ ] Route `/api/admin/questions/*` (POST/PUT/DELETE) → Monolith

---

### Phase 4: Extract Quiz & Stats Service

**Goal:** First stateful, event-driven service

**Why:** Needs to trigger achievements, uses saga pattern

#### 4.1 Create Quiz Service (Saga Orchestrator)
- [ ] Create folder: `services/quiz-service/`
- [ ] Move Answer + Stats logic from monolith
- [ ] Implements saga orchestrator pattern

#### 4.2 Database Setup
- [ ] Create quiz_db schema
- [ ] Tables: user_question_stats, quiz_modes
- [ ] Migrate data from monolith

#### 4.3 Saga: Answer Submission Workflow
```
User submits answer
    ↓
[Quiz Service] Validates answer
    ↓
[Quiz Service] Records stat (correct/incorrect)
    ↓
[Quiz Service] Publishes: answer.submitted {userId, questionId, isCorrect, ...}
    ↓
[Quiz Service] Awaits compensation handler
    ↓
Achievement Service Processes (next phase)
```

**Timeout:** 5 seconds for saga completion
**Compensation:** Rollback stats if achievement fails (rare)

#### 4.4 Events
- [ ] Publish: `answer.submitted {userId, questionId, isCorrect, streak, ...}`
- [ ] Subscribe: `achievement.earned` (for compensating on failure)

#### 4.5 Testing
- [ ] Test saga happy path (answer → event published)
- [ ] Test saga timeout & rollback
- [ ] Load testing with concurrent answers

#### 4.6 Strangler Routing
- [ ] Route `/api/stats/*` → Quiz Service
- [ ] Route `/api/answer/*` → Quiz Service (some endpoints monolith)

---

### Phase 5: Extract Achievement Service

**Goal:** Event-driven service with complex business logic

**Why:** Depends on Quiz Service events, triggers leaderboard updates

#### 5.1 Create Achievement Service
- [ ] Create folder: `services/achievement-service/`
- [ ] Move achievement logic from monolith
- [ ] Business rules: 20+ badge conditions (see backend/src/achievements/)

#### 5.2 Database Setup
- [ ] Create achievement_db schema
- [ ] Tables: achievements, user_achievements
- [ ] Migrate static achievement definitions

#### 5.3 Event-Driven Logic
- [ ] Subscribe to: `answer.submitted`
- [ ] Check all 20+ achievement conditions
- [ ] If earned: `achievement.earned {userId, achievementId, ...}`
- [ ] Publish: `achievement.earned`

#### 5.4 Saga Response Pattern
```
[Quiz Service] Publishes: answer.submitted
    ↓
[Achievement Service] Processes (async)
    ↓
Achievement Service Checks conditions
    ↓
If earned: Publishes achievement.earned
If failed: Publish achievement.check_failed (for saga rollback)
    ↓
[Quiz Service] Saga completes (timeout if no response in 5s)
```

#### 5.5 Testing
- [ ] Unit tests for each achievement condition
- [ ] Integration tests: answer.submitted → achievement.earned
- [ ] Edge cases: multiple achievements unlocked in one answer

#### 5.6 Strangler Routing
- [ ] Route `/api/achievements/*` (GET) → Achievement Service
- [ ] Route `/api/admin/achievements/*` → Monolith (for now)

---

### Phase 6: Extract Leaderboard Service

**Goal:** Event-driven service dependent on Quiz + Achievement events

#### 6.1 Create Leaderboard Service
- [ ] Create folder: `services/leaderboard-service/`
- [ ] Move leaderboard logic from monolith

#### 6.2 Database Setup
- [ ] Create leaderboard_db schema
- [ ] Table: leaderboards (top 6 per quiz mode)

#### 6.3 Event Subscriptions
- [ ] Subscribe: `answer.submitted` (update scores)
- [ ] Subscribe: `achievement.earned` (award bonus points, optional)

#### 6.4 Leaderboard Update Logic
```
[Quiz Service] Publishes: answer.submitted {userId, isCorrect, streak, ...}
    ↓
[Leaderboard Service] Processes
    ↓
Update user score for quiz mode
    ↓
Recompute top 6
    ↓
Publish: leaderboard.entry.updated {position, userId, score, ...}
```

#### 6.5 Testing
- [ ] Concurrent score updates for same quiz mode
- [ ] Top 6 ordering correctness
- [ ] Streak calculations

---

### Phase 7: Extract Admin Service

**Goal:** Admin-only CRUD operations as separate service

#### 7.1 Create Admin Service
- [ ] Create folder: `services/admin-service/`
- [ ] Move admin controller/service

#### 7.2 Database Access
- [ ] Read from question_db (reference)
- [ ] Write operations go through event publishing
- [ ] Question Service listens & updates its own db

#### 7.3 Events
- [ ] Publish: `question.created`, `question.updated`, `question.deleted`
- [ ] Subscriptions: question service confirms via event

#### 7.4 Testing & Deployment
- [ ] Test admin CRUD operations
- [ ] Verify events propagate to Question Service
- [ ] Admin role verification (JWT claims)

---

### Phase 8: Maintenance & Cutover

#### 8.1 Extract Maintenance Service
- [ ] Create folder: `services/maintenance-service/`
- [ ] NATS trigger for cron jobs
- [ ] Guest user stats reset

#### 8.2 Integration Testing
- [ ] Full workflow: user login → answer quiz → earn achievement → update leaderboard
- [ ] Event flow verification with event store
- [ ] Load testing (concurrent users)

#### 8.3 Deprecate Monolith
- [ ] Gradual traffic shift to new services
- [ ] Monitor errors & latency
- [ ] Rollback runbooks prepared

#### 8.4 Cutover
- [ ] API Gateway removes monolith fallback routes
- [ ] Monolith runs in read-only or offline mode
- [ ] Data migration verification

---

## Technical Implementation Details

### Event Schema (NATS Topics)

```typescript
// src/events/types.ts

export type EventType =
  | 'answer.submitted'
  | 'achievement.earned'
  | 'achievement.check_failed'
  | 'leaderboard.entry.updated'
  | 'question.created'
  | 'question.updated'
  | 'question.deleted'
  | 'user.created'
  | 'user.stats.reset';

export interface DomainEvent<T = any> {
  id: string; // UUID
  type: EventType;
  aggregateId: string; // userId, questionId, etc.
  payload: T;
  timestamp: Date;
  version: number; // for event versioning
  correlationId: string; // for tracing
  serviceId: string; // which service published
}

// Example payloads
export interface AnswerSubmittedEvent {
  userId: string;
  questionId: string;
  isCorrect: boolean;
  streak: number;
  quizModeId: string;
  timestamp: Date;
}

export interface AchievementEarnedEvent {
  userId: string;
  achievementId: string;
  earnedAt: Date;
}
```

### Saga Orchestrator Pattern (Quiz Service)

```typescript
// services/quiz-service/src/sagas/answer-submission.saga.ts

@Injectable()
export class AnswerSubmissionSaga {
  constructor(
    private natsService: NatsService,
    private statsService: StatsService,
  ) {}

  async handleAnswerSubmission(
    userId: string,
    questionId: string,
    userAnswer: string,
  ): Promise<void> {
    const correlationId = uuid();

    try {
      // Step 1: Record answer & stats
      const { isCorrect, streak } = await this.statsService.recordAnswer(
        userId,
        questionId,
        userAnswer,
      );

      // Step 2: Publish event
      await this.natsService.publish('answer.submitted', {
        id: uuid(),
        type: 'answer.submitted',
        aggregateId: userId,
        payload: { userId, questionId, isCorrect, streak, correlationId },
        timestamp: new Date(),
        version: 1,
        correlationId,
        serviceId: 'quiz-service',
      });

      // Step 3: Wait for compensation (timeout 5s)
      const compensationEvent = await this.waitForCompensation(
        correlationId,
        5000,
      );
      if (compensationEvent?.type === 'achievement.check_failed') {
        // Rollback stats if needed
        await this.statsService.rollbackAnswer(userId, questionId);
        throw new Error('Achievement processing failed, rolling back stats');
      }
    } catch (error) {
      // Log & notify
      await this.natsService.publish('answer_submission.failed', {
        correlationId,
        error: error.message,
      });
      throw error;
    }
  }

  private waitForCompensation(
    correlationId: string,
    timeoutMs: number,
  ): Promise<DomainEvent | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), timeoutMs);
      this.natsService.subscribe(`compensation.${correlationId}`, (msg) => {
        clearTimeout(timeout);
        resolve(msg.data);
      });
    });
  }
}
```

### Database-Per-Service Pattern

Each service gets its own database + connection string in `.env`:

```env
# Auth Service
AUTH_DB_HOST=localhost
AUTH_DB_PORT=5432
AUTH_DB_NAME=auth_db
AUTH_DB_USER=auth_user

# Question Service
QUESTION_DB_HOST=localhost
QUESTION_DB_PORT=5432
QUESTION_DB_NAME=question_db
QUESTION_DB_USER=question_user

# Quiz Service
QUIZ_DB_HOST=localhost
QUIZ_DB_PORT=5432
QUIZ_DB_NAME=quiz_db
QUIZ_DB_USER=quiz_user

# Event Store (Shared)
EVENT_STORE_DB_HOST=localhost
EVENT_STORE_DB_PORT=5432
EVENT_STORE_DB_NAME=event_store

# NATS
NATS_URL=nats://localhost:4222
```

### Deployment Structure

```
backend/                          # Keep monolith here during migration
  └── (gradual deprecation)

services/                         # New microservices
  ├── api-gateway/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── auth-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── question-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── quiz-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── achievement-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── leaderboard-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  ├── admin-service/
  │   ├── src/
  │   ├── Dockerfile
  │   └── package.json
  └── maintenance-service/
      ├── src/
      ├── Dockerfile
      └── package.json

docker-compose.yml                # Updated with all services + NATS
k8s/                              # Updated manifests
  ├── nats-deployment.yaml
  ├── api-gateway-deployment.yaml
  ├── auth-service-deployment.yaml
  └── ... (one per service)
```

---

## Rollback & Risk Mitigation

### Strangler Pattern Safety
- **Monolith stays running** until service maturity proven
- **API Gateway routes** can be reverted instantly
- **Feature flags** control traffic percentage per service
- **Dead-letter queues** capture failed events for replay

### Monitoring Checklist
- [ ] Event processing latency (P50, P95, P99)
- [ ] NATS broker health & message throughput
- [ ] Database replication lag (if sync needed)
- [ ] Service restart/crash recovery
- [ ] Compensation trigger rate (should be rare)

### Runbooks to Prepare
1. **Service X crashed** → restart + replay events from event store
2. **NATS broker down** → failover to backup broker
3. **Saga timeout** → manual intervention to check state
4. **Data inconsistency** → event store audit trail for diagnosis

---

## Success Criteria

- [ ] Each service can be deployed independently
- [ ] Event flow traced end-to-end (user answer → leaderboard update)
- [ ] <5s p99 latency for answer submission saga
- [ ] Zero message loss (persisted event store)
- [ ] Rollback from any service without monolith intervention
- [ ] Team can debug & deploy new services independently

---

## Resources & References

- [NATS Documentation](https://docs.nats.io/)
- [NestJS NATS Client](https://docs.nestjs.com/microservices/nats)
- [Saga Pattern (Chris Richardson)](https://microservices.io/patterns/data/saga.html)
- [Event Sourcing (Martin Fowler)](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Database per Service (Newman/Fowler)](https://microservices.io/patterns/data/database-per-service.html)

---

## Checklist Template (Copy for Each Phase)

```markdown
### Phase X: Service Name

**Status:** Not Started

- [ ] Database schema created & migrated
- [ ] Service folder scaffolded
- [ ] Dependencies installed & configured
- [ ] Core business logic extracted
- [ ] Events defined & publishing
- [ ] Integration tests written
- [ ] Dockerfile created
- [ ] docker-compose.yml updated
- [ ] API Gateway routing configured
- [ ] End-to-end test passed
- [ ] Deployed to staging
- [ ] Performance baseline established
- [ ] PR reviewed & merged
- [ ] Ready for next phase
```

---

**Questions?** Reference this plan, run one phase at a time, and update status as you go. Happy migrating! 🚀
