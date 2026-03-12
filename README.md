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

## E2E Tests (Playwright)
Install browsers (one-time):
```bash
cd frontend
npm run e2e:install
```

Run against Vite dev server (default `E2E_BASE_URL=http://localhost:5173`):
```bash
cd frontend
npm run e2e
```

Run against Dockerized frontend (nginx on port 80):
```bash
cd frontend
npm run e2e:up
E2E_BASE_URL=http://localhost npm run e2e
npm run e2e:down
```

Use a separate test database locally (port 5433, db name `notesdb_e2e`):
```bash
cd frontend
npm run e2e:up:testdb
npm run e2e:testdb
npm run e2e:down:testdb
```

Run backend locally against the test database:
```bash
cd backend
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/notesdb_e2e \
SPRING_DATASOURCE_USERNAME=notes \
SPRING_DATASOURCE_PASSWORD=notes \
mvn spring-boot:run
```

Optional API override (skip proxies):
```bash
E2E_API_BASE_URL=http://localhost:8080 npm run e2e
```

UI mode (watch-style):
```bash
npm run e2e:ui
```

Debug a single test:
```bash
npx playwright test e2e/notes-tags.spec.ts --debug
```

Debug by name:
```bash
npx playwright test -g "manage note tags" --debug
```

Debug by line:
```bash
npx playwright test e2e/notes-tags.spec.ts:3 --debug
```

Trace viewer (after a failure):
```bash
npx playwright show-trace frontend/test-results/**/trace.zip
```

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

## Google OAuth (Optional)
Set these env vars before starting the backend:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

OAuth login uses HttpOnly cookies for access/refresh tokens and redirects back to `${FRONTEND_URL}/notes`.

### .env support
The backend loads a `.env` file in `backend/` if present (KEY=VALUE format). Example:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

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
