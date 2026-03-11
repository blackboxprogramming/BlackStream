const assert = require('node:assert');
const { describe, it } = require('node:test');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const express = require('express');
const cors = require('cors');

const scrypt = promisify(crypto.scrypt);
const app = express();
app.use(cors());
app.use(express.json());

const users = new Map();
const sessions = new Map();
function generateToken() { return crypto.randomBytes(32).toString('hex'); }
async function hashPassword(p) { const s = crypto.randomBytes(16).toString('hex'); const d = await scrypt(p, s, 64); return `${s}:${d.toString('hex')}`; }
async function verifyPassword(p, stored) { const [s, h] = stored.split(':'); const d = await scrypt(p, s, 64); return crypto.timingSafeEqual(Buffer.from(h, 'hex'), d); }

app.get('/', (req, res) => res.json({ service: 'BlackStream User Service', status: 'ok' }));
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'required' });
  if (users.has(username)) return res.status(409).json({ error: 'exists' });
  const userId = crypto.randomUUID();
  users.set(username, { userId, username, email, passwordHash: await hashPassword(password), createdAt: new Date().toISOString() });
  res.status(201).json({ userId, username, email });
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'required' });
  const user = users.get(username);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid' });
  const token = generateToken();
  sessions.set(token, { userId: user.userId, username });
  res.json({ token, userId: user.userId });
});
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = token && sessions.get(token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const user = users.get(session.username);
  const { passwordHash, ...profile } = user;
  res.json(profile);
});

let server, base;

describe('User Service', () => {
  it('setup', (_, done) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; done(); }); });

  it('health check', async () => {
    const { status } = await fetch(`${base}/`);
    assert.strictEqual(status, 200);
  });

  it('register user', async () => {
    const res = await fetch(`${base}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alexa', email: 'alexa@blackroad.io', password: 'test123' })
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.username, 'alexa');
  });

  it('duplicate registration fails', async () => {
    const res = await fetch(`${base}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alexa', email: 'x@x.com', password: 'test' })
    });
    assert.strictEqual(res.status, 409);
  });

  it('login returns token', async () => {
    const res = await fetch(`${base}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alexa', password: 'test123' })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.token);
    assert.ok(body.userId);
  });

  it('wrong password rejected', async () => {
    const res = await fetch(`${base}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alexa', password: 'wrong' })
    });
    assert.strictEqual(res.status, 401);
  });

  it('profile requires auth', async () => {
    const res = await fetch(`${base}/profile`);
    assert.strictEqual(res.status, 401);
  });

  it('profile with token works', async () => {
    const loginRes = await fetch(`${base}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alexa', password: 'test123' })
    });
    const { token } = await loginRes.json();
    const profileRes = await fetch(`${base}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(profileRes.status, 200);
    const body = await profileRes.json();
    assert.strictEqual(body.username, 'alexa');
    assert.strictEqual(body.passwordHash, undefined); // should not leak
  });

  it('teardown', (_, done) => { server.close(done); });
});
