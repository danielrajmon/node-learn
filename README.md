# Node-learn

A NestJS-based learning platform for Node.js interview questions, delivered through Angular and later React frontends.

## Overview

The first phase focuses exclusively on a single **QuestionModule** that loads all questions from a local JSON file and exposes simple read-only endpoints. Basic filtering (search, difficulty, tags, topics) is supported, and the API is documented via OpenAPI/Swagger.

No authentication, user data, or database is included at this stage—just a clean, minimal backend designed so it can later be swapped to PostgreSQL with TypeORM without changing the API.

Additional phases will expand the system with persistence, authentication, user progress, admin tools, search, analytics, and eventually microservices using NATS.

## TODOs
- UI/UX fixes (desktop vs. tablet vs. mobile)
- Fix same answers offered for single or multi choice questions
- Create a valid home page text

## Ideas
- Database altering functionalities (creating, truncating tables, migrating data, remove gaps in IDs)
- Make question codes foldable
- Convert monolith modules to Microservices
- Add proper logging
- Add unit/integration/e2e tests
- Architectural and general documentation

## Achievement ideas
- In a multiple choice test guess everything wrong
- In a quiz mess up all answers

## Questions to add
- Angular service vs controller vs module
- Observables / RxJS
- What is a dto in NestJS?
- nestjs features
- when is choreography better?
- Redis
- indexes
- left join, right join
- lifelike code examples for every design pattern