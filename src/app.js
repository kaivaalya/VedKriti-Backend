const express = require("express")
const cookieParser=require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const doctorRouter= require("./routes/doctor.routes")
const patientRouter=require("./routes/patient.routes")
const bookingRouter=require("./routes/booking.routes")
const reportRouter=require("./routes/report.routes")
const adminRouter=require("./routes/admin.routes")

const app=express()


app.use(cookieParser());
app.use(express.json())



app.use("/api/auth",authRouter)
app.use("/api/doctor",doctorRouter)
app.use("/api/patient",patientRouter)
app.use("/api/booking",bookingRouter)
app.use("/api/report",reportRouter)
app.use("/api/admin",adminRouter)





module.exports = app




