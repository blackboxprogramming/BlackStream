const http = require('http');
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

const app = require('./recommendation-engine');
let server;
let baseUrl;

before((_, done) => {
  server = app.listen(0, () => {
    baseUrl = `http://localhost:${server.address().port}`;
    done();
  });
});

after((_, done) => {
  server.close(done);
});

async function get(path) {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: await res.json() };
}

async function post(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

describe('Recommendation Engine', () => {
  it('health check', async () => {
    const { status, body } = await get('/');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.service, 'BlackStream Recommendation Engine');
    assert.strictEqual(body.catalog, 15);
  });

  it('cold start returns top-rated', async () => {
    const { body } = await get('/recommendations');
    assert.ok(body.recommendations.length > 0);
    assert.ok(body.recommendations.length <= 5);
    // First should be highest rated (Breaking Bad 9.5)
    assert.strictEqual(body.recommendations[0].title, 'Breaking Bad');
  });

  it('similar shows returns related content', async () => {
    const { status, body } = await get('/similar/5'); // Game of Thrones
    assert.strictEqual(status, 200);
    assert.strictEqual(body.source.title, 'Game of Thrones');
    // House of the Dragon should be highly similar (Fantasy + medieval + war)
    const titles = body.similar.map(s => s.title);
    assert.ok(titles.includes('House of the Dragon'));
  });

  it('similar 404 for invalid id', async () => {
    const { status } = await get('/similar/999');
    assert.strictEqual(status, 404);
  });

  it('like records preference', async () => {
    const { status, body } = await post('/like', { user: 'test1', itemId: 1 });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(body.liked, [1]);
  });

  it('recommendations use preferences', async () => {
    await post('/like', { user: 'test2', itemId: 1 }); // The Office (Comedy)
    await post('/like', { user: 'test2', itemId: 7 }); // Ted Lasso (Comedy)
    const { body } = await get('/recommendations?user=test2');
    // Should not include liked items
    const ids = body.recommendations.map(r => r.id);
    assert.ok(!ids.includes(1));
    assert.ok(!ids.includes(7));
  });

  it('like rejects missing fields', async () => {
    const { status } = await post('/like', { user: 'test' });
    assert.strictEqual(status, 400);
  });

  it('genres endpoint returns distribution', async () => {
    const { body } = await get('/genres');
    assert.ok(body.genres['Comedy'] >= 2);
    assert.ok(body.genres['Sci-Fi'] >= 3);
  });
});
