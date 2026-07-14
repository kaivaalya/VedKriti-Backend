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
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
