// backend/create-admin.js
// Usage : node create-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./config/db');

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 12);

    // Créer l'admin
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password = $3, role = $4`,
      ['Admin Principal', 'admin@fincredit.tn', hash, 'admin']
    );
    console.log('✅ Admin créé : admin@fincredit.tn / admin123');

    // Créer un client de test
    const hashClient = await bcrypt.hash('client123', 12);
    const res = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, profession, income, credit_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE SET password = $3
       RETURNING id`,
      ['Mohamed Aziz', 'client@test.tn', hashClient, 'client', '+216 71 234 567', 'Ingénieur', 3500, 720]
    );
    console.log('✅ Client créé : client@test.tn / client123');

    // Ajouter des demandes de test pour le client
    const clientId = res.rows[0]?.id;
    if (clientId) {
      await pool.query(
        `INSERT INTO credit_requests
           (user_id, credit_type, amount, duration_months, interest_rate,
            monthly_payment, total_cost, status, request_date)
         VALUES
           ($1, 'Immobilier', 25000, 60, 7.0, 495.03, 29701.80, 'approved', NOW() - INTERVAL '5 months'),
           ($1, 'Auto', 18000, 48, 8.2, 440.32, 21135.36, 'approved', NOW() - INTERVAL '2 months'),
           ($1, 'Personnel', 8000, 24, 11.0, 372.65, 8943.60, 'pending', NOW() - INTERVAL '3 days')
         ON CONFLICT DO NOTHING`,
        [clientId]
      );
      console.log('✅ Demandes de test créées');
    }

    console.log('\n🎉 Données de test prêtes !');
    console.log('📌 Admin   : admin@fincredit.tn / admin123');
    console.log('📌 Client  : client@test.tn / client123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

createAdmin();
