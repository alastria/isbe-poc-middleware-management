import { describe, it, expect } from 'vitest';
import request from 'supertest';
import createApp from '../src/app.js';
import { mockAuthN } from '../src/modules/auth/mockAuthN.js';

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = createApp({ authMiddleware: mockAuthN() });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
