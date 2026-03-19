const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/creditController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Seuls PDF, JPG et PNG sont acceptés'));
  }
});

router.post('/simulate',              ctrl.simulate);
router.get('/',        authenticate,  ctrl.getUserCredits);
router.post('/request',authenticate,  upload.array('documents', 5), ctrl.createRequest);
router.get('/requests',authenticate,  ctrl.getUserRequests);
router.get('/notifications', authenticate, ctrl.getNotifications);
router.put('/notifications/read', authenticate, ctrl.markAllRead);

module.exports = router;
