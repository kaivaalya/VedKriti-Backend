const mongoose = require('mongoose');

/**
 * Patient – verified patient accounts.
 */
const patientSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone:    { type: String, default: '' },
    gender:   { type: String, enum: ['MALE', 'FEMALE', 'OTHER', ''], default: '' },
    dob:      { type: Date },
    address:  { type: String, default: '' },
    photo:    { type: String, default: '' },   // Cloudinary URL
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
