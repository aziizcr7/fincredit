const pool = require('../config/db');

function calcMonthly(P, annualRate, n) {
  if (annualRate === 0) return P / n;
  const r = annualRate / 100 / 12;
  return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ──────────────────────────────────────────
// GET /api/admin/requests  [ADMIN]
// ──────────────────────────────────────────
exports.getAllRequests = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let where  = [];
    let params = [];

    if (status) { params.push(status); where.push(`cr.status = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    params.push(limit, offset);
    const query = `
      SELECT cr.*, u.name AS client_name, u.email AS client_email, u.phone AS client_phone,
             u.credit_score, COUNT(*) OVER() AS total_count
      FROM credit_requests cr
      JOIN users u ON cr.user_id = u.id
      ${whereClause}
      ORDER BY cr.request_date DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    const total  = parseInt(result.rows[0]?.total_count || 0);

    res.json({
      success: true,
      requests: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/approve/:id  [ADMIN]
// ──────────────────────────────────────────
exports.approveRequest = async (req, res) => {
  const { id } = req.params;

  try {
    const r = await pool.query(
      'SELECT * FROM credit_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    if (!r.rows[0]) {
      return res.status(404).json({ success: false, message: 'Demande introuvable ou déjà traitée' });
    }

    const cr = r.rows[0];
    await pool.query(
      `UPDATE credit_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );

    const monthly   = +calcMonthly(parseFloat(cr.amount), parseFloat(cr.interest_rate), cr.duration_months).toFixed(2);
    const totalCost = +(monthly * cr.duration_months).toFixed(2);
    const totalInt  = +(totalCost - parseFloat(cr.amount)).toFixed(2);
    const start     = new Date();
    const end       = new Date(start);
    end.setMonth(end.getMonth() + cr.duration_months);

    await pool.query(
      `INSERT INTO credits
         (user_id, credit_type, amount, duration_months, interest_rate,
          monthly_payment, total_cost, total_interest, remaining_amount, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [cr.user_id, cr.credit_type, cr.amount, cr.duration_months, cr.interest_rate,
       monthly, totalCost, totalInt, cr.amount,
       start.toISOString().split('T')[0], end.toISOString().split('T')[0]]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, '✅ Crédit approuvé !', $2, 'success')`,
      [cr.user_id, `Votre demande de ${parseFloat(cr.amount).toLocaleString('fr-TN')} TND a été approuvée. Mensualité : ${monthly} TND.`]
    );

    res.json({ success: true, message: 'Crédit approuvé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/reject/:id  [ADMIN]
// ──────────────────────────────────────────
exports.rejectRequest = async (req, res) => {
  const { id }     = req.params;
  const { reason } = req.body;

  try {
    const result = await pool.query(
      `UPDATE credit_requests
       SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING user_id, amount`,
      [reason || 'Dossier incomplet ou critères non remplis', req.user.id, id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Demande introuvable ou déjà traitée' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, '❌ Demande refusée', $2, 'danger')`,
      [result.rows[0].user_id,
       `Votre demande de ${parseFloat(result.rows[0].amount).toLocaleString('fr-TN')} TND a été refusée. Motif : ${reason || 'Dossier incomplet'}.`]
    );

    res.json({ success: true, message: 'Demande refusée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// GET /api/admin/stats  [ADMIN]
// ──────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [totals, byType, monthly, users] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                           AS total,
          COUNT(*) FILTER (WHERE status = 'pending')        AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')       AS approved,
          COUNT(*) FILTER (WHERE status = 'rejected')       AS rejected,
          COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS total_amount,
          COALESCE(AVG(amount) FILTER (WHERE status = 'approved'), 0) AS avg_amount,
          COALESCE(AVG(duration_months) FILTER (WHERE status = 'approved'), 0) AS avg_duration
        FROM credit_requests`),
      pool.query(`
        SELECT credit_type, COUNT(*) AS count,
               COALESCE(SUM(amount), 0) AS total_amount
        FROM credit_requests
        GROUP BY credit_type ORDER BY count DESC`),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', request_date), 'Mon YYYY') AS month,
               COUNT(*) AS requests,
               COUNT(*) FILTER (WHERE status = 'approved') AS approved,
               COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) AS amount_approved
        FROM credit_requests
        WHERE request_date >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', request_date)
        ORDER BY DATE_TRUNC('month', request_date)`),
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'client'`)
    ]);

    const t = totals.rows[0];
    res.json({
      success: true,
      stats: {
        ...t,
        approval_rate: t.total > 0 ? Math.round((t.approved / t.total) * 100) : 0,
        total_clients: parseInt(users.rows[0].total),
        by_type:       byType.rows,
        monthly_trend: monthly.rows,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// GET /api/admin/users  [ADMIN]
// ──────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active,
             u.credit_score, u.income, u.profession, u.created_at,
             COUNT(DISTINCT c.id)   FILTER (WHERE c.status = 'active') AS active_credits,
             COUNT(DISTINCT cr.id)                                      AS total_requests
      FROM users u
      LEFT JOIN credits          c  ON c.user_id  = u.id
      LEFT JOIN credit_requests  cr ON cr.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC`);

    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ──────────────────────────────────────────
// PUT /api/admin/users/:id/toggle  [ADMIN]
// ──────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role != 'admin'
       RETURNING id, name, is_active`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
