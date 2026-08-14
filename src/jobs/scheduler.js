const cron = require('node-cron'); // npm install node-cron
const { rolloverDoctorAvailability } = require('../utils/availability.utils');
const { sendUpcomingAppointmentReminders } = require('../utils/reminder.utils'); // added in the reminders section below

exports.startScheduledJobs = () => {
  
  cron.schedule('5 0 * * *', async () => {
    try { await rolloverDoctorAvailability(); }
    catch (err) { console.error('[availability-rollover] failed:', err); }
  });

  // 18:00 every night — remind patients about tomorrow's appointment
  cron.schedule('0 18 * * *', async () => {
    try { await sendUpcomingAppointmentReminders(); }
    catch (err) { console.error('[reminder-job] failed:', err); }
  });
};