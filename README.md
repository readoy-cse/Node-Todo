# Node Todo DevOps Project

A simple full-stack Todo application used for DevOps practice. The app has a React frontend, Node.js/Express backend, MongoDB database, Docker setup, Kubernetes manifests, CI/CD workflow, and ArgoCD deployment flow.

## Project Overview

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Nginx |
| Backend | Node.js, Express |
| Database | MongoDB |
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes |
| GitOps Deployment | ArgoCD |
| CI/CD | GitHub Actions, Docker Hub |

## Repository Structure

```text
.
|-- main/
|   |-- client/              # React frontend
|   |-- server/              # Express backend
|   |-- docker-compose.yml   # Local Docker Compose setup
|   |-- ci-cd-plan.png       # CI/CD flow diagram
|   `-- README.md            # App-level notes
|-- manifest/
|   |-- deployments/         # Kubernetes Deployment manifests
|   |-- services/            # Kubernetes Service manifests
|   |-- k8sCluster-Diagram.png
|   `-- argocd.png
`-- README.md
```

## Application Flow

```text
User Browser
  -> Frontend Service: todo-svc-frontend NodePort 30080
  -> Frontend Pods: todo-frontend
  -> Backend Service: todo-svc-backend NodePort 30090
  -> Backend Pods: todo-backend
  -> MongoDB Service: todo-svc-mongo ClusterIP 27017
  -> MongoDB Pods: todo-mongo
```

The backend connects to MongoDB using this Kubernetes service DNS:

```env
MONGODB_URI=mongodb://todo-svc-mongo:27017/node_todo
```

## Kubernetes Cluster Diagram

![Kubernetes Cluster Diagram](./k8sCluster-Diagram.png)

## Kubernetes Resources

| Resource | Name | Type | Port | Replicas |
| --- | --- | --- | --- | --- |
| Frontend Deployment | `todo-frontend` | Deployment | `80` | `2` |
| Backend Deployment | `todo-backend` | Deployment | `5000` | `2` |
| MongoDB Deployment | `todo-mongo` | Deployment | `27017` | `2` |
| Frontend Service | `todo-svc-frontend` | NodePort | `30080 -> 80` | - |
| Backend Service | `todo-svc-backend` | NodePort | `30090 -> 5000` | - |
| MongoDB Service | `todo-svc-mongo` | ClusterIP | `27017 -> 27017` | - |

Container images used in the manifests:

| Component | Image |
| --- | --- |
| Frontend | `sakibtalukqder/todo-client-prod:a0124b6` |
| Backend | `sakibtalukqder/todo-server-prod:d2991b7` |
| Database | `mongo:latest` |

## Deploy to Kubernetes

Apply all deployments:

```bash
kubectl apply -f manifest/deployments/
```

Apply all services:

```bash
kubectl apply -f manifest/services/
```

Check running resources:

```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

Access the application through the frontend NodePort:

```text
http://<node-ip>:30080
```

Backend API NodePort:

```text
http://<node-ip>:30090
```

## ArgoCD Deployment

This project can also be deployed using ArgoCD as a GitOps workflow. ArgoCD watches the Git repository, reads the Kubernetes manifests from the `manifest/` directory, and syncs the desired state into the Kubernetes cluster.

![ArgoCD Deployment](./argocd.png)

Typical ArgoCD flow:

```text
GitHub Repository
  -> ArgoCD Application
  -> Kubernetes Manifests
  -> Kubernetes Cluster
  -> Frontend, Backend, MongoDB Pods and Services
```

Recommended ArgoCD application settings:

| Setting | Value |
| --- | --- |
| Repository URL | This GitHub repository URL |
| Path | `manifest` |
| Cluster | In-cluster Kubernetes API |
| Namespace | `default` or your selected namespace |
| Sync Policy | Manual or Automatic |

## CI/CD Flow

The CI/CD pipeline builds Docker images from the frontend and backend source code, pushes them to Docker Hub, and then the Kubernetes manifests use those images for deployment.

![CI/CD Plan](./main/ci-cd-plan.png)

```text
Code Push -> GitHub Actions -> Docker Build -> Docker Hub Push -> Kubernetes/ArgoCD Deploy
```

Required GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `DOCKER_USER` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |

## Run Locally

Start backend:

```bash
cd main/server
npm install
npm run dev
```

Start frontend:

```bash
cd main/client
npm install
npm run dev
```

Default local URLs:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:5000` |
| Health Check | `http://localhost:5000/api/health` |

## Docker Compose

Run the local Docker setup:

```bash
cd main
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend health check |
| GET | `/api/todos` | Get all todos |
| POST | `/api/todos` | Create a todo |
| PATCH | `/api/todos/:id` | Update a todo |
| DELETE | `/api/todos/:id` | Delete a todo |

## Notes

- Frontend and backend are exposed with NodePort services.
- MongoDB is internal-only through a ClusterIP service.
- Backend uses the MongoDB Kubernetes service name for database connectivity.
- ArgoCD should track the manifest directory for GitOps-based deployment.
