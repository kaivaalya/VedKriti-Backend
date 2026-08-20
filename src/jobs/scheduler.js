const cron = require('node-cron');
const { rolloverDoctorAvailability } = require('../utils/availability.utils');
const Booking = require('../models/Booking.model');
const { sendReminderEmail } = require('../configs/mailer.config');

exports.startScheduledJobs = () => {

 
  cron.schedule('0 0 * * *', async () => {
    try {
      await rolloverDoctorAvailability();

      // Fix: Mark all past bookings that were CONFIRMED (but never started by the doctor) as CANCELLED
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await Booking.updateMany(
        { date: { $lt: today },status: { $in: ["CONFIRMED", "PENDING"] }},
        { 
          $set: { 
            status: 'CANCELLED', 
            cancellationReason: 'Doctor did not start the consultation on the scheduled date.' 
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`[midnight-job] Auto-cancelled ${result.modifiedCount} abandoned past bookings.`);
      }

    } catch (err) {
      console.error('[availability-rollover] failed:', err);
    }
  });

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
          b.docID.name,  
          b.date,
          b.slot,
          b.tokenNo
        ).catch(console.error);
      });

    } catch (err) {
      console.error('[reminder-job] failed:', err);
    }
  });

 
  cron.schedule('*/15 * * * *', async () => {
    const mongoose = require('mongoose');
    const { confirmPendingBookings } = require('../utils/confirmPendingBookings');
    const Payment = require('../models/Payment.model');
    const DoctorAvailability = require('../models/DoctorAvailability.model');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      const unpaidBookings = await Booking.find({
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
        updatedAt: { $lte: fifteenMinutesAgo },
      }).session(session);

      for (const booking of unpaidBookings) {
        
        booking.status = 'CANCELLED';
        booking.cancellationReason = 'Payment timeout (15 minutes).';
        await booking.save({ session });

        
        await Payment.updateMany(
          { bookingId: booking._id, status: 'CREATED' },
          { $set: { status: 'FAILED' } },
          { session }
        );

       
        let bookingsField;
        if (booking.slot === 'MORNING') bookingsField = 'morningBookings';
        if (booking.slot === 'AFTERNOON') bookingsField = 'afternoonBookings';
        if (booking.slot === 'EVENING') bookingsField = 'eveningBookings';

        await DoctorAvailability.findOneAndUpdate(
          { docID: booking.docID, date: booking.date },
          { $inc: { [bookingsField]: -1 } },
          { session }
        );
      }

      await session.commitTransaction();

      
      for (const booking of unpaidBookings) {
        await confirmPendingBookings(booking.docID.toString(), booking.date, booking.slot);
      }
    } catch (err) {
      if (session.inTransaction()) await session.abortTransaction();
      console.error('[unpaid-cleanup-job] failed:', err);
    } finally {
      session.endSession();
    }
  });
};
