const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool   = require('../config/db');

// ──────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, phone } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const salt     = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, 'client')
       RETURNING id, name, email, role, created_at`,
      [name, email, hashPass, phone || null]
    );

    const user  = result.rows[0];
    const token = generateToken(user);

    // Notification de bienvenue
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, 'Bienvenue sur FinCredit Pro !', $2, 'success')`,
      [user.id, `Bonjour ${user.name}, votre compte a été créé avec succès.`]
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const user    = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// GET /api/auth/profile
// ──────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, phone, cin, address,
              profession, income, credit_score, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// PUT /api/auth/profile
// ──────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const { name, phone, address, profession } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET name=$1, phone=$2, address=$3, profession=$4, updated_at=NOW()
       WHERE id=$5
       RETURNING id, name, email, role, phone, address, profession`,
      [name, phone || null, address || null, profession || null, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// HELPER — Génère un JWT
// ──────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}
