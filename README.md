# Node-learn

A NestJS-based learning platform for Node.js interview questions, delivered through Angular and later React frontends.

## Overview

The first phase focuses exclusively on a single **QuestionModule** that loads all questions from a local JSON file and exposes simple read-only endpoints. Basic filtering (search, difficulty, tags, topics) is supported, and the API is documented via OpenAPI/Swagger.

No authentication, user data, or database is included at this stage—just a clean, minimal backend designed so it can later be swapped to PostgreSQL with TypeORM without changing the API.

Additional phases will expand the system with persistence, authentication, user progress, admin tools, search, analytics, and eventually microservices using NATS.