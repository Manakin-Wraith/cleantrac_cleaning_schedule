# CleanTrac – Multi-Tenant Cleaning Management SaaS

This monorepo contains a multi-tenant SaaS platform for cleaning management, featuring separate frontend applications and a unified Django backend API.

* **Backend**: Django 5.2 (Python 3.11) with django-tenants for multi-tenancy
* **Frontend**: React 19 + Vite + Material-UI (multiple deployments)
* **Database**: AWS RDS PostgreSQL with schema-based tenant separation
* **Architecture**: Hybrid deployment (EC2 + ECS/Fargate)
* **CI/CD**: GitHub Actions with automated testing and health checks

---

## 🏗️ **System Architecture**

### **Production Deployment**
- **Manager Frontend**: EC2 Server (`www.cleentrac.com`, `manager.cleentrac.com`)
- **Receiving Frontend**: AWS ECS/Fargate (`receiving.cleentrac.com`)
- **Backend API**: `api.cleentrac.com` (serves both frontends)
- **Database**: AWS RDS PostgreSQL (multi-tenant with schema separation)

### **Multi-Tenancy**
- **Schema-based separation** using django-tenants
- **Tenant domains**: `{tenant}.manager.cleentrac.com`, `{tenant}.receiving.cleentrac.com`
- **Admin interfaces**: Tenant-specific admin access
- **Data isolation**: Complete separation between tenant schemas

📖 **[View Complete Architecture Documentation](./ARCHITECTURE.md)**

---

## Local development

1. **Clone & install**

   ```bash
   git clone <repo>
   cd cleantrac_cleaning_schedule
   python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt

   cd frontend
   pnpm i   # or npm/yarn
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` and set the following:

   | Variable | Description |
   |----------|-------------|
   | `TRACEABILITY_DB_NAME` | RDS DB name |
   | `TRACEABILITY_DB_USER` / `TRACEABILITY_DB_PASSWORD` | Credentials |
   | `TRACEABILITY_DB_HOST` / `TRACEABILITY_DB_PORT` | Host & port (default 5432) |

3. **Run services**

   ```bash
   # backend
   python manage.py runserver 8000
   # frontend (from ./frontend)
   pnpm dev
   ```

---

## Continuous integration

`/.github/workflows/db-health-check.yml` executes on every push / PR to `main` & `calendar_overhaul`.

Key steps:

1. Install system packages (`libpq-dev`) **before** Python deps so that `psycopg2-binary` can compile.
2. `pip install -r requirements.txt` – includes `python-dotenv`, `psycopg2-binary`, `pandas`.
3. `python manage.py check_traceability_db --expected 1` – fails the job if RDS is unreachable or row-count < expected.

The workflow expects the following **repository secrets**:

* `TRACEABILITY_DB_NAME`, `TRACEABILITY_DB_USER`, `TRACEABILITY_DB_PASSWORD`, `TRACEABILITY_DB_HOST`, `TRACEABILITY_DB_PORT`.

For details of the RDS security-group rule required for the runner to connect, see [`docs/cloud_setup.md`](docs/cloud_setup.md).

---

## Cloud deployment

A high-level plan is documented in [`docs/cloud_setup.md`](docs/cloud_setup.md) covering:

* Docker images for Django & React
* ECS Fargate service definition
* S3 bucket for static & media assets
* RDS connectivity / IAM auth
* Health-check endpoints & GitHub Actions deployment pipeline

---

## License
Internal project – not licensed for external distribution.
