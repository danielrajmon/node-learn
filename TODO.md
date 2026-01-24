# TODO


## Replace Internal API Calls with NATS
- Inventory current cross-service API calls and mark which can be async
- Convert quiz → achievements/leaderboard triggers to NATS events (already publishing `answer.submitted`, add subscribers)
- Add NATS subscribers in achievements service (handle `achievement.check` and `answer.submitted`)
- Add NATS subscribers in leaderboard service (handle `leaderboard.update` and/or `answer.submitted`)
- Ensure idempotency for event handlers (safe retries)
- Add tracing/log correlation IDs to events for observability
- Update api-gateway/client flows to rely on async updates where applicable

# Ideas for Features

## User Experience
- Move user administration to separate page
- Add learning paths/curated question sequences
- Implement spaced repetition recommendations

## Achievements
- "Unlucky" - Get all answers wrong in a quiz
- "Perfect Score" - Answer all quiz questions correctly
- "Comeback" - Get wrong answer, then correct within 3 questions
- "Speed Runner" - Complete quiz in under 5 minutes
- "Master" - 100% accuracy on all Node.js advanced questions

## Advanced Features
- Question explanations with code examples
- User-generated questions (with review workflow)
- Question difficulty calibration
- Study group collaboration
- Timed challenges & tournaments

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