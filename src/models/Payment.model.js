const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    patID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },

    docID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    // Razorpay order id — created BEFORE payment
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    // Razorpay payment id — filled AFTER successful payment
    razorpayPaymentId: {
      type: String,
      default: null,
    },

    // Razorpay signature — for verification
    razorpaySignature: {
      type: String,
      default: null,
    },

    // Razorpay refund id — filled AFTER refund
    razorpayRefundId: {
      type: String,
      default: null,
    },

    amount:   { type: Number, required: true }, // in paisa (e.g. 50000 = ₹500)
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'CREATED',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
