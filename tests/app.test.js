const request = require('supertest');
const app = require('../src/app');

describe('CliniTurn API', () => {
  test('GET /health debe responder healthy', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.status).toBe('healthy');
  });

  test('GET /ruta-no-existe debe responder 404', async () => {
    const response = await request(app).get('/ruta-no-existe');

    expect(response.statusCode).toBe(404);
    expect(response.body.ok).toBe(false);
  });
});
