const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/payment.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');

router.use(protect);


router.post('/create-order', restrictTo('PATIENT'), ctrl.createOrder);


router.post('/verify', restrictTo('PATIENT'), ctrl.verifyPayment);


router.post('/cancel', restrictTo('PATIENT'), ctrl.cancelPayment);

router.post('/refund', restrictTo('PATIENT'), ctrl.refundPayment);


router.get('/status', restrictTo('PATIENT'), ctrl.getPaymentStatus);

module.exports = router;
