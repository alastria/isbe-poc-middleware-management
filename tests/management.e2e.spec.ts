import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Pool, PoolClient } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { container } from 'tsyringe';
import { desc, eq } from 'drizzle-orm';

import createApp from '../src/app.js';
import { registerDbInstance, setContainer } from '../src/di.js';
import { DB_CONNECTION } from '../src/settings.js';
import * as schema from '../src/db/schema.js';
import { managements } from '../src/db/schema.js';
import { mockAuthN } from '../src/modules/auth/mockAuthN.js';
import type { AuthZContext } from '../src/modules/auth/jwt.verify.js';

const BASE = '/api/managements';

// Helper to create document metadata
const createDocMetadata = (filename: string) => ({
  url: `/uploads/${filename}`,
  filename,
  size: 100000,
  mimeType: 'application/pdf',
});

describe('Managements API E2E', () => {
  let pool: Pool;
  let client: PoolClient;
  let tx: NodePgDatabase<typeof schema>;

  const makeApp = (auth: AuthZContext) => {
    const di = container.createChildContainer();
    setContainer(di);
    registerDbInstance(tx);
    return createApp({ authMiddleware: mockAuthN(auth) });
  };

  beforeAll(async () => {
    if (!DB_CONNECTION.DATABASE_URL) {
      throw new Error('DATABASE_URL missing in env for tests');
    }
    pool = new Pool({ connectionString: DB_CONNECTION.DATABASE_URL });
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('BEGIN');
    tx = drizzle(client, { schema });
  });

  afterEach(async () => {
    await client.query('ROLLBACK');
    client.release();
  });

  it('POST /managements — creates a management with documents', async () => {
    const anyAuth: AuthZContext = { company_id: 'n/a', user_id: 'u1', role: 'admin' };
    const app = makeApp(anyAuth);

    // Note: In real scenario this would be multipart/form-data with actual files
    // For E2E tests, we simulate the payload after file processing
    const payload = {
      organization_identifier: 'ORG-001',
      selected_role: 'developer',
      contract: createDocMetadata('contract-001.pdf'),
    };

    const res = await request(app).post(BASE).send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      organization_identifier: 'ORG-001',
      selected_role: 'developer',
      contract: expect.objectContaining({
        url: '/uploads/contract-001.pdf',
        filename: 'contract-001.pdf',
      }),
    });
    expect(res.body.id).toBeDefined();

    const [row] = await tx
      .select()
      .from(managements)
      .where(eq(managements.organization_identifier, 'ORG-001'))
      .limit(1);
    expect(row).toBeTruthy();
    expect(row?.selected_role).toBe('developer');
  });

  it('POST /managements — 400 when required fields missing', async () => {
    const app = makeApp({ company_id: 'n/a', user_id: 'u2', role: 'admin' });
    const res = await request(app).post(BASE).send({ organization_identifier: 'ORG-002' });
    expect(res.status).toBe(400);
  });

  it('GET /managements — lists all managements', async () => {
    await tx.insert(managements).values({
      organization_identifier: 'ORG-100',
      selected_role: 'developer',
      contract: createDocMetadata('contract-100.pdf'),
    });
    await tx.insert(managements).values({
      organization_identifier: 'ORG-200',
      selected_role: 'operator',
      contract: createDocMetadata('contract-200.pdf'),
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u3', role: 'admin' });
    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // Check basic structure
    for (const item of res.body) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          organization_identifier: expect.any(String),
          selected_role: expect.any(String),
        }),
      );
    }

    const rows = await tx.select().from(managements).orderBy(desc(managements.created_at));
    expect(rows.length).toBe(2);
  });

  it('GET /managements/:organization_identifier — returns specific management', async () => {
    await tx.insert(managements).values({
      organization_identifier: 'ORG-FIND-ME',
      selected_role: 'developer',
      contract: createDocMetadata('find-me.pdf'),
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u4', role: 'admin' });
    const res = await request(app).get(`${BASE}/ORG-FIND-ME`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      organization_identifier: 'ORG-FIND-ME',
      selected_role: 'developer',
      contract: expect.objectContaining({
        filename: 'find-me.pdf',
      }),
    });
  });

  it('GET /managements/:organization_identifier — 404 when not found', async () => {
    const app = makeApp({ company_id: 'n/a', user_id: 'u5', role: 'admin' });
    const res = await request(app).get(`${BASE}/ORG-NOT-EXISTS`);
    expect(res.status).toBe(404);
  });

  it('PUT /managements/:organization_identifier/documents — updates documents', async () => {
    await tx.insert(managements).values({
      organization_identifier: 'ORG-UPDATE-DOCS',
      selected_role: 'operator',
      contract: createDocMetadata('old-contract.pdf'),
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u6', role: 'admin' });

    // Simulate updating contract document
    const updatePayload = {
      contract: createDocMetadata('new-contract.pdf'),
    };

    const res = await request(app)
      .put(`${BASE}/ORG-UPDATE-DOCS/documents`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.contract.filename).toBe('new-contract.pdf');

    const [row] = await tx
      .select()
      .from(managements)
      .where(eq(managements.organization_identifier, 'ORG-UPDATE-DOCS'))
      .limit(1);

    expect(row?.contract).toMatchObject({
      filename: 'new-contract.pdf',
    });
  });

  it('PUT /managements/:organization_identifier/role — assigns role (admin only)', async () => {
    // First insert a role
    const [role] = await tx.insert(schema.roles).values({
      type: 'developer',
      policies: { canRead: true, canWrite: false },
    }).returning();

    await tx.insert(managements).values({
      organization_identifier: 'ORG-ASSIGN-ROLE',
      selected_role: 'developer',
      contract: createDocMetadata('contract.pdf'),
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u7', role: 'admin' });

    const res = await request(app)
      .put(`${BASE}/ORG-ASSIGN-ROLE/role`)
      .send({ role_id: role.id });

    expect(res.status).toBe(200);
    expect(res.body.role_id).toBe(role.id);

    const [row] = await tx
      .select()
      .from(managements)
      .where(eq(managements.organization_identifier, 'ORG-ASSIGN-ROLE'))
      .limit(1);

    expect(row?.role_id).toBe(role.id);
  });

  it('DELETE /managements/:organization_identifier — deletes management', async () => {
    await tx.insert(managements).values({
      organization_identifier: 'ORG-DELETE-ME',
      selected_role: 'auditor',
      contract: createDocMetadata('delete-me.pdf'),
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u8', role: 'admin' });

    const res = await request(app).delete(`${BASE}/ORG-DELETE-ME`);
    expect(res.status).toBe(200);

    const rows = await tx
      .select()
      .from(managements)
      .where(eq(managements.organization_identifier, 'ORG-DELETE-ME'))
      .limit(1);
    expect(rows.length).toBe(0);
  });

  it('GET /managements returns 404 when empty', async () => {
    const app = makeApp({ company_id: 'n/a', user_id: 'u9', role: 'admin' });
    const res = await request(app).get(BASE);
    expect(res.status).toBe(404);
  });

  it('POST /managements — prevents duplicate organization_identifier', async () => {
    const anyAuth: AuthZContext = { company_id: 'n/a', user_id: 'u10', role: 'admin' };
    const app = makeApp(anyAuth);

    await tx.insert(managements).values({
      organization_identifier: 'ORG-DUPLICATE',
      selected_role: 'developer',
      contract: createDocMetadata('first.pdf'),
    });

    const payload = {
      organization_identifier: 'ORG-DUPLICATE',
      selected_role: 'operator',
      contract: createDocMetadata('second.pdf'),
    };

    const res = await request(app).post(BASE).send(payload);
    expect(res.status).toBe(400); // Should fail due to unique constraint
  });
});
