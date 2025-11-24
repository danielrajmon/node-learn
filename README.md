# Node-learn

A NestJS-based learning platform for Node.js interview questions, delivered through Angular and later React frontends.

## Overview

The first phase focuses exclusively on a single **QuestionModule** that loads all questions from a local JSON file and exposes simple read-only endpoints. Basic filtering (search, difficulty, tags, topics) is supported, and the API is documented via OpenAPI/Swagger.

No authentication, user data, or database is included at this stage—just a clean, minimal backend designed so it can later be swapped to PostgreSQL with TypeORM without changing the API.

Additional phases will expand the system with persistence, authentication, user progress, admin tools, search, analytics, and eventually microservices using NATS.

---

## Milestone Checklist

### Phase 1 – QuestionModule MVP (JSON only)

- [x] Init NestJS app (AppModule + QuestionModule)
- [x] Add questions.json with initial data
- [x] Implement read-only API:
  - `GET /questions`
  - `GET /questions/:id`
  - `GET /questions/random`
- [x] Add simple filtering:
  - `?search=`, `?difficulty=`, `?topic=`, `?tag=`
- [x] Enable Swagger/OpenAPI
- [ ] (Optional) Simple Angular app:
  - List questions
  - Show question details

---

### Phase 2 – Database & Persistence (Postgres + TypeORM)

- [ ] Add Docker/Postgres (or local Postgres)
- [ ] Configure TypeORM in Nest
- [ ] Create QuestionEntity + migrations
- [ ] Replace JSON loader with DB-backed repository
- [ ] Seed DB from questions.json (one-time script or migration)
- [ ] Ensure all existing endpoints still work:
  - `/questions`
  - `/questions/:id`
  - `/questions/random`
- [ ] Extend filters using real queries (difficulty, tags, topics)

---

### Phase 3 – Users, Auth, Practice Flows

- [ ] Add AuthModule (JWT)
- [ ] Add UserModule (profiles, basic user data)
- [ ] Protect admin endpoints (later from AdminModule)
- [ ] Add PracticeModule:
  - Start "session" with certain filters
  - Serve series of questions
- [ ] Add ProgressModule:
  - Track which questions a user has seen / mastered
- [ ] Angular frontend:
  - Login / logout
  - Question list + filters
  - Simple practice view

---

### Phase 4 – Stats, Search, React Frontend

- [ ] Add StatsModule:
  - Log question views, answers, session data
  - Expose basic stats endpoints
- [ ] Add SearchModule:
  - Full-text search using Postgres
- [ ] Add RecommendationModule (optional rule-based suggestions)
- [ ] React frontend:
  - Consume same Nest API
  - Implement core flows (list, details, practice)
- [ ] Improve OpenAPI docs:
  - Group endpoints by module
  - Add proper models and examples

---

### Phase 5 – Microservices & NATS

- [ ] Introduce NATS message broker
- [ ] Extract StatsModule into stats-service:
  - Main API publishes events (e.g. `question.viewed`)
  - Stats service consumes events and stores stats
- [ ] (Optional) Extract:
  - NotificationService (email / in-app messages)
  - SearchService with dedicated search engine
- [ ] Turn main Nest app into API Gateway/BFF:
  - HTTP in
  - NATS/HTTP/gRPC to services

---

### Phase 6 – DevOps, Testing, Quality

- [ ] Dockerize:
  - API
  - Frontends
  - Databases
  - NATS
- [ ] Add Jest tests:
  - Unit tests for services
  - Integration tests for API
- [ ] Add basic E2E tests
- [ ] GitHub Actions:
  - Lint
  - Test
  - Build
- [ ] Config & security:
  - `@nestjs/config`, env files
  - CORS config
  - Rate limiting / basic hardening (later)
