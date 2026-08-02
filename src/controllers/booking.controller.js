const mongoose = require('mongoose');
const Booking               = require('../models/Booking.model');
const Doctor                = require('../models/Doctor.model');
const Patient               = require('../models/Patient.model');
const DoctorAvailability    = require('../models/DoctorAvailability.model');
const {confirmPendingBookings}=require("../utils/confirmPendingBookings")
const { generateConsultationOTP, generateOTP } = require('../utils/otp.utils');
const {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
} = require('../configs/mailer.config');
const { generateAgoraToken } = require("../utils/agora.utils");
const AppError = require('../utils/AppError');


const normalizeDate = (d)=>{
    const date = new Date(d);
    date.setHours(0,0,0,0);
    return date;
}

const slotFields = {
  MORNING: {
    capacity: "morningCapacity",
    bookings: "morningBookings",
    nextToken: "morningNextToken",
  },
  AFTERNOON: {
    capacity: "afternoonCapacity",
    bookings: "afternoonBookings",
    nextToken: "afternoonNextToken",
  },
  EVENING: {
    capacity: "eveningCapacity",
    bookings: "eveningBookings",
    nextToken: "eveningNextToken",
  },
};


exports.bookDoctor = async (req,res,next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        
        const docID=req.query.id;
        const consultationType = (req.query.consultationType||'').toUpperCase();

      if (!["ONLINE", "OFFLINE"].includes(consultationType)) {
    throw new AppError(
            "consultationType must be ONLINE or OFFLINE.",
            400
        )
    
}
        const patID=req.user.id;
        const {date , slot }=req.body;



        if(!docID||!date ||!slot){
            throw new AppError('docID (query), date and slot (body) are required.',400)

        }
        const slotUpper = slot.toUpperCase();
        if(!['MORNING','AFTERNOON','EVENING'].includes(slotUpper)){
          throw new AppError('slot must be MORNING, AFTERNOON or EVENING.', 400)
        }

        const bookingDate = normalizeDate(date);

        const today = normalizeDate(new Date());
         const maxDate = new Date(today); maxDate.setDate(today.getDate() + 14);

          if (bookingDate < today)    throw new AppError('Cannot book past dates.', 400)
    if (bookingDate > maxDate) throw new AppError('Bookings are limited to 14 days in advance.', 400)


    const doctor = await Doctor.findById(docID).session(session);
       if (!doctor || !doctor.verified) throw new AppError('Doctor not found or not verified.', 404)
       
    
       const jsDay = bookingDate.getDay();
       const DayNum = jsDay === 0 ? 7:jsDay;
       if((doctor.holidays||'').includes(DayNum)){
      throw new AppError('Doctor is not available on this day.', 400)
       }

       const duplicate = await Booking.findOne({
        docID, patID,
      date: bookingDate,
      slot: slotUpper,
      status: { $in: ['PENDING', 'CONFIRMED', 'CONSULTING'] },
       }).session(session);

       if(duplicate) throw new AppError('You already have a booking for thid slot',409)


     const { capacity, bookings, nextToken } = slotFields[slotUpper];

const avail = await DoctorAvailability.findOneAndUpdate(
  {
    docID,
    date: bookingDate,
    [bookings]: { $lt: doctor[capacity] },
  },
  {
    $inc: {
      [bookings]: 1,
      [nextToken]: 1,
    },
  },
  {
    returnDocument: "after",
    session,
  }
);

if (!avail) {
  const availRecord = await DoctorAvailability.findOne({
    docID,
    date: bookingDate,
  }).session(session);

  if (!availRecord) {
    throw new AppError(
      "Availability record not found. Doctor may not have set up slots.",
      400
    );
  }

  if (availRecord[bookings] >= doctor[capacity]) {
    const [waitingBooking] = await Booking.create(
      [
        {
          docID,
          patID,
          date: bookingDate,
          slot: slotUpper,
          consultationType,
          status: "PENDING",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      status: "SUCCESS",
      message: "Slot is full. You have been added to the waiting list.",
      data: waitingBooking,
    });
  }

  throw new AppError("Unable to reserve slot.", 500);
}

// Atomic token number
const tokenNo = avail[nextToken] - 1;
const otp = generateConsultationOTP();
const otpExpiry = new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000);

const [booking] = await Booking.create(
      [{
        docID, patID,
        date:             bookingDate,
        slot:             slotUpper,
        consultationType,
        tokenNo,
        status:           'CONFIRMED',
        otp,
        otpExpiry,
      }],
      { session }
    );

    await Doctor.findByIdAndUpdate(docID, { $inc: { patientCount: 1 } }, { session });

await session.commitTransaction();
   

     const patient = await Patient.findById(patID).select('email name');
    sendBookingConfirmationEmail(
      patient.email, patient.name, doctor.name,
      bookingDate, slotUpper, tokenNo, otp
    ).catch(console.error);

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Appointment booked successfully.',
      data: { bookingId: booking._id, tokenNo, status: booking.status, otp },
    }); 




    } catch (err) {
         if (session.inTransaction()) {
        await session.abortTransaction();
    }
    next(err);
        
    }
  finally{
    session.endSession();
}
}






// GET /api/booking/patient-bookings?status=
//patient can ask any type of booking

exports.fetchPatientBookings = async (req,res,next)=>{
    try {
        const {status} = req.query;
        const query ={patID:req.user.id}

         if (status) query.status = status.toUpperCase();

          const bookings = await Booking.find(query)
      .populate('docID', 'name photo specialization1 designation city facilityName consultationFee')
      .sort({ createdAt: -1 });

       res.status(200).json({ status: 'SUCCESS', count: bookings.length, data: bookings });

        
    } catch (err) {
        next(err)
        
    }
}



// GET /api/booking/doctor-bookings?date=

exports.fetchDoctorBookings = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return next(new AppError('date query param is required.', 400));

    const bookingDate = normalizeDate(date);

    const bookings = await Booking.find({
      docID: req.user.id,
      date:  bookingDate,
      status: { $nin: ['CANCELLED'] },
    })
      .populate('patID', 'name email phone photo gender dob')
      .sort({ tokenNo: 1 });

    res.status(200).json({ status: 'SUCCESS', count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};


// PUT /api/booking/start-consultation?id=<bookingId>&otp=<otp>


exports.startConsultation = async (req, res, next) => {
  try {
    const { id, otp } = req.query;
    if (!id || !otp) return next(new AppError('id and otp are required.', 400));

    const booking = await Booking.findById(id);
    if (!booking) return next(new AppError('Booking not found.', 404));
    if (booking.docID.toString() !== req.user.id) {
      return next(new AppError('Not authorised.', 403));
    }
    if (booking.status !== 'CONFIRMED') {
      return next(new AppError('Booking must be CONFIRMED to start consultation.', 400));
    }
    if (booking.otp !== otp) return next(new AppError('Invalid OTP.', 400));

    booking.status = 'CONSULTING';
    await booking.save();

    res.status(200).json({ status: 'SUCCESS', message: 'Consultation started.' });
  } catch (err) {
    next(err);
  }
};




// PUT /api/booking/end-consultation?id=<bookingId>

exports.endConsultation = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) return next(new AppError('id is required.', 400));

    const booking = await Booking.findById(id);
    if (!booking) return next(new AppError('Booking not found.', 404));
    if (booking.docID.toString() !== req.user.id) {
      return next(new AppError('Not authorised.', 403));
    }
    if (booking.status !== 'CONSULTING') {
      return next(new AppError('Consultation has not started yet.', 400));
    }

    booking.status = 'DONE';
    await booking.save();

    res.status(200).json({ status: 'SUCCESS', message: 'Consultation ended.' });
  } catch (err) {
    next(err);
  }
};



// PUT /api/booking/take-feedback?id=<bookingId>
// Body: { rating, feedback }



exports.takeFeedback = async (req, res, next) => {
  try {
    const { id } = req.query;
    const { rating, feedback } = req.body;

    if (!rating) return next(new AppError('rating is required.', 400));

    const booking = await Booking.findOne({ _id: id, patID: req.user.id });
    if (!booking) return next(new AppError('Booking not found.', 404));
    if (booking.status !== 'DONE') {
      return next(new AppError('Feedback can only be submitted after consultation is completed.', 400));
    }
    if (booking.rating) {
      return next(new AppError('Feedback already submitted for this booking.', 409));
    }

    booking.rating   = Number(rating);
    booking.feedback = feedback || '';
    await booking.save();

    // Recalculate doctor's average rating
    const ratedBookings = await Booking.find({ docID: booking.docID, rating: { $ne: null } });
    const avgRating = ratedBookings.reduce((sum, b) => sum + b.rating, 0) / ratedBookings.length;
    await Doctor.findByIdAndUpdate(booking.docID, { rating: parseFloat(avgRating.toFixed(1)) });

    res.status(200).json({ status: 'SUCCESS', message: 'Feedback submitted.' });
  } catch (err) {
    next(err);
  }
};



// PUT /api/booking/emergency-cancel   (DOCTOR) – cancel all bookings for today
// Body: { date, reason }

exports.emergencyCancel = async (req, res, next) => {
  try {
    const { date, reason } = req.body;
    if (!date) return next(new AppError('date is required.', 400));

    const cancelDate = normalizeDate(date);
    const docID      = req.user.id;

    const bookings = await Booking.find({
      docID,
      date:   cancelDate,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    }).populate('patID', 'email name');

    if (!bookings.length) {
      return res.status(200).json({ status: 'SUCCESS', message: 'No upcoming bookings to cancel.' });
    }

    const doctor = await Doctor.findById(docID).select('name');

    // Bulk cancel
    await Booking.updateMany(
      { docID, date: cancelDate, status: { $in: ['CONFIRMED', 'PENDING'] } },
      { $set: { status: 'CANCELLED', cancellationReason: reason || 'Doctor emergency.' } }
    );

    // Zero-out slot capacities for that day
    await DoctorAvailability.findOneAndUpdate(
      { docID, date: cancelDate },
      { $set: { morningCapacity: 0, afternoonCapacity: 0, eveningCapacity: 0 } }
    );

    // Notify patients by email (fire-and-forget)
    bookings.forEach((b) => {
      sendCancellationEmail(b.patID.email, b.patID.name, doctor.name, cancelDate, reason).catch(console.error);
    });

    res.status(200).json({
      status: 'SUCCESS',
      message: `${bookings.length} booking(s) cancelled and patients notified.`,
    });
  } catch (err) {
    next(err);
  }
};


// GET /api/booking/patient-report-bookings?patID=<id>   (DOCTOR)
// Doctor fetches all DONE/CONSULTING bookings of a patient to access their reports

exports.getPatientBookingsForDoctor = async (req, res, next) => {
  try {
    const { patID } = req.query;
    if (!patID) return next(new AppError('patID is required.', 400));

    // Verify the doctor has (or has had) a consultation with this patient
    const hasRelation = await Booking.findOne({
      docID: req.user.id,
      patID,
      status: { $in: ['CONFIRMED', 'CONSULTING', 'DONE'] },
    });
    if (!hasRelation) {
      return next(new AppError('No consultation relationship found with this patient.', 403));
    }

    const bookings = await Booking.find({ patID })
      .populate('docID', 'name specialization1')
      .sort({ date: -1 });

    res.status(200).json({ status: 'SUCCESS', data: bookings });
  } catch (err) {
    next(err);
  }
};





exports.updateCapacity = async (req,res,next)=>{

    const session = await mongoose.startSession();

    session.startTransaction();

    try {

        const docID = req.user.id;

        const {
            date,
            morningCapacity,
            afternoonCapacity,
            eveningCapacity
        } = req.body;


        if(!date){
            return next(
                new AppError(
                    "Date required",
                    400
                )
            );
        }


       


        const availability =
            await DoctorAvailability.findOneAndUpdate(
                {
                    docID,
                    date:new Date(date)
                },
                {
                    morningCapacity,
                    afternoonCapacity,
                    eveningCapacity
                },
                {
                    new:true,
                    session
                }
            );


        if(!availability){

            await session.abortTransaction();
            session.endSession();

            return next(
                new AppError(
                    "Availability not found",
                    404
                )
            );
        }



        await session.commitTransaction();
        session.endSession();



        // After capacity update
        await confirmPendingBookings(
            docID,
            new Date(date),
            "MORNING"
        );


        await confirmPendingBookings(
            docID,
            new Date(date),
            "AFTERNOON"
        );


        await confirmPendingBookings(
            docID,
            new Date(date),
            "EVENING"
        );



        res.status(200).json({

            status:"SUCCESS",

            message:
            "Capacity updated and pending bookings processed"

        });


    }
    catch(err){

        await session.abortTransaction();
        session.endSession();

        next(err);
    }

};




// GET /api/booking/agora-token?bookingId=<id>

exports.getAgoraToken = async (req, res, next) => {
  try {
    const { bookingId } = req.query;
    if (!bookingId) return next(new AppError('bookingId query param is required.', 400));

    const booking = await Booking.findById(bookingId);
    if (!booking) return next(new AppError('Booking not found.', 404));

   
    if (booking.consultationType !== 'ONLINE') {
      return next(new AppError('Agora token is only available for ONLINE consultations.', 400));
    }

    
    const callerId = req.user.id.toString();
    const isDoctor  = booking.docID.toString() === callerId;
    const isPatient = booking.patID.toString() === callerId;

    if (!isDoctor && !isPatient) {
      return next(new AppError('You are not authorised to join this consultation.', 403));
    }

   
    if (!['CONFIRMED', 'CONSULTING'].includes(booking.status)) {
      return next(new AppError('Consultation is not active. Status must be CONFIRMED or CONSULTING.', 400));
    }

  
    const channelName = `vedkriti_${bookingId}`;

    // Doctor = uid 1, Patient = uid 2
    const uid = isDoctor ? 1 : 2;

    const expirySeconds = 3600; // 1 hour
 
    const token = generateAgoraToken(channelName, uid, expirySeconds);

    res.status(200).json({
      status: 'SUCCESS',
      data: {
        channelName,
        token,
        uid,
        appId: process.env.AGORA_APP_ID,
        expirySeconds,
      },
    });
  } catch (err) {
    next(err);
  }
};
