# isbe-poc-middleware-managements# ISBE POC – Managements

## Managements api made with **Node.js + Express + TypeScript**

## 🚀 Stack

- [Node.js](https://nodejs.org/) v22+
- [Express](https://expressjs.com/) – HTTP server
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/) – package manager
- [tsx](https://github.com/esbuild-kit/tsx) – runner TS/ESM
- [Vitest](https://vitest.dev/) – test runner
- [Supertest](https://github.com/ladjs/supertest) – tests E2E
- [Prettier](https://prettier.io/) – format

---

## ⚙️ Scripts

```bash
pnpm dev          # Start dev server with tsx in watch mode (NODE_ENV=local)
pnpm build        # Compile TypeScript to ./dist
pnpm start        # Run compiled code from dist (NODE_ENV=production)
pnpm test         # Run all tests with Vitest
pnpm format       # Run Prettier on the whole repo
```

## 📌 Environment Variables

From the **.env.example** you must create -> **.env** and **.env.production**

- NODE_ENV

Used only to decide which .env.\* file to load.

Current logic:

```
If NODE_ENV=production → .env.production will be loaded

For any other value → .env will be loaded
```

Important: NODE_ENV does not control authentication or app behavior, it only determines which .env file is loaded.

- AUTH_N_ENABLED

Defined inside the loaded .env file. Manages the application behavior regarding authentication/authorization:

```
If AUTH_N_ENABLED=true → real authentication "authN.middleware" is enabled (JWT validation via JWKS).

If AUTH_N_ENABLED=false → "mockAuthN" is enabled, a middleware that generates a fake authorization context. This allows developing and testing without validating real JWTs.
```

The envs: FAKE_ROLE, FAKE_USER_ID, FAKE_COMPANY_ID are used to create the fake authorization

## 📦 Docker

```
docker compose up -d
```

Creates the services: postgres and pgweb

## 📖 Swagger

The API is documented with OpenAPI 3 and served with Swagger UI.

Interactive UI: http://localhost:3000/swagger

Raw spec (JSON): http://localhost:3000/swagger.json

Source spec (YAML): src/docs/openapi.yaml

## Using the 📖 Postman collection JSON file

Place and filename

The Postman collection is stored at: tests/ApiCallCollection/managements.json.

How to import

Open Postman, choose "Import" → "File", and select the JSON file from the path above.

Alternatively, copy the JSON content and use "Import" → "Raw text" in Postman.

Authentication

Most endpoints require a JWT in the Authorization header. Replace <JWT_TOKEN> in the collection with a valid token, or run the app with AUTH_N_ENABLED=false to enable the built-in mock authentication.

Example requests included

GET /health — public health check.

GET /api/managements — list managements (summary).

POST /api/managements — create management (JSON body example provided).

GET /api/managements/{id} — retrieve management details.

DELETE /api/managements/{id} — delete a management.

GET /api/managements/company/{companyId}/role/{role} — filtered listing by company and role.
