const mongoose = require('mongoose');


const bookingSchema = new mongoose.Schema(
  {
    docID: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
    patID: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

    date:            { type: Date,   required: true },
    slot:            { type: String, enum: ['MORNING', 'AFTERNOON', 'EVENING'], required: true },
    consultationType:{ type: String, enum: ['ONLINE', 'OFFLINE'], required: true },

    tokenNo: { type: Number, default: 0 },
    status:  {
      type:    String,
      enum:    ['PENDING', 'CONFIRMED', 'CONSULTING', 'DONE', 'CANCELLED'],
      default: 'PENDING',
    },

    otp:       { type: String, default: '' },
    otpExpiry: { type: Date },

   
    rating:   { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: '' },

   
    preDiagnosis: { type: String, default: '' },

    
    cancellationReason: { type: String, default: '' },

    // Payment tracking
    paymentStatus: {
      type:    String,
      enum:    ['UNPAID', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
  }},
  { timestamps: true }
);

// FIX: Prevent double-click race conditions by enforcing a unique constraint at the database level.
// A patient cannot book the exact same doctor, on the exact same date, for the exact same slot twice.
bookingSchema.index({ docID: 1, patID: 1, date: 1, slot: 1 }, { unique: true });

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
