const cron = require('node-cron');
const { rolloverDoctorAvailability } = require('../utils/availability.utils');
const Booking = require('../models/Booking.model');
const { sendReminderEmail } = require('../configs/mailer.config');

exports.startScheduledJobs = () => {

  // 00:05 every night — roll availability window forward by 1 day
  cron.schedule('5 0 * * *', async () => {
    try {
      await rolloverDoctorAvailability();
    } catch (err) {
      console.error('[availability-rollover] failed:', err);
    }
  });

  // 18:00 every night — remind patients about tomorrow's appointment
  cron.schedule('0 18 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);

      const bookings = await Booking.find({
        date:   { $gte: tomorrow, $lte: end },
        status: 'CONFIRMED',
      })
        .populate('patID', 'name email')
        .populate('docID', 'name');

      bookings.forEach(b => {
        sendReminderEmail(
          b.patID.email,
          b.patID.name,
          b.docID.name,   // ✅ doctor name string, not ObjectId
          b.date,
          b.slot,
          b.tokenNo
        ).catch(console.error);
      });

    } catch (err) {
      console.error('[reminder-job] failed:', err);
    }
  });
};