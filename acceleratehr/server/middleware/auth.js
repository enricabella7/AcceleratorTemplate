import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'acceleratehr-jwt-secret-change-me';
const ADMIN_EMAIL = 'admin@acceleratehr.com';

export function getAdminPassword(db) {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'").get();
  return row?.value || 'AccelerateHR2024!';
}

export function generateToken(email) {
  return jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export { ADMIN_EMAIL };
