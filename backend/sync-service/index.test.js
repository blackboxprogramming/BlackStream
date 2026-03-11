const assert = require('node:assert');
const { describe, it } = require('node:test');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const progress = new Map();
app.get('/', (req, res) => res.json({ service: 'BlackStream Sync Service', status: 'ok' }));
app.post('/progress/:userId/:contentId', (req, res) => {
  const { userId, contentId } = req.params;
  const { progressSeconds, durationSeconds } = req.body;
  if (progressSeconds === undefined || durationSeconds === undefined) return res.status(400).json({ error: 'required' });
  if (!progress.has(userId)) progress.set(userId, new Map());
  progress.get(userId).set(contentId, { contentId, progressSeconds: Number(progressSeconds), durationSeconds: Number(durationSeconds), updatedAt: new Date().toISOString() });
  res.json({ userId, contentId, progressSeconds, durationSeconds });
});
app.get('/progress/:userId', (req, res) => {
  const up = progress.get(req.params.userId);
  res.json({ userId: req.params.userId, progress: up ? Array.from(up.values()) : [] });
});
app.get('/progress/:userId/:contentId', (req, res) => {
  const up = progress.get(req.params.userId);
  const item = up && up.get(req.params.contentId);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ userId: req.params.userId, ...item });
});

let server, base;

describe('Sync Service', () => {
  it('setup', (_, done) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; done(); }); });

  it('health check', async () => {
    const res = await fetch(`${base}/`);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
  });

  it('save progress', async () => {
    const res = await fetch(`${base}/progress/user1/show1`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progressSeconds: 1200, durationSeconds: 3600 })
    });
    const body = await res.json();
    assert.strictEqual(body.progressSeconds, 1200);
  });

  it('get user progress', async () => {
    const res = await fetch(`${base}/progress/user1`);
    const body = await res.json();
    assert.strictEqual(body.progress.length, 1);
    assert.strictEqual(body.progress[0].contentId, 'show1');
  });

  it('get specific progress', async () => {
    const res = await fetch(`${base}/progress/user1/show1`);
    const body = await res.json();
    assert.strictEqual(body.progressSeconds, 1200);
  });

  it('404 for missing progress', async () => {
    const res = await fetch(`${base}/progress/user1/nope`);
    assert.strictEqual(res.status, 404);
  });

  it('400 for missing fields', async () => {
    const res = await fetch(`${base}/progress/user1/show2`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.strictEqual(res.status, 400);
  });

  it('teardown', (_, done) => { server.close(done); });
});
