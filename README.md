# DynamicAI Builder



DynamicAI Builder is a metadata-driven application runtime that converts JSON configuration into a working application surface with generated UI, user-scoped APIs, persisted records, validation, workflows, and graceful handling of broken configs.

## Chosen role and track

- Role: Full Stack Engineer
- Track: AI App Generator
- Product: DynamicAI Builder

## Tech stack

- Frontend: Next.js, React, TypeScript, TailwindCSS
- Backend: Next.js API Routes, Node.js, TypeScript
- Database: PostgreSQL, Prisma ORM
- Deployment target: Vercel + Neon PostgreSQL

## Implemented scope

- Dynamic JSON config parser with safe fallbacks
- Runtime UI renderer for forms, tables, dashboards, cards, and unsupported component states
- Dynamic CRUD APIs by app slug and resource name
- PostgreSQL persistence through Prisma
- Email/password authentication with user-scoped data access
- Structured validation and error responses
- Workflow engine that can create notifications or derived records
- CSV import integrated into the runtime record flow
- Notifications integrated with workflow execution
- Multi-language-ready labels with English/Hindi dictionary support
- PWA manifest for installable/mobile support

## Architecture

The project intentionally stores dynamic records as validated JSON instead of generating Prisma models at request time. That keeps the runtime stable for malformed configs, avoids unsafe migrations from user input, and still allows each app resource to behave like a generated table through the API layer.

```txt
app/
  api/
    auth/                 authentication routes
    apps/                 config persistence routes
    runtime/[slug]/...    generated CRUD routes
components/
  app-shell.tsx           editor + generated app preview
  runtime-renderer.tsx    dynamic UI renderer
runtime/
  config-parser.ts        defensive JSON parser
  record-validator.ts     resource-aware validation
  workflow-engine.ts      workflow automation
prisma/
  schema.prisma           users, app configs, records, notifications
types/
  runtime.ts              runtime contracts
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set `DATABASE_URL` and `JWT_SECRET`.

3. Run Prisma migration:

```bash
npm run prisma:migrate
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Demo flow

1. Register with the prefilled demo email and password.
2. Click `Save` to persist the sample JSON config.
3. Create a lead from the generated form.
4. Confirm the generated table and dashboard update.
5. Confirm the workflow notification appears.
6. Upload a CSV with columns such as `name,email,stage,value`.
7. Change the config to include an unsupported component type and confirm the runtime shows a fallback instead of crashing.

## Example CSV

```csv
name,email,stage,value
Riya,riya@example.com,New,12000
Aman,aman@example.com,Qualified,25000
```

## Tradeoffs

- Dynamic database models are represented through a JSON-backed `RuntimeRecord` table. This is safer for an internship MVP than executing migrations from arbitrary configs.
- Authentication is implemented with JWT cookies for simplicity. A production version should add rate limiting, email verification, password reset, and stronger secret management.
- Workflow automation is intentionally small but extensible through action types.
