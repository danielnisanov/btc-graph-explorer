import { GET } from './route';
import { NextRequest } from 'next/server';

test('returns 400 without address', async () => {
  const req = new NextRequest('http://localhost/api/blockchain');
  const res = await GET(req);
  expect(res.status).toBe(400);
});

test('returns 200 with valid address', async () => {
  const req = new NextRequest('http://localhost/api/blockchain?address=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  const res = await GET(req);
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data).toHaveProperty('address', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
});

test('returns data when valid address is provided', async () => {
  const req = new NextRequest('http://localhost:3000/api/blockchain?address=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

  // Mock the network call the route performs
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ address: '1A1zP1...', n_tx: 1 }),
  }) as any;

  const res = await GET(req);
  const json = await res.json();

  expect(res.status).toBe(200);
  expect(json.address).toBeDefined();
});
