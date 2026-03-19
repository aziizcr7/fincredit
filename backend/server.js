require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');

const app = express();

// ── Dossier uploads ──
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ── Sécurité ──
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 15,  message: { success:false, message:'Trop de tentatives, réessayez dans 15 minutes' } });

app.use('/api/', globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Fichiers statiques ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes API ──
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/admin',   require('./routes/admin'));

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: '1.0.0', timestamp: new Date() });
});

// ── 404 ──
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} introuvable` });
});

// ── Gestionnaire d'erreurs global ──
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err.stack);
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ success: false, message: 'Fichier trop grand (max 5 Mo)' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 FinCredit API démarrée sur http://localhost:${PORT}`);
  console.log(`📦 Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
