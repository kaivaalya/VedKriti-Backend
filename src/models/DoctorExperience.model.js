const mongoose = require('mongoose');

/**
 * DoctorExperience – multiple experience records per doctor.
 */
const doctorExperienceSchema = new mongoose.Schema(
  {
    docID:       { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    facilityName:{ type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date },   // null = currently working
    isCurrent:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorExperience', doctorExperienceSchema);
