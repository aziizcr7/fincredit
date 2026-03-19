# FinCredit Pro — Plateforme Bancaire

Application web complète de simulation et gestion de crédits bancaires.

## Stack
- **Frontend**: Angular 17+, Chart.js, TypeScript
- **Backend**: Node.js, Express.js, JWT
- **Base de données**: PostgreSQL 15

## Lancement rapide

### 1. Base de données
```bash
psql -U postgres
CREATE DATABASE fincredit_db;
\q
psql -U postgres -d fincredit_db -f backend/config/database.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editez .env avec vos paramètres
npm run dev
# → http://localhost:3000
```

### 3. Frontend
```bash
cd frontend
npm install
ng serve
# → http://localhost:4200
```

## Comptes de test
| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@fincredit.tn | admin123 | Administrateur |
| client@test.tn | client123 | Client |

## Routes API
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /api/auth/register | — | Inscription |
| POST | /api/auth/login | — | Connexion |
| POST | /api/credits/simulate | — | Simulation |
| GET | /api/credits | JWT | Mes crédits |
| POST | /api/credits/request | JWT | Demander un crédit |
| GET | /api/credits/requests | JWT | Mes demandes |
| GET | /api/admin/requests | JWT+Admin | Toutes les demandes |
| PUT | /api/admin/approve/:id | JWT+Admin | Approuver |
| PUT | /api/admin/reject/:id | JWT+Admin | Refuser |
| GET | /api/admin/stats | JWT+Admin | Statistiques |
| GET | /api/admin/users | JWT+Admin | Utilisateurs |
