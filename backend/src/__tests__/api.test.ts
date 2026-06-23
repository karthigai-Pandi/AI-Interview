import request from 'supertest';
import express from 'express';
import routes from '../routes';

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('API Health', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Auth Validation', () => {
  it('should reject invalid registration data', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'invalid',
      password: 'short',
      name: 'A',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login without credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Protected Routes', () => {
  it('should reject unauthenticated access to /auth/me', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
