const Doctor = require('../models/Doctor.model');
const DoctorAvailability = require('../models/DoctorAvailability.model');

const WINDOW_DAYS = 14;

const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

exports.rolloverDoctorAvailability = async () => {
  const today = normalizeDate(new Date());

 
  const { deletedCount } = await DoctorAvailability.deleteMany({
    date: { $lt: today },
  });

  const doctors = await Doctor.find({ verified: true })
    .select('morningCapacity afternoonCapacity eveningCapacity holidays');

  let created = 0;

  for (let offset = 0; offset <= WINDOW_DAYS; offset++) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);

    const jsDay = day.getDay();
    const dayNum = jsDay === 0 ? 7 : jsDay;

    for (const doctor of doctors) {
      if ((doctor.holidays || '').includes(dayNum)) continue; // weekly off day

      const result = await DoctorAvailability.findOneAndUpdate(
        { docID: doctor._id, date: day },
        {
          $setOnInsert: {
            docID: doctor._id,
            date: day,
            morningCapacity: doctor.morningCapacity,
            afternoonCapacity: doctor.afternoonCapacity,
            eveningCapacity: doctor.eveningCapacity,
            morningBookings: 0,
            afternoonBookings: 0,
            eveningBookings: 0,
            morningNextToken: 1,
            afternoonNextToken: 1,
            eveningNextToken: 1,
          },
        },
        { upsert: true, new: false }
      );
      if (result === null) created += 1;
    }
  }

  console.log(`[availability-rollover] removed ${deletedCount} past record(s), created ${created} new record(s)`);
};