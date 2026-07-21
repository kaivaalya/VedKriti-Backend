const mongoose = require('mongoose');

/**
 * DoctorAvailability – date-wise slot counters for a doctor.
 * Pre-populated for the next 14 days when a doctor sets capacities.
 * Updated atomically on every booking.
 */
const doctorAvailabilitySchema = new mongoose.Schema(
  {
    docID: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date:  { type: Date, required: true },

    morningCapacity:   { type: Number, default: 0 },
    afternoonCapacity: { type: Number, default: 0 },
    eveningCapacity:   { type: Number, default: 0 },

    morningBookings:   { type: Number, default: 0 },
    afternoonBookings: { type: Number, default: 0 },
    eveningBookings:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index: one record per doctor per day
doctorAvailabilitySchema.index({ docID: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
