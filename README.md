# Notes App (React + Spring Boot + Postgres)

Fullstack notes app with signup/login, email verification via SMTP4DEV, JWT access tokens, refresh tokens, and authenticated notes CRUD.

## Stack
- Frontend: React (Vite), Material UI, TanStack Query
- Backend: Spring Boot 3 (Java 17, Maven), Spring Security, JPA, Flyway, Lombok
- Database: PostgreSQL
- Infra: Docker Compose, Nginx reverse proxy, SMTP4DEV

## Run with Docker
```bash
docker compose up -d --build
```

Services:
- Frontend: http://localhost
- Backend (direct): http://localhost:8080
- SMTP4DEV UI: http://localhost:5000
- Postgres: localhost:5432

## Fast Local Dev Loop (Recommended)
Start only infra in Docker:
```bash
docker compose -f docker-compose.dev.yml up -d
```

Run backend locally (with DevTools):
```bash
cd backend
mvn spring-boot:run
```

Run frontend locally (with HMR):
```bash
cd frontend
npm install
npm run dev
```

This setup is faster than rebuilding app images on each code change.

## CORS in Dev
You do not need CORS for this dev setup, because Vite proxies `/api` to `http://localhost:8080`.
From the browser perspective, requests still go to the Vite origin, so there is no cross-origin request.

You only need CORS if frontend and backend are called from different origins directly (without proxy/reverse-proxy).

## DB Migrations (Flyway)
Migration files go here:
- `backend/src/main/resources/db/migration`

Naming pattern:
- `V1__description.sql`
- `V2__description.sql`
- and so on

How to run migrations:
- Migrations run automatically when backend starts (`mvn spring-boot:run` or Docker backend startup).
- Flyway tracks applied scripts in table `flyway_schema_history` and only runs each version once.

Current cleanup migration:
- `V1__remove_old_note_color_schema.sql` (drops old `note_color_id` and `note_colors` if present).

## Auth Flow
1. Sign up in the UI.
2. Open SMTP4DEV and click verification link.
3. Login.
4. Use notes page to create/edit/delete notes.

## Backend API
- `POST /api/auth/signup`
- `GET /api/auth/verify?token=...`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET /api/account/me`
- `POST /api/account/password-reset-request`
- `DELETE /api/account`
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/{id}`
- `DELETE /api/notes/{id}`
