# Infrastructure

## Local (Docker Compose)

Prerequisite:

- Install Docker Desktop for Windows and ensure `docker` is available in PATH.

Start:

```bash
docker compose up --build
```

URLs:

- Admin: http://localhost/
- API health: http://localhost/api/health
- Postgres: localhost:5432 (user/pass/db: playmate)
- Redis: localhost:6379
