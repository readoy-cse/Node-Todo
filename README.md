# Node Todo

A small MERN todo app for DevOps practice. It has a React/Vite client, Express API, MongoDB storage, Docker files, and Kubernetes manifests.

## Features

- Add, edit, complete, delete, search, and filter todos.
- Clear all completed tasks.
- Track time spent on each todo with start, stop, and reset controls.
- Progress summary for completed work.
- REST API with `/api/health` and `/api/todos`.
- Docker-ready client, server, and MongoDB setup.

## Stack

| Part | Tech |
| --- | --- |
| Client | React, Vite |
| API | Node.js, Express |
| Database | MongoDB, Mongoose |
| DevOps | Docker, Docker Compose, Kubernetes manifests |

## Run Locally

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

Default URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

## Environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/node_todo
CLIENT_URL=http://localhost:5173
```

When the backend runs inside Docker, use:

```env
MONGODB_URI=mongodb://mongo:27017/node_todo
```

## Docker

Start backend and MongoDB:

```bash
docker compose up --build
```

Stop services:

```bash
docker compose down
```

Remove containers and MongoDB volume:

```bash
docker compose down -v
```

## DevOps / CI-CD Process

Ei project-er DevOps flow simple vabe:

1. Developer code change kore GitHub-e push kore.
2. GitHub Actions check kore kon folder change hoyeche:
   - `client/**` change hole `.github/workflows/client_ci.yml` run hoy.
   - `server/**` change hole `.github/workflows/server_ci.yml` run hoy.
3. Workflow Docker Hub-e login kore.
4. Docker Buildx setup hoy, tarpor Docker image build hoy.
5. Build successful hole image Docker Hub-e push hoy:
   - Client image: `DOCKER_USER/todo-client-prod:latest`
   - Server image: `DOCKER_USER/todo-server-prod:latest`
6. Kubernetes cluster-e app run korar jonno `manifest/deployment.yml` and `manifest/services.yml` use kora hoy.

Short version:

```text
Code Push -> GitHub Actions -> Docker Build -> Docker Hub Push -> Kubernetes Deploy
```

Important CI/CD parts:

| Part | Kaj |
| --- | --- |
| GitHub Actions | Automatic build workflow run kore |
| Dockerfile | Client and server image banay |
| Docker Hub | Production image store kore |
| Kubernetes Deployment | Client, server, and MongoDB pod run kore |
| Kubernetes Service | App-er network access manage kore |

Required GitHub Secrets:

| Secret | Purpose |
| --- | --- |
| `DOCKER_USER` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |

Note: Current workflow image build and Docker Hub push porjonto automatic. Kubernetes deploy step manually kora jay:

```bash
kubectl apply -f manifest/deployment.yml
kubectl apply -f manifest/services.yml
```

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/todos` | List todos |
| POST | `/api/todos` | Create todo |
| PATCH | `/api/todos/:id` | Update title or status |
| DELETE | `/api/todos/:id` | Delete todo |

## Notes

- Keep `.env`, secrets, and local logs out of Git.
- Use CI/CD secrets for production values.
- Build and tag Docker images from the `client` and `server` folders.
