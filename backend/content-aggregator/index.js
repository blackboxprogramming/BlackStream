const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Unified streaming catalog aggregated from multiple platforms
const catalog = [
  { id: 1, title: 'The Office', genre: 'Comedy', platform: 'Peacock', year: 2005, rating: 9.0 },
  { id: 2, title: 'Stranger Things', genre: 'Sci-Fi', platform: 'Netflix', year: 2016, rating: 8.7 },
  { id: 3, title: 'The Crown', genre: 'Drama', platform: 'Netflix', year: 2016, rating: 8.6 },
  { id: 4, title: 'Breaking Bad', genre: 'Drama', platform: 'Netflix', year: 2008, rating: 9.5 },
  { id: 5, title: 'Game of Thrones', genre: 'Fantasy', platform: 'HBO Max', year: 2011, rating: 9.2 },
  { id: 6, title: 'The Mandalorian', genre: 'Sci-Fi', platform: 'Disney+', year: 2019, rating: 8.7 },
  { id: 7, title: 'Ted Lasso', genre: 'Comedy', platform: 'Apple TV+', year: 2020, rating: 8.8 },
  { id: 8, title: 'Severance', genre: 'Thriller', platform: 'Apple TV+', year: 2022, rating: 8.7 },
  { id: 9, title: 'Succession', genre: 'Drama', platform: 'HBO Max', year: 2018, rating: 8.9 },
  { id: 10, title: 'Squid Game', genre: 'Thriller', platform: 'Netflix', year: 2021, rating: 8.0 },
  { id: 11, title: 'The Boys', genre: 'Action', platform: 'Prime Video', year: 2019, rating: 8.7 },
  { id: 12, title: 'Rings of Power', genre: 'Fantasy', platform: 'Prime Video', year: 2022, rating: 6.9 },
  { id: 13, title: 'Andor', genre: 'Sci-Fi', platform: 'Disney+', year: 2022, rating: 8.4 },
  { id: 14, title: 'House of the Dragon', genre: 'Fantasy', platform: 'HBO Max', year: 2022, rating: 8.5 },
  { id: 15, title: 'Loki', genre: 'Sci-Fi', platform: 'Disney+', year: 2021, rating: 8.2 },
];

app.get('/', (req, res) => {
  res.json({ service: 'BlackStream Content Aggregator', status: 'ok', version: '0.1.0' });
});

// Return the full unified catalog
app.get('/catalog', (req, res) => {
  const platforms = [...new Set(catalog.map((item) => item.platform))];
  const genres = [...new Set(catalog.map((item) => item.genre))];
  res.json({ total: catalog.length, platforms, genres, catalog });
});

// Return a single title by id
app.get('/catalog/:id', (req, res) => {
  const item = catalog.find((c) => c.id === parseInt(req.params.id, 10));
  if (!item) {
    return res.status(404).json({ error: 'Title not found' });
  }
  res.json(item);
});

app.listen(port, () => {
  console.log(`Content Aggregator listening on port ${port}`);
});
