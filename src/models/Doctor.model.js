const mongoose = require('mongoose');

/**
 * Doctor – complete doctor profile.
 * 'verified' is set to true by Admin after document review.
 */
const doctorSchema = new mongoose.Schema(
  {
    
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    photo:       { type: String, default: '' },    // Cloudinary URL
    designation: { type: String, default: '' },
    about:       { type: String, default: '' },
    specialization1: { type: String, default: '' },
    specialization2: { type: String, default: '' },
    specialization3: { type: String, default: '' },
    institute:    { type: String, default: '' },
    degreeType:   { type: String, default: '' },
    degreeName:   { type: String, default: '' },
    fieldOfStudy: { type: String, default: '' },
    facilityName:    { type: String, default: '' },
    city:            { type: String, default: '' },
    state:           { type: String, default: '' },
    country:         { type: String, default: '' },
    address:         { type: String, default: '' },
    pin:             { type: String, default: '' },
    consultationFee: { type: Number, default: 0 },
    morningCapacity:   { type: Number, default: 0 },
    afternoonCapacity: { type: Number, default: 0 },
    eveningCapacity:   { type: Number, default: 0 },
    /**
     * holidays – concatenated day numbers (1=Mon … 7=Sun).
     * e.g. "136" means unavailable on Mon, Wed, Sat.
     */
    holidays: { type: String, default: '' },
    patientCount: { type: Number, default: 0 },
    rating:       { type: Number, default: 0 },
    verified:        { type: Boolean, default: false },
    verificationNote:{ type: String, default: '' },
  },
  { timestamps: true }
);

// Full-text search index on name + city + specializations
doctorSchema.index(
  { name: 'text', city: 'text', specialization1: 'text', specialization2: 'text', specialization3: 'text', facilityName: 'text' }
);

module.exports = mongoose.model('Doctor', doctorSchema);
