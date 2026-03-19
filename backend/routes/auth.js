const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nom requis (2-100 caractères)'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

router.post('/register', validateRegister, ctrl.register);
router.post('/login',    validateLogin,    ctrl.login);
router.get('/profile',   authenticate,     ctrl.getProfile);
router.put('/profile',   authenticate,     ctrl.updateProfile);

module.exports = router;
