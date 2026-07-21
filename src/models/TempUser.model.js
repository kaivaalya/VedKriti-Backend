const mongoose = require('mongoose');


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

module.exports = mongoose.models.TempUser || mongoose.model('TempUser', tempUserSchema);
