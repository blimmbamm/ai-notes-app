# Notes App (React + Spring Boot + Postgres)

Fullstack notes app with signup/login, email verification via SMTP4DEV, JWT access tokens, refresh tokens, and authenticated notes CRUD.

## Stack
- Frontend: React (Vite), Material UI, TanStack Query
- Backend: Spring Boot 3 (Java 17, Maven), Spring Security, JPA, Lombok
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
- `GET /api/notes`
- `POST /api/notes`
- `PUT /api/notes/{id}`
- `DELETE /api/notes/{id}`

## Local dev (without Docker)
Backend:
```bash
cd backend
mvn spring-boot:run
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
