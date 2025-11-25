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

  it('POST /managements — creates a management (role normalized)', async () => {
    const anyAuth: AuthZContext = { company_id: 'n/a', user_id: 'u1', role: 'admin' };
    const app = makeApp(anyAuth);

    const payload = {
      title: 'Planned maintenance',
      body: 'We will perform maintenance tonight.',
      role: 'DESARROLLADOR',
      company_id: 'acme',
    };

    const res = await request(app).post(BASE).send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: payload.title,
      body: payload.body,
      role: 'desarrollador',
      company_id: 'acme',
    });
    expect(res.body.id).toBeDefined();

    const [row] = await tx
      .select()
      .from(managements)
      .where(eq(managements.id, res.body.id))
      .limit(1);
    expect(row).toBeTruthy();
    expect(row?.role).toBe('desarrollador');
  });

  it('POST /managements — 400 when required fields missing', async () => {
    const app = makeApp({ company_id: 'n/a', user_id: 'u2', role: 'admin' });
    const res = await request(app).post(BASE).send({ title: 'Missing body' });
    expect(res.status).toBe(400);
  });

  it('GET /managements — lists all (id & title only)', async () => {
    await tx.insert(managements).values({
      title: 'N1',
      body: 'B1',
      role: 'desarrollador',
      company_id: 'acme',
    });
    await tx.insert(managements).values({
      title: 'N2',
      body: 'B2',
      role: 'operador',
      company_id: 'otherco',
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u3', role: 'admin' });
    const res = await request(app).get(BASE);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);

    // only id & title should be present
    for (const item of res.body) {
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
        }),
      );
      expect(item.body).toBeUndefined();
      expect(item.role).toBeUndefined();
      expect(item.company_id).toBeUndefined();
    }

    const rows = await tx.select().from(managements).orderBy(desc(managements.created_at));
    expect(rows.length).toBe(2);
  });

  it('GET /managements/company/:company_id/role/:role — filters by company & role', async () => {
    await tx.insert(managements).values([
      { title: 'A1', body: 'X', role: 'desarrollador', company_id: 'acme' },
      { title: 'A2', body: 'Y', role: 'operador', company_id: 'acme' },
      { title: 'B1', body: 'Z', role: 'desarrollador', company_id: 'otherco' },
    ]);

    const app = makeApp({ company_id: 'n/a', user_id: 'u4', role: 'admin' });
    const res = await request(app).get(`${BASE}/company/acme/role/desarrollador`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'A1',
      }),
    );
  });

  it('GET /managements/company/:company_id/role/:role — 404 when no match', async () => {
    await tx.insert(managements).values({
      title: 'Only for operadores',
      body: '…',
      role: 'operador',
      company_id: 'acme',
    });

    const app = makeApp({ company_id: 'n/a', user_id: 'u5', role: 'admin' });
    const res = await request(app).get(`${BASE}/company/nope/role/desarrollador`);
    expect(res.status).toBe(404);
  });

  it('GET /managements/:id — returns full management', async () => {
    const [seed] = await tx
      .insert(managements)
      .values({ title: 'Full', body: 'Body', role: 'todos', company_id: 'acme' })
      .returning();

    const app = makeApp({ company_id: 'n/a', user_id: 'u6', role: 'admin' });
    const res = await request(app).get(`${BASE}/${seed.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: seed.id,
      title: 'Full',
      body: 'Body',
      role: 'todos',
      company_id: 'acme',
    });
  });

  it('GET /managements/:id/company/:company_id/role/:role — 200 when matches; 404 otherwise', async () => {
    const [seed] = await tx
      .insert(managements)
      .values({ title: 'Scoped', body: 'Body', role: 'desarrollador', company_id: 'acme' })
      .returning();

    const app = makeApp({ company_id: 'n/a', user_id: 'u7', role: 'admin' });

    // match
    let res = await request(app).get(`${BASE}/${seed.id}/company/acme/role/desarrollador`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(seed.id);

    // mismatch -> 404
    res = await request(app).get(`${BASE}/${seed.id}/company/acme/role/operador`);
    expect(res.status).toBe(404);
  });

  it('DELETE /managements/:id — deletes by id', async () => {
    const [seed] = await tx
      .insert(managements)
      .values({ title: 'Delete me', body: 'x', role: 'todos', company_id: 'acme' })
      .returning();

    const app = makeApp({ company_id: 'n/a', user_id: 'u8', role: 'admin' });

    const res = await request(app).delete(`${BASE}/${seed.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: seed.id });

    const rows = await tx
      .select()
      .from(managements)
      .where(eq(managements.id, seed.id))
      .limit(1);
    expect(rows.length).toBe(0);
  });

  it('DELETE /managements/:id/company/:company_id — deletes only when company matches', async () => {
    const [seed] = await tx
      .insert(managements)
      .values({ title: 'Scoped delete', body: 'y', role: 'operador', company_id: 'acme' })
      .returning();

    const app = makeApp({ company_id: 'n/a', user_id: 'u9', role: 'admin' });

    // wrong company => controller currently returns 400 on CustomError
    let res = await request(app).delete(`${BASE}/${seed.id}/company/otherco`);
    expect(res.status).toBe(400);

    // correct company
    res = await request(app).delete(`${BASE}/${seed.id}/company/acme`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: seed.id });
  });

  it('GET /managements returns 404 when empty', async () => {
    const app = makeApp({ company_id: 'n/a', user_id: 'u10', role: 'admin' });
    const res = await request(app).get(BASE);
    expect(res.status).toBe(404);
  });
});
