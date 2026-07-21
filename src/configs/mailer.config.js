const nodemailer = require('nodemailer');
require("dotenv").config()



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.GOOGLE_USER,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});


transporter.verify((err, success) => {
  if (err) {
    console.error(err);
  } else {
    console.log("SMTP Ready");
  }
});
const sendMail = async (to, subject, html) => {
  const mailOptions = {
    from: `"DocApp" <${process.env.GOOGLE_USER}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// ── Pre-built email templates ─────────────────────────────────────────────────

const sendOTPEmail = (to, otp) =>
  sendMail(
    to,
    'Your OTP – DocApp Verification',
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Email Verification</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="letter-spacing:8px;color:#2563EB">${otp}</h1>
      <p>This OTP is valid for <strong>10 minutes</strong>.</p>
      <p>Do not share this OTP with anyone.</p>
    </div>`
  );

const sendCancellationEmail = (to, patientName, doctorName, date, reason) =>
  sendMail(
    to,
    'Appointment Cancelled – DocApp',
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Appointment Cancellation Notice</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment with <strong>Dr. ${doctorName}</strong> scheduled on 
         <strong>${new Date(date).toDateString()}</strong> has been <span style="color:red">cancelled</span>.</p>
      <p><strong>Reason:</strong> ${reason || 'Emergency cancellation by doctor.'}</p>
      <p>We apologise for the inconvenience. Please book another appointment at your convenience.</p>
    </div>`
  );

const sendBookingConfirmationEmail = (to, patientName, doctorName, date, slot, tokenNo, otp) =>
  sendMail(
    to,
    'Booking Confirmed – DocApp',
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#16a34a">Booking Confirmed ✓</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been confirmed.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px"><strong>Date</strong></td><td>${new Date(date).toDateString()}</td></tr>
        <tr><td style="padding:6px"><strong>Slot</strong></td><td>${slot}</td></tr>
        <tr><td style="padding:6px"><strong>Token No.</strong></td><td style="font-size:1.4rem;font-weight:bold">${tokenNo}</td></tr>
        <tr><td style="padding:6px"><strong>Consultation OTP</strong></td><td style="font-size:1.4rem;letter-spacing:4px;color:#2563EB">${otp}</td></tr>
      </table>
      <p style="color:#6b7280;font-size:0.85rem">Present this OTP to the doctor at the time of consultation.</p>
    </div>`
  );

module.exports = { sendMail, sendOTPEmail, sendCancellationEmail, sendBookingConfirmationEmail };
