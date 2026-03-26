import { Router } from 'express';
import { ADMIN_EMAIL, getAdminPassword, generateToken, authMiddleware } from '../middleware/auth.js';

export default function authRoutes(db) {
  const router = Router();

  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const adminPassword = getAdminPassword(db);
    if (email === ADMIN_EMAIL && password === adminPassword) {
      const token = generateToken(email);
      return res.json({ token, email });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  });

  router.get('/me', authMiddleware, (req, res) => {
    res.json({ email: req.user.email, role: 'admin' });
  });

  return router;
}
