const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { uploadMiddleware }    = require('../config/cloudinary.config');

router.use(protect);


router.put(
  '/upload-report',
  restrictTo('PATIENT', 'DOCTOR'),
  uploadMiddleware('report', 15),
  ctrl.uploadReport
);


router.get('/get-reports', restrictTo('PATIENT', 'DOCTOR'), ctrl.getReports);


router.delete('/:reportId', restrictTo('PATIENT'), ctrl.deleteReport);

module.exports = router;
