const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/booking.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

router.use(protect);

// POST /api/booking/book-doctor?id=<docID>&consultationType=   (PATIENT)
router.post('/book-doctor', restrictTo('PATIENT'), ctrl.bookDoctor);

// GET /api/booking/patient-bookings?status=   (PATIENT)
router.get('/patient-bookings', restrictTo('PATIENT'), ctrl.fetchPatientBookings);

// GET /api/booking/doctor-bookings?date=   (DOCTOR)
router.get('/doctor-bookings', restrictTo('DOCTOR'), ctrl.fetchDoctorBookings);

// PUT /api/booking/start-consultation?id=&otp=   (DOCTOR)
router.put('/start-consultation', restrictTo('DOCTOR'), ctrl.startConsultation);

// PUT /api/booking/end-consultation?id=   (DOCTOR)
router.put('/end-consultation', restrictTo('DOCTOR'), ctrl.endConsultation);

// PUT /api/booking/take-feedback?id=   (PATIENT)
router.put('/take-feedback', restrictTo('PATIENT'), ctrl.takeFeedback);

// PUT /api/booking/emergency-cancel   (DOCTOR)
router.put('/emergency-cancel', restrictTo('DOCTOR'), ctrl.emergencyCancel);

// GET /api/booking/patient-report-bookings?patID=   (DOCTOR) – for report access
router.get('/patient-report-bookings', restrictTo('DOCTOR'), ctrl.getPatientBookingsForDoctor);

module.exports = router;
