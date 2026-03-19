const pool = require('../config/db');

// ──────────────────────────────────────────
// FORMULE PMT — Calcul mensualité
// ──────────────────────────────────────────
function calcMonthly(principal, annualRate, months) {
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ──────────────────────────────────────────
// Tableau d'amortissement complet
// ──────────────────────────────────────────
function buildAmortization(principal, annualRate, months) {
  const r        = annualRate / 100 / 12;
  const monthly  = calcMonthly(principal, annualRate, months);
  let   balance  = principal;
  const schedule = [];

  for (let i = 1; i <= months; i++) {
    const interest = balance * r;
    const capital  = monthly - interest;
    balance        = Math.max(0, balance - capital);
    schedule.push({
      month:           i,
      monthly_payment: +monthly.toFixed(2),
      capital:         +capital.toFixed(2),
      interest:        +interest.toFixed(2),
      remaining:       +balance.toFixed(2),
    });
  }
  return schedule;
}

// ──────────────────────────────────────────
// POST /api/credits/simulate  (PUBLIC)
// ──────────────────────────────────────────
exports.simulate = (req, res) => {
  const { amount, duration_months, interest_rate, insurance_monthly = 0 } = req.body;

  if (!amount || !duration_months || interest_rate == null) {
    return res.status(400).json({ success: false, message: 'Paramètres manquants (amount, duration_months, interest_rate)' });
  }

  const P         = parseFloat(amount);
  const n         = parseInt(duration_months);
  const r         = parseFloat(interest_rate);
  const ins       = parseFloat(insurance_monthly);
  const monthly   = calcMonthly(P, r, n);
  const monthlyTot = monthly + ins;
  const totalCost  = monthlyTot * n;
  const totalInt   = totalCost - P - ins * n;
  const schedule   = buildAmortization(P, r, n);

  res.json({
    success: true,
    simulation: {
      principal:               P,
      duration_months:         n,
      interest_rate:           r,
      monthly_payment:         +monthly.toFixed(2),
      monthly_with_insurance:  +monthlyTot.toFixed(2),
      total_cost:              +totalCost.toFixed(2),
      total_interest:          +totalInt.toFixed(2),
      insurance_total:         +(ins * n).toFixed(2),
      schedule,
    }
  });
};

// ──────────────────────────────────────────
// GET /api/credits  [AUTH]
// ──────────────────────────────────────────
exports.getUserCredits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM credits
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, credits: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// POST /api/credits/request  [AUTH]
// ──────────────────────────────────────────
exports.createRequest = async (req, res) => {
  const { credit_type, amount, duration_months, purpose } = req.body;

  if (!credit_type || !amount || !duration_months) {
    return res.status(400).json({ success: false, message: 'Champs obligatoires manquants' });
  }

  const documents = req.files
    ? req.files.map(f => ({ name: f.originalname, path: f.filename, size: f.size }))
    : [];

  // Taux par défaut selon le type
  const defaultRates = { Immobilier: 7.0, Auto: 8.2, Personnel: 11.0, Professionnel: 6.8 };
  const rate    = defaultRates[credit_type] || 9.0;
  const monthly = calcMonthly(parseFloat(amount), rate, parseInt(duration_months));

  try {
    const result = await pool.query(
      `INSERT INTO credit_requests
         (user_id, credit_type, amount, duration_months, interest_rate, purpose, monthly_payment, documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.user.id, credit_type, amount, duration_months, rate,
       purpose || null, +monthly.toFixed(2), JSON.stringify(documents)]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, '📋 Demande soumise', $2, 'info')`,
      [req.user.id, `Votre demande de ${parseFloat(amount).toLocaleString('fr-TN')} TND est en cours d'examen.`]
    );

    res.status(201).json({
      success: true,
      message: 'Demande de crédit soumise avec succès',
      request: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// GET /api/credits/requests  [AUTH]
// ──────────────────────────────────────────
exports.getUserRequests = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM credit_requests
       WHERE user_id = $1
       ORDER BY request_date DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const total = parseInt(result.rows[0]?.total_count || 0);
    res.json({
      success: true,
      requests: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// GET /api/credits/notifications  [AUTH]
// ──────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    const unread = result.rows.filter(n => !n.is_read).length;
    res.json({ success: true, notifications: result.rows, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// PUT /api/credits/notifications/read  [AUTH]
// ──────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true, message: 'Notifications marquées comme lues' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
