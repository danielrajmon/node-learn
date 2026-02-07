# Node-Learn

A full-stack **Node.js Interview Questions Learning Platform** built with NestJS backend, Angular frontend, and PostgreSQL database.

## Overview

Node-Learn is a quiz platform where users can:
- Take quizzes on Node.js interview questions
- Track their progress and statistics
- Earn achievements and badges
- Compete on leaderboards
- Search and filter questions by topic, difficulty, and type

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