const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/patient.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { uploadMiddleware }    = require('../config/cloudinary.config');

router.use(protect, restrictTo('PATIENT'));


router.get('/profile', ctrl.getProfile);


router.put('/update-profile', uploadMiddleware('photo', 5), ctrl.updateProfile);


router.post('/pre-diagnosis', ctrl.submitPreDiagnosis);

module.exports = router;