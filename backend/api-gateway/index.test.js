const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Subset of the catalog used for predictable assertions
const catalog = [
  { id: 1, title: 'The Office', genre: 'Comedy', platform: 'Peacock', year: 2005, rating: 9.0 },
  { id: 2, title: 'Stranger Things', genre: 'Sci-Fi', platform: 'Netflix', year: 2016, rating: 8.7 },
  { id: 3, title: 'Breaking Bad', genre: 'Drama', platform: 'Netflix', year: 2008, rating: 9.5 },
  { id: 4, title: 'The Boys', genre: 'Action', platform: 'Prime Video', year: 2019, rating: 8.7 },
];

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({ service: 'BlackStream API Gateway', status: 'ok', version: '0.1.0' });
  });

  app.get('/search', (req, res) => {
    const { q, genre, platform } = req.query;
    let results = catalog;

    if (q) {
      const query = q.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.genre.toLowerCase().includes(query) ||
          item.platform.toLowerCase().includes(query)
      );
    }

    if (genre) {
      results = results.filter((item) => item.genre.toLowerCase() === genre.toLowerCase());
    }

    if (platform) {
      results = results.filter((item) => item.platform.toLowerCase() === platform.toLowerCase());
    }

    res.json({ query: q || '', total: results.length, results });
  });

  return app;
}

describe('API Gateway', () => {
  const app = buildApp();

  describe('GET /', () => {
    it('returns health check', async () => {
      const res = await request(app).get('/');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.equal(res.body.service, 'BlackStream API Gateway');
    });
  });

  describe('GET /search', () => {
    it('returns all results when no query given', async () => {
      const res = await request(app).get('/search');
      assert.equal(res.status, 200);
      assert.equal(res.body.total, catalog.length);
      assert.ok(Array.isArray(res.body.results));
    });

    it('filters results by title keyword', async () => {
      const res = await request(app).get('/search?q=office');
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 1);
      assert.equal(res.body.results[0].title, 'The Office');
    });

    it('filters results by genre keyword', async () => {
      const res = await request(app).get('/search?q=drama');
      assert.equal(res.status, 200);
      assert.ok(res.body.results.every((r) => r.genre === 'Drama'));
    });

    it('filters results by platform keyword', async () => {
      const res = await request(app).get('/search?q=netflix');
      assert.equal(res.status, 200);
      assert.ok(res.body.results.every((r) => r.platform === 'Netflix'));
    });

    it('returns empty results for no match', async () => {
      const res = await request(app).get('/search?q=xyznoshow');
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 0);
      assert.deepEqual(res.body.results, []);
    });

    it('includes query in response', async () => {
      const res = await request(app).get('/search?q=boys');
      assert.equal(res.status, 200);
      assert.equal(res.body.query, 'boys');
    });

    it('filters by genre param', async () => {
      const res = await request(app).get('/search?genre=Action');
      assert.equal(res.status, 200);
      assert.ok(res.body.results.every((r) => r.genre === 'Action'));
    });

    it('filters by platform param', async () => {
      const res = await request(app).get('/search?platform=Netflix');
      assert.equal(res.status, 200);
      assert.ok(res.body.results.every((r) => r.platform === 'Netflix'));
    });
  });
});
