# CleanTrac – Cloud Infrastructure Guide

This document records the minimum steps required to run the Receiving Dashboard & Cleaning Schedule application in AWS.

> **Scope** – “Good enough” for a small-team production deployment.  Adapt / harden as your scale or compliance posture requires.

---

## 1. Architecture Overview

| Component | Service | Notes |
|-----------|---------|-------|
| Django API | **ECS Fargate** task (Docker) | Public ALB forwards `/api/*` |
| React SPA | **ECS Fargate** task (Docker) | Same cluster; ALB forwards `/` |
| Static & media | **S3** + **CloudFront** | `collectstatic` pushes to versioned bucket |
| Database | **AWS RDS PostgreSQL (traceability_source)** | Single-AZ, daily snapshots |
| Object storage (imports / exports) | **S3** | IAM policy scoped to `cleantrac-*` buckets |
| CI / CD | **GitHub Actions** | Build, test, push images, deploy via `aws-actions/amazon-ecs-deploy-task-definition` |

---

## 2. Docker Images

* **Backend** `ghcr.io/<org>/cleantrac-backend:<sha>`
  ```Dockerfile
  FROM public.ecr.aws/docker/library/python:3.11-slim
  RUN apt-get update && apt-get install -y libpq-dev build-essential && rm -rf /var/lib/apt/lists/*
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  ENV DJANGO_SETTINGS_MODULE=cleantrac_project.settings
  CMD ["gunicorn", "cleantrac_project.wsgi:application", "-b", "0.0.0.0:8000"]
  ```

* **Frontend** `ghcr.io/<org>/cleantrac-frontend:<sha>`
  Build with `vite build` and serve via `nginx:alpine`.

GitHub Actions builds and pushes both images on merges to `main`.

---

## 3. ECS / Fargate

* **Cluster**: `cleantrac-prod`
* **Task definitions**:
  * `cleantrac-backend:latest` (512MB/0.25vCPU)
  * `cleantrac-frontend:latest` (256MB/0.25vCPU)
* **Service** – one replica each, behind a single **Application Load Balancer**.  Path-based routing:
  * `/api/*` → backend target group
  * `/*` → frontend target group

---

## 4. Database Connectivity & Security Group

The CI “Traceability DB health-check” requires the GitHub runner to reach the RDS instance on TCP 5432.

### Quick rule (simplest)

| Type | Port | Source | Description |
|------|------|--------|-------------|
| PostgreSQL | 5432 | `0.0.0.0/0` | "GitHub CI health-check" |

Django enforces SSL + credentials, so exposure is limited.  For tighter security substitute the GitHub Actions CIDR list (see [`https://api.github.com/meta`](https://api.github.com/meta`, `actions` field)).

> Remember to update the list periodically.

---

## 5. Secrets & Configuration

All sensitive values are injected via environment variables:

| Variable | Where | Description |
|----------|-------|-------------|
| `TRACEABILITY_DB_*` | RDS creds & host | Used by Django DB router |
| `DJANGO_SECRET_KEY` | SSM Parameter / GitHub Secret | Unique per environment |
| `AWS_REGION` | Task / CI | e.g. `eu-west-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | GitHub Actions only | Limited IAM user for pushing images & updating ECS |

---

## 6. Deployment Pipeline

1. Developer merges PR → `main`.
2. GitHub Action jobs:
   * Python & JS tests
   * DB health-check (acts as firewall smoke test)
   * Build Docker images → push to GHCR
   * `aws-actions/amazon-ecs-render-task-definition` + `aws-actions/amazon-ecs-deploy-task-definition` to update services.
3. ALB health check flips targets; zero downtime.

---

## 7. Monitoring & Alerting

| Layer | Tool | Action |
|-------|------|--------|
| RDS | Enhanced Monitoring | CPU, connections alarm |
| ECS | CloudWatch | Task failures, 5xx from ALB |
| App | Sentry (future) | Error tracking |
| Security | GuardDuty | Unusual port 5432 access |

---

## 8. Future Enhancements

* **Blue/Green deployments** via CodeDeploy.
* **AWS Secrets Manager** for DB creds rotation.
* **WebSockets** for live dashboard updates (Amazon MQ or IoT Core).

---

_Last updated: 2025-07-01_
