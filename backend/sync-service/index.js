const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// In-memory watch progress store keyed by userId (replace with a real database in production)
// Structure: { [userId]: { [contentId]: { progressSeconds, durationSeconds, updatedAt } } }
const progress = new Map();

app.get('/', (req, res) => {
  res.json({ service: 'BlackStream Sync Service', status: 'ok', version: '0.1.0' });
});

// Save or update watch progress for a user
app.post('/progress/:userId/:contentId', (req, res) => {
  const { userId, contentId } = req.params;
  const { progressSeconds, durationSeconds } = req.body;

  if (progressSeconds === undefined || durationSeconds === undefined) {
    return res.status(400).json({ error: 'progressSeconds and durationSeconds are required' });
  }

  if (!progress.has(userId)) {
    progress.set(userId, new Map());
  }

  progress.get(userId).set(contentId, {
    contentId,
    progressSeconds: Number(progressSeconds),
    durationSeconds: Number(durationSeconds),
    updatedAt: new Date().toISOString(),
  });

  res.json({ userId, contentId, progressSeconds, durationSeconds });
});

// Get all watch progress for a user
app.get('/progress/:userId', (req, res) => {
  const { userId } = req.params;
  const userProgress = progress.get(userId);

  if (!userProgress) {
    return res.json({ userId, progress: [] });
  }

  res.json({ userId, progress: Array.from(userProgress.values()) });
});

// Get watch progress for a specific title
app.get('/progress/:userId/:contentId', (req, res) => {
  const { userId, contentId } = req.params;
  const userProgress = progress.get(userId);
  const item = userProgress && userProgress.get(contentId);

  if (!item) {
    return res.status(404).json({ error: 'No progress found for this title' });
  }

  res.json({ userId, ...item });
});

app.listen(port, () => {
  console.log(`Sync Service listening on port ${port}`);
});
