# BlackStream

Streaming aggregation platform — a single interface for discovering and tracking content across multiple streaming services.

## Architecture

```
frontend/
  web-app/          # React web application
backend/
  api-gateway/      # Express API (port 4000) — search, routing
  recommendation-engine/  # Content recommendations
  content-aggregator/     # Cross-platform catalog aggregation
  sync-service/           # Watch synchronization
  user-service/           # Authentication and profiles
```

## Quick Start

```bash
# API Gateway
cd backend/api-gateway && npm install && node index.js

# Web App
cd frontend/web-app && npm install && npm start
```

## API

```
GET /        # Health check
GET /search  # Search content — ?q=<query>
```

## Status

Early development. API gateway and React frontend are functional. Recommendation engine and content aggregator are scaffolded.

## License

Copyright 2026 BlackRoad OS, Inc. All rights reserved.
