const Razorpay = require('razorpay');
const Payment = require('../models/Payment.model');
const Booking = require('../models/Booking.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


exports.processRefundsForBookings = async (bookingIds, reason) => {
  try {
    const payments = await Payment.find({
      bookingId: { $in: bookingIds },
      status: 'PAID'
    });

    for (const payment of payments) {
      if (payment.razorpayPaymentId) {
        try {
          const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: payment.amount,
            notes: { reason },
          });

         
          payment.razorpayRefundId = refund.id;
          payment.status = 'REFUNDED';
          await payment.save();

          
          await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'REFUNDED' });

        } catch (refundErr) {
          console.error(`[Razorpay Refund Error] Payment ${payment._id}:`, refundErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[processRefundsForBookings] Error:', err);
  }
};
