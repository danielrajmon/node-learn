# TODO

## Service-per-DB Migration
- [ ] Define per-service databases (auth_db, questions_db, quiz_db, achievements_db, leaderboard_db, admin_db)
- [ ] Update env vars for each service (DATABASE_URL pointing to its own DB)
- [ ] Move migrations into each service under `services/<service>/migrations/`
- [ ] Add per-service migration runner scripts (Docker/K8s job or startup hook)
- [ ] Backfill data from shared DB into per-service DBs (one-time migration plan)
- [ ] Update backups: ensure PostgreSQL volume snapshot covers all DBs

## Replace Internal API Calls with NATS
- [ ] Inventory current cross-service API calls and mark which can be async
- [ ] Convert quiz → achievements/leaderboard triggers to NATS events (already publishing `answer.submitted`, add subscribers)
- [ ] Add NATS subscribers in achievements service (handle `achievement.check` and `answer.submitted`)
- [ ] Add NATS subscribers in leaderboard service (handle `leaderboard.update` and/or `answer.submitted`)
- [ ] Ensure idempotency for event handlers (safe retries)
- [ ] Add tracing/log correlation IDs to events for observability
- [ ] Update api-gateway/client flows to rely on async updates where applicable
