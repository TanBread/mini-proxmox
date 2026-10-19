const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES = '12h';

// Seed users: admin (full access) + user (read-only)
const users = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin12345', 10),
    role: 'admin',
  },
  {
    id: 2,
    username: 'user',
    password: bcrypt.hashSync('user123456', 10),
    role: 'user',
  },
];

function authenticate(username, password) {
  const user = users.find((u) => u.username === username);
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password)) return null;
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = verifyToken(auth.slice(7));
  if (!decoded) return res.status(401).json({ error: 'Invalid token' });
  req.user = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, verifyToken, requireAuth, requireAdmin, users };
