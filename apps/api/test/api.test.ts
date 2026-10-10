import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';

describe('DevSphere Security API Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should return system status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('devsphere-api');
    expect(body.queue).toBeDefined();
  });

  it('POST /api/v1/scans should reject invalid or malformed URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: { url: 'not-a-valid-url' },
    });

    // Our Zod schema or URL validator will flag this
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/v1/scans should queue valid URL', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/scans',
      payload: { url: 'https://example.com' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.scanId).toBeDefined();
    expect(body.status).toBe('queued');
  });

  it('GET /api/v1/scans should return list of scans', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/scans',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });
});
