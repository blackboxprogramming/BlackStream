# BlackStream

[![CI](https://github.com/blackboxprogramming/BlackStream/actions/workflows/ci.yml/badge.svg)](https://github.com/blackboxprogramming/BlackStream/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-20%2B-339933.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-4.x-000000.svg)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Microservices](https://img.shields.io/badge/architecture-microservices-FF6B2B.svg)](https://blackroad.io)

> **Streaming aggregation platform with 5 microservices** — API gateway, content aggregator, recommendation engine (collaborative filtering), sync service, and user auth with crypto password hashing.

## Architecture

```
frontend/
  web-app/                    # React web application (search UI)
backend/
  api-gateway/                # Express API (port 4000) — search and routing
  recommendation-engine/      # Content recommendations (port 4000 by default)
  content-aggregator/         # Cross-platform catalog aggregation (port 4001)
  sync-service/               # Watch progress synchronization (port 4003)
  user-service/               # Authentication and profiles (port 4002)
```

## Quick Start

```bash
# API Gateway (required for search)
cd backend/api-gateway && npm install && node index.js

# Web App
cd frontend/web-app && npm install && npm start
```

Each backend service can be started independently:

```bash
cd backend/content-aggregator && npm install && node index.js   # port 4001
cd backend/user-service        && npm install && node index.js   # port 4002
cd backend/sync-service        && npm install && node index.js   # port 4003
cd backend/recommendation-engine && npm install && node index.js # port 4000
```

## API

### API Gateway (port 4000)

```
GET  /                               # Health check
GET  /search?q=<query>               # Search content by title, genre, or platform
GET  /search?genre=<genre>           # Filter by genre
GET  /search?platform=<platform>     # Filter by platform
```

### Content Aggregator (port 4001)

```
GET  /catalog                        # Full streaming catalog with platform/genre lists
GET  /catalog/:id                    # Single title by ID
```

### User Service (port 4002)

```
POST /register                       # Create account { username, email, password }
POST /login                          # Authenticate   { username, password } → token
GET  /profile                        # Get profile    (Authorization: Bearer <token>)
POST /logout                         # Invalidate token
```

### Sync Service (port 4003)

```
POST /progress/:userId/:contentId    # Save watch progress { progressSeconds, durationSeconds }
GET  /progress/:userId               # All progress for a user
GET  /progress/:userId/:contentId    # Progress for a specific title
```

### Recommendation Engine (port 4000)

```
GET  /recommendations                # Personalised content recommendations
```

## Running Tests

```bash
# API Gateway
cd backend/api-gateway && npm test

# Web App
cd frontend/web-app && npm test
```

## Status

- ✅ **API Gateway** — search endpoint returns real catalog results filtered by title, genre, or platform
- ✅ **Content Aggregator** — unified catalog API across platforms
- ✅ **User Service** — register, login, profile, and logout endpoints
- ✅ **Sync Service** — save and retrieve watch progress per user/title
- ✅ **React Frontend** — search UI with live results from the API Gateway
- ⚙️  **Recommendation Engine** — returns curated recommendations (static dataset)

## License

Copyright 2026 BlackRoad OS, Inc. All rights reserved.
