const express = require("express")
const cors = require('cors');
const cookieParser=require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const doctorRouter= require("./routes/doctor.routes")
const patientRouter=require("./routes/patient.routes")
const bookingRouter=require("./routes/booking.routes")
const reportRouter=require("./routes/report.routes")
const adminRouter=require("./routes/admin.routes")

const app=express()

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ved-kriti-frontend.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
   
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};


app.use(cors(corsOptions));


app.options(/.*/, cors());

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth",authRouter)
app.use("/api/doctor",doctorRouter)
app.use("/api/patient",patientRouter)
app.use("/api/booking",bookingRouter)
app.use("/api/report",reportRouter)
app.use("/api/admin",adminRouter)






app.use((req, res) => {
  res.status(404).json({ status: 'ERROR', message: `Cannot ${req.method} ${req.originalUrl}` });
});


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';
  console.error(`[ERROR] ${statusCode} – ${message}`, err.stack || '');
  res.status(statusCode).json({
    status:  err.isOperational ? 'ERROR' : 'INTERNAL_ERROR',
    message,
  });
});

module.exports = app




