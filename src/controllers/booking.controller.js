const mongoose = require('mongoose');
const Booking               = require('../models/Booking.model');
const Doctor                = require('../models/Doctor.model');
const Patient               = require('../models/Patient.model');
const DoctorAvailability    = require('../models/DoctorAvailability.model');
const { generateConsultationOTP } = require('../utils/otp.utils');
const {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
} = require('../config/mailer.config');
const AppError = require('../utils/AppError');


const normalizeDate = (d)=>{
    const date = new Date(d);
    date.setHours(0,0,0,0);
    return date;
}

const slotFields = {
    MORNING:{capacity:'morningCapacity',bookings:'morningBookings'},
    AFTERNOON: { capacity: 'afternoonCapacity', bookings: 'afternoonBookings' },
  EVENING:   { capacity: 'eveningCapacity',   bookings: 'eveningBookings' },

}


exports.bookDoctor = async (req,resizeBy,next)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        
        const docID=req.query.id;
        const consultationType = (req.query.consultationType||'').toUpperCase();
        const patID=req.user.id;
        const {date , slot }=req.body;



        if(!docID||!date ||!slot){
            return next(new AppError('docID (query), date and slot (body) are required.',400));

        }
        const slotUpper = slot.toUpperCase();
        if(!['MORNING','AFTERNOON','EVENING'].includes(slotUpper)){
            return next(new AppError('slot must be MORNING, AFTERNOON or EVENING.', 400));
        }

        const bookingDate = normalizeDate(date);

        const today = normalizeDate(new Date());
        const end = const maxDate = new Date(today); maxDate.setDate(today.getDate() + 14);
    } catch (err) {
        next(err)
        
    }
}