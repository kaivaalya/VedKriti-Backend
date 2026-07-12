const mongoose = require('mongoose');

/**
 * TempUser – Holds unverified registrations until OTP is confirmed.
 * After verification the document is deleted and the user is inserted
 * into Doctor or Patient collection.
 */
const tempUserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },   // pre-hashed
    role:     { type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
    otp:      { type: String, required: true },
    otpExpiry:{ type: Date,   required: true },
  },
  { timestamps: true }
);

// TTL index – automatically remove docs that haven't been verified after 15 min
tempUserSchema.index({ otpExpiry: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempUser', tempUserSchema);
