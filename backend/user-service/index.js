const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

const scrypt = promisify(crypto.scrypt);

// In-memory user store — replace with a persistent database in production
const users = new Map();
const sessions = new Map();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const derived = await scrypt(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derived);
}

app.get('/', (req, res) => {
  res.json({ service: 'BlackStream User Service', status: 'ok', version: '0.1.0' });
});

// Register a new user
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  if (users.has(username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);

  users.set(username, { userId, username, email, passwordHash, createdAt: new Date().toISOString() });

  res.status(201).json({ userId, username, email });
});

// Limit login attempts to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

// Login
app.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken();
  sessions.set(token, { userId: user.userId, username });

  res.json({ token, userId: user.userId, username });
});

// Get profile (requires token)
app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = token && sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = users.get(session.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash, ...profile } = user;
  res.json(profile);
});

// Logout
app.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.json({ message: 'Logged out' });
});

app.listen(port, () => {
  console.log(`User Service listening on port ${port}`);
});
