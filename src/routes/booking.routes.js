const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/booking.controller');
const { protect, restrictTo,verifedDoctor } = require('../middlewares/auth.middleware');

router.use(protect);


router.post('/book-doctor', restrictTo('PATIENT'), ctrl.bookDoctor);


router.get('/patient-bookings', restrictTo('PATIENT'), ctrl.fetchPatientBookings);


router.get('/doctor-bookings', restrictTo('DOCTOR'),verifedDoctor, ctrl.fetchDoctorBookings);


router.put('/start-consultation', restrictTo('DOCTOR'),verifedDoctor, ctrl.startConsultation);


router.put('/end-consultation', restrictTo('DOCTOR'),verifedDoctor, ctrl.endConsultation);


router.put('/take-feedback', restrictTo('PATIENT'), ctrl.takeFeedback);


router.put('/emergency-cancel', restrictTo('DOCTOR'),verifedDoctor, ctrl.emergencyCancel);


router.get('/patient-report-bookings', restrictTo('DOCTOR'),verifedDoctor, ctrl.getPatientBookingsForDoctor);


router.get('/agora-token', ctrl.getAgoraToken);

module.exports = router;
