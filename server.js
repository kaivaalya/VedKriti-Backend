require("dotenv").config()
const app = require("./src/app");
const connectDB = require("./src/configs/db");

const PORT=3000








const { startScheduledJobs } = require('./src/jobs/scheduler');
const { rolloverDoctorAvailability } = require('./src/utils/availability.utils');

startScheduledJobs();
rolloverDoctorAvailability().catch(console.error); // backfill once on boot too

connectDB()
app.listen(PORT,()=>{
    console.log("server started")
})
