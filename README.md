# Node-Learn

A full-stack **Node.js Interview Questions Learning Platform** built with NestJS backend, Angular frontend, and PostgreSQL database.

## Overview

Node-Learn is a quiz platform where users can:
- Take quizzes on Node.js interview questions
- Track their progress and statistics
- Earn achievements and badges
- Compete on leaderboards
- Search and filter questions by topic, difficulty, and type

## Architecture Overview

## Service Architecture

```mermaid
graph TB
	Client[Frontend SPA]
	Gateway[API Gateway :3000]
    
	Client -->|HTTP| Gateway
    
	Gateway -->|/auth| Auth[Auth Service :3001]
	Gateway -->|/questions| Questions[Questions Service :3002]
	Gateway -->|/quiz,/answers,/stats| Quiz[Quiz Service :3003]
	Gateway -->|/achievements| Achievements[Achievements Service :3004]
	Gateway -->|/leaderboard| Leaderboard[Leaderboard Service :3005]
	Gateway -->|/admin| Admin[Admin Service :3007]
    
	Auth -.->|auth DB| PG[(PostgreSQL)]
	Questions -.->|questions DB| PG
	Quiz -.->|quiz DB| PG
	Achievements -.->|achievements DB| PG
	Leaderboard -.->|leaderboard DB| PG
	Admin -.->|admin DB| PG
	Maintenance -.->|migrations| PG
    
	Quiz -->|publish events| NATS[NATS :4222]
	Achievements -->|subscribe/publish| NATS
	Leaderboard -->|subscribe| NATS
```

## Event Flow

```mermaid
sequenceDiagram
	participant F as Frontend
	participant G as API Gateway
	participant Q as Quiz Service
	participant N as NATS
	participant A as Achievements
	participant L as Leaderboard
    
	F->>G: POST /api/quiz/answer
	G->>Q: Forward request
	Q->>Q: Record stats in quiz DB
	Q->>N: Publish answer.submitted<br/>(with question metadata)
	Q-->>G: 201 success
	G-->>F: Response
    
	F->>G: POST /api/achievements/check
	G->>A: Forward request
	A->>A: Update projection
	A->>A: Check unlocks
	A-->>G: Return awarded achievements
	G-->>F: Display toasts
    
	N->>A: Consume answer.submitted
	A->>A: Upsert projection table
	A->>A: Check unlock conditions
	A->>N: Publish achievement.unlocked

	N->>L: Consume answer.submitted
	L->>L: Update rankings
```

## Database Schema

```mermaid
erDiagram
	QUESTIONS ||--o{ CHOICES : has
	QUESTIONS {
		int id PK
		varchar question_type
		boolean practical
		text question
		text answer
		text quiz
		text[] match_keywords
		varchar difficulty
		varchar topic
		boolean is_active
		timestamp created_at
		timestamp updated_at
	}
	CHOICES {
		int id PK
		int question_id FK
		text choice_text
		boolean is_good
		text explanation
	}
    
	USER_QUESTION_STATS {
		bigint user_id PK
		bigint question_id PK
		int correct_count
		int incorrect_count
	}
    
	ACHIEVEMENT_USER_QUESTION_STATS {
		varchar user_id PK
		bigint question_id PK
		varchar question_type
		boolean practical
		varchar difficulty
		int correct_count
		int incorrect_count
		timestamp last_answered_at
	}
    
	ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : unlocked
	ACHIEVEMENTS {
		int id PK
		varchar title
		text description
		int sprite_col
		int sprite_row
	}
	USER_ACHIEVEMENTS {
		int id PK
		varchar user_id
		int achievement_id FK
		timestamp unlocked_at
	}
```

## Services

| Service | Port | Purpose | DB |
|---------|------|---------|-----|
| frontend | 80/4200 | Angular SPA | - |
| api-gateway | 3000 | Routes /api/* to services | - |
| auth | 3001 | OAuth, JWT tokens | auth |
| questions | 3002 | Question/choice CRUD (read-only via API) | questions |
| quiz | 3003 | Answer submission, stats, quiz modes | quiz |
| achievements | 3004 | Achievement unlock checks, user progress | achievements |
| leaderboard | 3005 | Leaderboard rankings | leaderboard |
| admin | 3007 | Admin panel: question/user CRUD | admin |
| maintenance | 3010 | Schema migrations | all DBs |
| nats | 4222 | Event broker | - |
| postgres | 5432 | PostgreSQL server | multiple DBs |

## REST Endpoints

### api-gateway (proxies to services)
- `GET /api/health` → api-gateway
- `GET /api/auth/health` → auth
- `GET /api/auth/google` → auth
- `GET /api/auth/google/callback` → auth
- `GET /api/auth/profile` → auth
- `GET /api/questions/health` → questions
- `GET /api/questions` → questions
- `GET /api/questions/:id` → questions
- `GET /api/questions/random` → questions
- `GET /api/questions/:id/answer` → questions
- `GET /api/quiz/health` → quiz
- `GET /api/quiz/modes` → quiz
- `POST /api/quiz/answer` → quiz
- `POST /api/quiz/stats/record` → quiz
- `GET /api/answers/:questionId` → quiz (returns correct answer)
- `GET /api/stats/user/:userId` → quiz
- `GET /api/stats/user/:userId/wrong-questions` → quiz
- `POST /api/stats/record` → quiz
- `GET /api/achievements/health` → achievements
- `GET /api/achievements` → achievements
- `GET /api/achievements/user/:userId` → achievements
- `GET /api/achievements/:id` → achievements
- `POST /api/achievements/check` → achievements (sync unlock)
- `GET /api/leaderboard/health` → leaderboard
- `POST /api/leaderboard/update` → leaderboard
- `GET /api/leaderboard/mode/:modeId` → leaderboard
- `GET /api/leaderboard/user/:userId` → leaderboard
- `GET /api/admin/health` → admin
- `GET /api/admin/users` → admin
- `PUT /api/admin/users/:id/role` → admin
- `GET /api/admin/questions` → admin
- `GET /api/admin/questions/:id` → admin
- `GET /api/admin/questions/export` → admin
- `POST /api/admin/questions` → admin
- `PUT /api/admin/questions/:id` → admin
- `DELETE /api/admin/questions/:id` → admin
- `POST /api/admin/questions/import` → admin

Note: In K8s, OAuth routes may bypass the gateway via ingress, so the `/api` prefix is not always used for auth endpoints.

## NATS Events

### Published by quiz service
- `answer.submitted` — payload: `{ userId, questionId, selectedChoiceId, quizModeId, isCorrect, questionType, practical, difficulty, timestamp, correlationId }`
- `achievement.check` — payload: `{ userId, questionId, quizModeId, correlationId }`
- `leaderboard.update` — payload: `{ userId, quizModeId, correlationId }`
- `answer.submission.failed` — payload: `{ userId, questionId, error, correlationId }`

### Published by achievements service
- `achievement.unlocked` — payload: `{ userId, achievementId, achievementTitle }`

### Published by auth service
- `user.login` — payload: `{ userId, googleId, email, name, isAdmin, provider }`

### Published by admin service
- `question.created` — payload: `{ correlationId, timestamp, data }`
- `question.updated` — payload: `{ correlationId, timestamp, data }`
- `question.deleted` — payload: `{ correlationId, timestamp, data }`
- `user.role.updated` — payload: `{ correlationId, timestamp, data }`

### Consumed by achievements service
- `answer.submitted` → updates `achievement_user_question_stats` projection, runs unlock checks, publishes `achievement.unlocked` events

### Consumed by leaderboard service
- `answer.submitted` → updates rankings
- `user.login` → syncs user profile

## Cross-DB Access

**Maintenance service**:
- Runs schema migrations and table checks across all databases

## Event-Driven Flows

### Answer Submission Flow
1. Frontend → POST /api/quiz/answer
2. Quiz service records stats in quiz.user_question_stats
3. Quiz publishes `answer.submitted` (with question metadata)
4. Achievements consumes event → upserts `achievement_user_question_stats` → checks unlocks → publishes `achievement.unlocked`
5. Leaderboard consumes `leaderboard.update` → updates rankings

### Synchronous Achievement Check (for UI toast)
1. Frontend → POST /api/achievements/check (after answer submission)
2. Achievements updates projection, checks unlocks, returns awarded achievements
3. Frontend displays toast notifications

## Notes

- Achievements projection (`achievement_user_question_stats`) removes cross-DB dependency by maintaining local stats from events
- Admin manages questions through questions service endpoints
- Quiz reads question metadata/answers through questions service endpoints
- All runtime services use a single DB; only maintenance performs cross-DB operations

## Configuring

Copy .env.example to .env and fill in required values:
```bash
cp .env.example .env
```

## Installing dependencies

```bash
npm run install:all
```

## Building docker images

```bash
npm run build:all
```

## Starting in development mode

Run backend services (Docker) and frontend dev server together:
```bash
Cmd+Shift+B  →  Select "Dev: All Services"
```

This starts:
- **Backend:** Docker services (PostgreSQL, NATS, microservices) with hot reload
- **Frontend:** Angular dev server on port 4200 with hot reload

## Starting

Start all backend services and frontend dev server:
```bash
npm run start
```

Optional health check:
```bash
./scripts/health.sh
```

## Deploying

Deploy all services to your current cluster context:
```bash
./k8s/scripts/deploy.sh
```

Optional verification:
```bash
./k8s/scripts/test-k8s.sh
```