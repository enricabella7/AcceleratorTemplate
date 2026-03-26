import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from './db/index.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import brochureRoutes from './routes/brochure.js';
import dataModelRoutes from './routes/data-models.js';
import dashboardRoutes from './routes/dashboards.js';
import aiUseCaseRoutes from './routes/ai-use-cases.js';
import kpiRoutes from './routes/kpis.js';
import aiGenerateRoutes from './routes/ai-generate.js';
import domainRoutes from './routes/domains.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    // Allow any Vercel preview/production URL for this project
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow explicitly configured client URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes(db));
app.use('/api/domains', domainRoutes(db));

app.use('/api/settings', settingsRoutes(db));
app.use('/api/brochure', brochureRoutes(db));
app.use('/api/data-models', dataModelRoutes(db));
app.use('/api/dashboards', dashboardRoutes(db));
app.use('/api/ai-use-cases', aiUseCaseRoutes(db));
app.use('/api/kpis', kpiRoutes(db));
app.use('/api/ai', aiGenerateRoutes());

app.listen(PORT, () => {
  console.log(`AccelerateHR API running on http://localhost:${PORT}`);
});
