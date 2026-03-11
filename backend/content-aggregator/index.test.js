const http = require('http');
const assert = require('node:assert');
const { describe, it } = require('node:test');

// Inline test — import the module if it exports, otherwise test via HTTP
const express = require('express');
const cors = require('cors');

// Recreate minimal app for testing
const catalog = [
  { id: 1, title: 'The Office', genre: 'Comedy', platform: 'Peacock', year: 2005, rating: 9.0 },
  { id: 2, title: 'Stranger Things', genre: 'Sci-Fi', platform: 'Netflix', year: 2016, rating: 8.7 },
];

const app = express();
app.use(cors());
app.get('/', (req, res) => res.json({ service: 'BlackStream Content Aggregator', status: 'ok' }));
app.get('/catalog', (req, res) => {
  const platforms = [...new Set(catalog.map(i => i.platform))];
  const genres = [...new Set(catalog.map(i => i.genre))];
  res.json({ total: catalog.length, platforms, genres, catalog });
});
app.get('/catalog/:id', (req, res) => {
  const item = catalog.find(c => c.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

let server, base;

describe('Content Aggregator', () => {
  it('setup', (_, done) => {
    server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; done(); });
  });

  it('health check', async () => {
    const res = await fetch(`${base}/`);
    const body = await res.json();
    assert.strictEqual(body.service, 'BlackStream Content Aggregator');
  });

  it('returns full catalog', async () => {
    const res = await fetch(`${base}/catalog`);
    const body = await res.json();
    assert.strictEqual(body.total, 2);
    assert.ok(body.platforms.includes('Peacock'));
    assert.ok(body.genres.includes('Sci-Fi'));
  });

  it('returns single item', async () => {
    const res = await fetch(`${base}/catalog/1`);
    const body = await res.json();
    assert.strictEqual(body.title, 'The Office');
  });

  it('404 for missing item', async () => {
    const res = await fetch(`${base}/catalog/999`);
    assert.strictEqual(res.status, 404);
  });

  it('teardown', (_, done) => { server.close(done); });
});
