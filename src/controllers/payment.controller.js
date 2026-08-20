const mongoose     = require('mongoose');
const crypto       = require('crypto');
const Razorpay     = require('razorpay');
const Booking      = require('../models/Booking.model');
const Payment      = require('../models/Payment.model');
const Doctor       = require('../models/Doctor.model');
const Patient      = require('../models/Patient.model');
const DoctorAvailability = require('../models/DoctorAvailability.model');
const { confirmPendingBookings } = require('../utils/confirmPendingBookings');
const { sendCancellationEmail,sendBookingConfirmationEmail }  = require('../configs/mailer.config');
const AppError     = require('../utils/AppError');


const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const slotFields = {
  MORNING:   { bookings: 'morningBookings' },
  AFTERNOON: { bookings: 'afternoonBookings' },
  EVENING:   { bookings: 'eveningBookings' },
};


// POST /api/payment/create-order?bookingId=<id>

exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) throw new AppError('bookingId is required.', 400);

    const booking = await Booking.findOne({ _id: bookingId, patID: req.user.id });
    if (!booking) throw new AppError('Booking not found.', 404);

    // FIX #3: Only allow CONFIRMED (not PENDING) bookings to pay
    if (booking.status !== 'CONFIRMED') {
      throw new AppError(
        booking.status === 'PENDING'
          ? 'You are on the waiting list. Payment is only required once your booking is confirmed.'
          : `Cannot pay for a ${booking.status} booking.`,
        400
      );
    }

    
    if (booking.paymentStatus === 'PAID') {
      throw new AppError('This booking is already paid.', 400);
    }

    const doctor = await Doctor.findById(booking.docID).select('name consultationFee');
    if (!doctor) throw new AppError('Doctor not found.', 404);

    if (!doctor.consultationFee || doctor.consultationFee <= 0) {
      throw new AppError('Doctor has not set a consultation fee yet. Please contact support.', 400);
    }

    const amountInPaisa = Math.round(doctor.consultationFee * 100); // e.g. ₹500 → 50000 paisa


    const existingPayment = await Payment.findOne({ bookingId, status: 'CREATED' });
    if (existingPayment) {
      return res.status(200).json({
        status: 'SUCCESS',
        data: {
          orderId:    existingPayment.razorpayOrderId,
          amount:     existingPayment.amount,
          currency:   existingPayment.currency,
          bookingId,
          keyId:      process.env.RAZORPAY_KEY_ID,
          doctorName: doctor.name,
        },
      });
    }

    
    const order = await razorpay.orders.create({
      amount:   amountInPaisa,
      currency: 'INR',
      receipt:  `rcpt_${bookingId}`.slice(0, 40),
      notes:    { bookingId: bookingId.toString() },
    });

    try {
      await Payment.create({
        bookingId,
        patID:           req.user.id,
        docID:           booking.docID,
        razorpayOrderId: order.id,
        amount:          amountInPaisa,
        currency:        'INR',
        status:          'CREATED',
      });
    } catch (dupErr) {
     
      if (dupErr.code === 11000) {
        const racePayment = await Payment.findOne({ bookingId, status: 'CREATED' });
        if (racePayment) {
          return res.status(200).json({
            status: 'SUCCESS',
            data: {
              orderId:    racePayment.razorpayOrderId,
              amount:     racePayment.amount,
              currency:   racePayment.currency,
              bookingId,
              keyId:      process.env.RAZORPAY_KEY_ID,
              doctorName: doctor.name,
            },
          });
        }
      }
      throw dupErr;
    }

    res.status(201).json({
      status: 'SUCCESS',
      data: {
        orderId:    order.id,
        amount:     amountInPaisa,
        currency:   'INR',
        bookingId,
        keyId:      process.env.RAZORPAY_KEY_ID,
        doctorName: doctor.name,
      },
    });
  } catch (err) {
    next(err);
  }
};



// ─────────────────────────────────────────────────────────────
// POST /api/payment/verify

exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      bookingId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError(
        'bookingId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required.',
        400
      );
    }

   
    const booking = await Booking.findOne({ _id: bookingId, patID: req.user.id });
    if (!booking) throw new AppError('Booking not found or access denied.', 404);

  
    const existingPayment = await Payment.findOne({ razorpayOrderId });
    if (existingPayment && existingPayment.status === 'PAID') {
      return res.status(200).json({
        status:  'SUCCESS',
        message: 'Payment already verified.',
      });
    }

    if (!existingPayment) throw new AppError('Payment record not found.', 404);

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    existingPayment.razorpayPaymentId = razorpayPaymentId;
    existingPayment.razorpaySignature = razorpaySignature;
    existingPayment.status = 'PAID';
    await existingPayment.save();

    booking.paymentStatus = 'PAID';
    await booking.save();

  
    if (booking.status === 'CANCELLED') {
      const { processRefundsForBookings } = require('../utils/refund.utils');
      await processRefundsForBookings([booking._id], 'Payment succeeded after booking timeout cancellation.');
      return res.status(200).json({
        status:  'SUCCESS',
        message: 'Payment verified, but the booking was cancelled due to timeout. A full refund has been initiated.',
      });
    }


    
     const patient = await Patient.findById( req.user.id).select('email name');
    sendBookingConfirmationEmail(
      patient.email, patient.name, doctor.name,
      bookingDate, slotUpper, tokenNo, otp
    ).catch(console.error);

    res.status(200).json({
      status:  'SUCCESS',
      message: 'Payment verified successfully. Booking is confirmed.',
    });
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────
// POST /api/payment/cancel
// Body: { bookingId }

exports.cancelPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId } = req.body;
    if (!bookingId) throw new AppError('bookingId is required.', 400);


    const payment = await Payment.findOne({
      bookingId,
      patID:  req.user.id,
      status: { $in: ['CREATED', 'PAID'] },
    });

    if (!payment) {
      throw new AppError('No active payment found for this booking.', 404);
    }

    const booking = await Booking.findById(payment.bookingId).session(session);
    if (!booking) throw new AppError('Booking not found.', 404);


    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new AppError(`Cannot cancel a ${booking.status} booking.`, 400);
    }

    const wasConfirmed = booking.status === 'CONFIRMED';

 
    booking.status = 'CANCELLED';
    booking.cancellationReason = 'Payment cancelled by patient.';
    await booking.save({ session });

   
    if (wasConfirmed) {
      const { bookings } = slotFields[booking.slot];
      await DoctorAvailability.findOneAndUpdate(
        { docID: booking.docID, date: booking.date },
        { $inc: { [bookings]: -1 } },
        { session }
      );
    }

    await session.commitTransaction();

   
    if (wasConfirmed) {
      await confirmPendingBookings(
        booking.docID.toString(),
        booking.date,
        booking.slot
      );
    }

  
    if (payment.status === 'PAID' && payment.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: payment.amount,
          notes:  { reason: 'Payment cancelled by patient.' },
        });
        payment.razorpayRefundId = refund.id;
        payment.status = 'REFUNDED';
        booking.paymentStatus = 'REFUNDED';
        await booking.save();
      } catch (refundErr) {
        console.error('[Razorpay Refund Error]', refundErr.message);
      }
    } else {

      payment.status = 'FAILED';
    }

    await payment.save();


    const patient = await Patient.findById(req.user.id).select('email name');
    const doctor  = await Doctor.findById(booking.docID).select('name');
    sendCancellationEmail(
      patient.email, patient.name, doctor.name, booking.date,
      'Payment cancelled by patient.'
    ).catch(console.error);

    res.status(200).json({
      status:  'SUCCESS',
      message: payment.razorpayRefundId
        ? 'Booking cancelled and refund initiated. Amount will be credited in 5–7 business days.'
        : 'Booking cancelled successfully.',
    });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


// ─────────────────────────────────────────────────────────────
// POST /api/payment/refund?bookingId=<id>

exports.refundPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId } = req.query;
    if (!bookingId) throw new AppError('bookingId is required.', 400);

  
    const booking = await Booking.findOne({
      _id:   bookingId,
      patID: req.user.id,
    }).session(session);
    if (!booking) throw new AppError('Booking not found.', 404);
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new AppError(`Cannot cancel a ${booking.status} booking.`, 400);
    }

    const wasConfirmed = booking.status === 'CONFIRMED';

    booking.status = 'CANCELLED';
    booking.cancellationReason = 'Cancelled by patient (refund requested).';
    await booking.save({ session });

    if (wasConfirmed) {
      const { bookings } = slotFields[booking.slot];
      await DoctorAvailability.findOneAndUpdate(
        { docID: booking.docID, date: booking.date },
        { $inc: { [bookings]: -1 } },
        { session }
      );
    }

    await session.commitTransaction();

    if (wasConfirmed) {
      await confirmPendingBookings(
        booking.docID.toString(),
        booking.date,
        booking.slot
      );
    }

    
    const payment = await Payment.findOne({ bookingId, status: 'PAID' });
    let refundMessage = 'Booking cancelled. No payment was made.';

    if (payment && payment.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
          amount: payment.amount,
          notes:  { reason: 'Patient cancelled appointment.' },
        });
        payment.razorpayRefundId = refund.id;
        payment.status = 'REFUNDED';
        await payment.save();
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'REFUNDED' });
        refundMessage = 'Booking cancelled and refund initiated. Amount will be credited in 5–7 business days.';
      } catch (refundErr) {
        console.error('[Razorpay Refund Error]', refundErr.message);
        refundMessage = 'Booking cancelled. Refund initiation failed — our team will process it manually.';
      }
    }

    const patient = await Patient.findById(req.user.id).select('email name');
    const doctor  = await Doctor.findById(booking.docID).select('name');
    sendCancellationEmail(
      patient.email, patient.name, doctor.name, booking.date,
      'Cancelled by patient (refund requested).'
    ).catch(console.error);

    res.status(200).json({ status: 'SUCCESS', message: refundMessage });
  } catch (err) {
    if (session.inTransaction()) await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};



// GET /api/payment/status?bookingId=<id>

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) throw new AppError('bookingId is required.', 400);

    // Ownership check
    const booking = await Booking.findOne({ _id: bookingId, patID: req.user.id });
    if (!booking) throw new AppError('Booking not found.', 404);

    const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'SUCCESS',
      data: {
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        payment: payment ? {
          razorpayOrderId:   payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpayRefundId:  payment.razorpayRefundId,
          amount:            payment.amount,
          status:            payment.status,
        } : null,
      },
    });
  } catch (err) {
    next(err);
  }
};
