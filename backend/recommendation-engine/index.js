const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// Content catalog (shared with gateway)
const catalog = [
  { id: 1, title: 'The Office', genre: 'Comedy', platform: 'Peacock', year: 2005, rating: 9.0, tags: ['workplace', 'mockumentary'] },
  { id: 2, title: 'Stranger Things', genre: 'Sci-Fi', platform: 'Netflix', year: 2016, rating: 8.7, tags: ['horror', '80s', 'kids'] },
  { id: 3, title: 'The Crown', genre: 'Drama', platform: 'Netflix', year: 2016, rating: 8.6, tags: ['historical', 'royalty'] },
  { id: 4, title: 'Breaking Bad', genre: 'Drama', platform: 'Netflix', year: 2008, rating: 9.5, tags: ['crime', 'antihero'] },
  { id: 5, title: 'Game of Thrones', genre: 'Fantasy', platform: 'HBO Max', year: 2011, rating: 9.2, tags: ['medieval', 'war'] },
  { id: 6, title: 'The Mandalorian', genre: 'Sci-Fi', platform: 'Disney+', year: 2019, rating: 8.7, tags: ['starwars', 'western'] },
  { id: 7, title: 'Ted Lasso', genre: 'Comedy', platform: 'Apple TV+', year: 2020, rating: 8.8, tags: ['sports', 'wholesome'] },
  { id: 8, title: 'Severance', genre: 'Thriller', platform: 'Apple TV+', year: 2022, rating: 8.7, tags: ['mystery', 'corporate'] },
  { id: 9, title: 'Succession', genre: 'Drama', platform: 'HBO Max', year: 2018, rating: 8.9, tags: ['family', 'corporate'] },
  { id: 10, title: 'Squid Game', genre: 'Thriller', platform: 'Netflix', year: 2021, rating: 8.0, tags: ['survival', 'korean'] },
  { id: 11, title: 'The Boys', genre: 'Action', platform: 'Prime Video', year: 2019, rating: 8.7, tags: ['superhero', 'satire'] },
  { id: 12, title: 'Rings of Power', genre: 'Fantasy', platform: 'Prime Video', year: 2022, rating: 6.9, tags: ['tolkien', 'epic'] },
  { id: 13, title: 'Andor', genre: 'Sci-Fi', platform: 'Disney+', year: 2022, rating: 8.4, tags: ['starwars', 'spy'] },
  { id: 14, title: 'House of the Dragon', genre: 'Fantasy', platform: 'HBO Max', year: 2022, rating: 8.5, tags: ['medieval', 'war'] },
  { id: 15, title: 'Loki', genre: 'Sci-Fi', platform: 'Disney+', year: 2021, rating: 8.2, tags: ['marvel', 'time-travel'] },
];

// In-memory user preferences (would be Redis/DB in production)
const userPrefs = new Map();

// Cosine similarity between two items based on genre, tags, rating
function similarity(a, b) {
  let score = 0;
  if (a.genre === b.genre) score += 3;
  const sharedTags = a.tags.filter(t => b.tags.includes(t)).length;
  score += sharedTags * 2;
  score += (1 - Math.abs(a.rating - b.rating) / 10) * 2;
  if (Math.abs(a.year - b.year) <= 3) score += 1;
  return score;
}

// Get recommendations based on liked items
function recommend(likedIds, limit = 5) {
  const liked = catalog.filter(c => likedIds.includes(c.id));
  if (liked.length === 0) {
    // Cold start: return top-rated
    return catalog
      .filter(c => !likedIds.includes(c.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  const candidates = catalog.filter(c => !likedIds.includes(c.id));
  const scored = candidates.map(c => {
    const avgSim = liked.reduce((sum, l) => sum + similarity(l, c), 0) / liked.length;
    return { ...c, score: Math.round(avgSim * 100) / 100 };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// Health
app.get('/', (req, res) => {
  res.json({ service: 'BlackStream Recommendation Engine', status: 'ok', version: '1.0.0', catalog: catalog.length });
});

// Get recommendations for a user
app.get('/recommendations', (req, res) => {
  const userId = req.query.user || 'anonymous';
  const limit = parseInt(req.query.limit) || 5;
  const liked = userPrefs.get(userId) || [];
  const recs = recommend(liked, limit);
  res.json({ user: userId, liked: liked.length, recommendations: recs });
});

// Get recommendations based on a specific show
app.get('/similar/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = catalog.find(c => c.id === id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const limit = parseInt(req.query.limit) || 5;
  const similar = catalog
    .filter(c => c.id !== id)
    .map(c => ({ ...c, score: Math.round(similarity(item, c) * 100) / 100 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  res.json({ source: item, similar });
});

// Record user preference
app.post('/like', (req, res) => {
  const { user, itemId } = req.body;
  if (!user || !itemId) return res.status(400).json({ error: 'user and itemId required' });
  if (!catalog.find(c => c.id === itemId)) return res.status(404).json({ error: 'Item not found' });

  const liked = userPrefs.get(user) || [];
  if (!liked.includes(itemId)) liked.push(itemId);
  userPrefs.set(user, liked);

  res.json({ user, liked });
});

// Get genre distribution
app.get('/genres', (req, res) => {
  const genres = {};
  catalog.forEach(c => { genres[c.genre] = (genres[c.genre] || 0) + 1; });
  res.json({ genres });
});

if (require.main === module) {
  app.listen(port, () => console.log(`Recommendation engine on port ${port}`));
}

module.exports = app;
