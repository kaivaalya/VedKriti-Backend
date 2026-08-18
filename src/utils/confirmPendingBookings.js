const mongoose = require('mongoose');
const Booking = require('../models/Booking.model');
const DoctorAvailability = require("../models/DoctorAvailability.model");
const Patient = require("../models/Patient.model");
const Doctor  = require("../models/Doctor.model");


const {
    generateConsultationOTP
} = require("./otp.utils");


const {
    sendBookingConfirmationEmail
} = require("../configs/mailer.config");



const slotFields = {

    MORNING: {
        capacity: "morningCapacity",
        bookings: "morningBookings",
        nextToken: "morningNextToken"
    },

    AFTERNOON: {
        capacity: "afternoonCapacity",
        bookings: "afternoonBookings",
        nextToken: "afternoonNextToken"
    },

    EVENING: {
        capacity: "eveningCapacity",
        bookings: "eveningBookings",
        nextToken: "eveningNextToken"
    }

};




const confirmPendingBookings =
    async (
        docID,
        date,
        slot
    ) => {


        const session =
            await mongoose.startSession();


        session.startTransaction();



        try {


            const {
                capacity,
                bookings,
                nextToken
            }
                =
                slotFields[slot];



            const availability =
                await DoctorAvailability.findOne({
                    docID,
                    date
                })
                    .session(session);



            if (!availability) {

                await session.abortTransaction();
                session.endSession();

                return;
            }




            // calculate free seats

            let freeSeats =
                availability[capacity]
                -
                availability[bookings];



            if (freeSeats <= 0) {

                await session.commitTransaction();
                session.endSession();

                return;
            }




            // oldest pending patients first

            // fetch doctor name once for emails
            const doctor     = await Doctor.findById(docID).select('name').session(session);
            const doctorName = doctor?.name || 'Doctor';

            const pendingBookings =
                await Booking.find({

                    docID,

                    date,

                    slot,

                    status: "PENDING"

                })
                    .sort({
                        createdAt: 1
                    })
                    .limit(freeSeats)
                    .session(session);




            for (const booking of pendingBookings) {



                // get token from the availability record directly
                const tokenNo = availability[nextToken];



                // generate otp

                const otp =
                    generateConsultationOTP();



                const otpExpiry =
                    new Date(
                        date.getTime()
                        +
                        24 * 60 * 60 * 1000
                    );




                booking.status = "CONFIRMED";

                booking.tokenNo = tokenNo;

                booking.otp = otp;

                booking.otpExpiry = otpExpiry;



                await booking.save({
                    session
                });



                // increase booked seats AND the nextToken counter

                availability[bookings]++;
                availability[nextToken]++;





                // send email after confirmation

                const patient =
                    await Patient.findById(
                        booking.patID
                    )
                        .select(
                            "name email"
                        );



                sendBookingConfirmationEmail(

                    patient.email,

                    patient.name,

                    doctorName,   // ✅ actual name, not ObjectId

                    date,

                    slot,

                    tokenNo,

                    otp

                )
                    .catch(console.error);



            }



            await availability.save({
                session
            });



            await session.commitTransaction();

            session.endSession();



        }

        catch (err) {

            await session.abortTransaction();

            session.endSession();

            throw err;

        }



    };


module.exports = {confirmPendingBookings};