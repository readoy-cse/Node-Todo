# Node Todo - DevOps & CI/CD Ready MERN App

Node Todo is a containerized full-stack todo application built with React, Vite, Express, Node.js, and MongoDB. This repository is structured as a DevOps practice project with Docker-based local environments, multi-stage image builds, environment configuration, health checks, and a clear CI/CD delivery flow.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx for production frontend image |
| DevOps Focus | Multi-stage builds, environment variables, service networking, CI/CD pipeline readiness |

## Project Structure

```text
Node-Todo/
├── client/                 # React frontend
│   ├── Dockerfile          # Dev and production frontend image
│   └── docker-compose.yml  # Client-only compose setup
├── server/                 # Express backend API
│   ├── Dockerfile          # Dev and production backend image
│   ├── docker-compose.yml  # Server-only compose setup
│   ├── .env.example        # Required backend environment variables
│   └── src/
├── docker-compose.yml      # Root compose file for backend + MongoDB
├── .gitignore
└── README.md
```

## DevOps Highlights

- Dockerized frontend and backend services.
- Multi-stage Dockerfiles for development and production targets.
- Docker Compose networking for service-to-service communication.
- Persistent MongoDB volume for local containerized data.
- Environment-based configuration through `server/.env`.
- Health endpoint available at `/api/health`.
- Production frontend image served with Nginx.
- CI/CD-ready repository layout for build, test, image publishing, and deployment stages.

## Architecture

```text
React Client
    |
    | HTTP requests
    v
Express API
    |
    | Mongoose connection
    v
MongoDB
```

Default local ports:

| Service | Port | URL |
| --- | --- | --- |
| Client | 5173 | `http://localhost:5173` |
| Server | 5000 | `http://localhost:5000` |
| MongoDB | 27017 | `mongodb://localhost:27017` |

## Environment Variables

Create `server/.env` from the example file:

```bash
cd server
cp .env.example .env
```

Required variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/node_todo
CLIENT_URL=http://localhost:5173
```

For Docker Compose networking, use the MongoDB service name when the backend runs inside Docker:

```env
MONGODB_URI=mongodb://mongo:27017/node_todo
```

## Run Locally Without Docker

Install and run the backend:

```bash
cd server
npm install
npm run dev
```

Install and run the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

MongoDB must be running locally or through Docker.

## Run With Docker

Start backend and MongoDB from the root compose file:

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

Stop containers:

```bash
docker compose down
```

Stop containers and remove the MongoDB volume:

```bash
docker compose down -v
```

## Docker Image Build Commands

Build backend development image:

```bash
docker build --target dev -t node-todo-server:dev ./server
```

Build backend production image:

```bash
docker build --target prod -t node-todo-server:prod ./server
```

Build frontend development image:

```bash
docker build --target dev -t node-todo-client:dev ./client
```

Build frontend production image:

```bash
docker build --target prod -t node-todo-client:prod ./client
```

## CI/CD Pipeline Flow

Recommended pipeline stages:

1. Checkout source code.
2. Install dependencies for `client` and `server`.
3. Run linting and tests when available.
4. Build frontend static assets with `npm run build`.
5. Build Docker images for frontend and backend.
6. Scan images for vulnerabilities.
7. Push images to a container registry.
8. Deploy to the target environment.
9. Verify deployment through the `/api/health` endpoint.

Example GitHub Actions workflow outline:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install server dependencies
        working-directory: server
        run: npm ci

      - name: Install client dependencies
        working-directory: client
        run: npm ci

      - name: Build client
        working-directory: client
        run: npm run build

      - name: Build backend image
        run: docker build --target prod -t node-todo-server:${{ github.sha }} ./server

      - name: Build frontend image
        run: docker build --target prod -t node-todo-client:${{ github.sha }} ./client
```

## Health Check

Use the API health endpoint after starting the backend:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Check API status |
| GET | `/api/todos` | List all todos |
| POST | `/api/todos` | Create a todo |
| PATCH | `/api/todos/:id` | Update todo title or completion status |
| DELETE | `/api/todos/:id` | Delete a todo |

Example create request:

```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Deploy Node Todo\"}"
```

## Deployment Notes

- Store secrets such as `MONGODB_URI` in CI/CD secret storage, not in Git.
- Use different environment variables for development, staging, and production.
- Push versioned Docker images using commit SHA or semantic version tags.
- Run database backups before production migrations or destructive changes.
- Keep `.env` files out of version control.

## Repository Goal

This project is suitable for demonstrating a practical DevOps workflow around a Node.js application: local development, container builds, service orchestration, CI validation, image creation, and deployment readiness.
