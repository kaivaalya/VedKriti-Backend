const cron = require("node-cron");

const Doctor = require("../models/Doctor.model");
const DoctorAvailability = require("../models/DoctorAvailability.model");



const regenrateAvailability = async (
    docID,
    morningCap,
    afternoonCap,
    eveningCap,
    holidays
) => {

    const today = new Date();
    today.setHours(0,0,0,0);

    const holidayDays = String(holidays || "")
        .split("")
        .map(Number);

    const ops=[];

    for(let i=0;i<14;i++){

        const date=new Date(today);
        date.setDate(date.getDate()+i);

        const jsDay=date.getDay();
        const dayNum=jsDay===0?7:jsDay;

        const isHoliday=holidayDays.includes(dayNum);

        ops.push({

            updateOne:{

                filter:{
                    docID,
                    date
                },

                update:{
                    $set:{
                        morningCapacity:isHoliday?0:morningCap,
                        afternoonCapacity:isHoliday?0:afternoonCap,
                        eveningCapacity:isHoliday?0:eveningCap
                    }
                },

                upsert:true
            }

        });

    }

    await DoctorAvailability.bulkWrite(ops);

};


cron.schedule("* * * * *", async () => {

    try {

        console.log("Running Availability Cron...");

        const today = new Date();
        today.setHours(0,0,0,0);

        await DoctorAvailability.deleteMany({
            date: {
                $lt: today
            }
        });

        const doctors = await Doctor.find();

        for (const doctor of doctors) {

            await regenrateAvailability(

                doctor._id,

                doctor.morningCapacity,

                doctor.afternoonCapacity,

                doctor.eveningCapacity,

                doctor.holidays

            );

        }

        console.log("Availability updated successfully.");

    }
    catch(err){

        console.error(err);

    }

});
