const Booking = require("../models/booking.model");
const DoctorAvailability = require("../models/doctorAvailability.model");
const Patient = require("../models/patient.model");


const {
    generateConsultationOTP
} = require("./otp");


const {
    sendBookingConfirmationEmail
} = require("../services/email");



const slotFields = {

    MORNING: {
        capacity: "morningCapacity",
        bookings: "morningBookings"
    },

    AFTERNOON: {
        capacity: "afternoonCapacity",
        bookings: "afternoonBookings"
    },

    EVENING: {
        capacity: "eveningCapacity",
        bookings: "eveningBookings"
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
                bookings
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



                // generate token

                const tokenCount =
                    await Booking.countDocuments({

                        docID,

                        date,

                        slot,

                        status: {
                            $in: [
                                "CONFIRMED",
                                "CONSULTING",
                                "DONE"
                            ]
                        }

                    })
                        .session(session);



                const tokenNo =
                    tokenCount + 1;



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



                // increase booked seats

                availability[bookings]++;





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

                    docID,

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