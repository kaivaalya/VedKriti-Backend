const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/report.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { uploadMiddleware }    = require('../config/cloudinary.config');

router.use(protect);

// PUT /api/report/upload-report   (PATIENT or DOCTOR)
// multer handles the file; controller determines role
router.put(
  '/upload-report',
  restrictTo('PATIENT', 'DOCTOR'),
  uploadMiddleware('report', 15),
  ctrl.uploadReport
);

// GET /api/report/get-reports?id=<patientId>   (PATIENT gets own; DOCTOR gets patient's)
router.get('/get-reports', restrictTo('PATIENT', 'DOCTOR'), ctrl.getReports);

// DELETE /api/report/:reportId   (PATIENT only)
router.delete('/:reportId', restrictTo('PATIENT'), ctrl.deleteReport);

module.exports = router;
