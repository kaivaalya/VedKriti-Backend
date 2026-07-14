const mongoose = require('mongoose');


const reportSchema = new mongoose.Schema(
  {
    patID:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    bookingID: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }, // optional link to a booking
    uploadedBy:{ type: String, enum: ['PATIENT', 'DOCTOR'], required: true },
    title:     { type: String, required: true, trim: true },
    fileUrl:   { type: String, required: true },    // Cloudinary secure_url
    publicId:  { type: String, required: true },    // Cloudinary public_id
    fileType:  { type: String, default: '' },       // 'image' | 'pdf' | 'other'
    category:  {
      type: String,
      enum: ['PRESCRIPTION', 'BLOOD_TEST', 'XRAY', 'MRI', 'CT_SCAN', 'OTHER'],
      default: 'OTHER',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
