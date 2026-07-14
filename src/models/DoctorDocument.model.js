const mongoose = require('mongoose');


const doctorDocumentSchema = new mongoose.Schema(
  {
    docID:    { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    title:    { type: String, required: true, trim: true },
    fileUrl:  { type: String, required: true },   // Cloudinary secure_url
    publicId: { type: String, required: true },   // Cloudinary public_id (for deletion)
    fileType: { type: String, default: '' },      // 'image' | 'pdf'
    isPublic: { type: Boolean, default: false },  // visible to patients on profile page
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorDocument', doctorDocumentSchema);
