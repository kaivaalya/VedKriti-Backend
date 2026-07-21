const bcrypt    = require('bcryptjs');
const TempUser  = require('../models/TempUser.model');
const Doctor    = require('../models/Doctor.model');
const Patient   = require('../models/Patient.model');
const Admin     = require('../models/Admin.model');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otp.utils');
const{generateAccessToken,generateRefreshToken,verifyAccessToken,verifyRefreshToken}=require("../utils/jwt.utils")
const { sendOTPEmail }   = require('../configs/mailer.config');
const AppError           = require('../utils/AppError');



//POST /api/auth/signin-user

exports.signinUpUser = async (req,res,next)=>{
try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return next(new AppError('name, email, password and role are required.', 400));
    }
    if (!['PATIENT', 'DOCTOR'].includes(role)) {
      return next(new AppError('role must be PATIENT or DOCTOR.', 400));
    }

  
    const existingPatient = await Patient.findOne({ email });
    const existingDoctor  = await Doctor.findOne({ email });
    if (existingPatient || existingDoctor) {
      return next(new AppError('Email already registered.', 409));
    }


    const hashedPassword = await bcrypt.hash(password, 12);
    const otp            = generateOTP();
    const otpExpiry      = getOTPExpiry();

    await TempUser.findOneAndUpdate(
      { email },
      { name, email, password: hashedPassword, role, otp, otpExpiry },
      { upsert: true,returnDocument: "after", setDefaultsOnInsert: true }
    );

    await sendOTPEmail(email, otp);

    res.status(201).json({
      status:  'SUCCESS',
      message: 'OTP sent successfully. Please verify your email.',
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/auth/resend-otp

exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email is required.', 400));

    // Reject if already fully verified
    const alreadyPatient = await Patient.findOne({ email });
    const alreadyDoctor  = await Doctor.findOne({ email });
    if (alreadyPatient || alreadyDoctor) {
      return next(new AppError('User already verified.', 409));
    }

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) return next(new AppError('User not found. Please sign up first.', 404));

    const otp       = generateOTP();
    const otpExpiry = getOTPExpiry();

    tempUser.otp       = otp;
    tempUser.otpExpiry = otpExpiry;
    await tempUser.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ status: 'SUCCESS', message: 'OTP has been resent successfully.' });
  } catch (err) {
    next(err);
  }
};


 // POST /api/auth/verify-user


exports.verifyUser = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError('email and otp are required.', 400));

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) return next(new AppError('User not found or OTP already used.', 404));

    if (isOTPExpired(tempUser.otpExpiry)) {
      await TempUser.deleteOne({ email });
      return next(new AppError('OTP has expired. Please sign up again.', 410));
    }
    if (tempUser.otp !== otp) {
      return next(new AppError('Invalid OTP.', 400));
    }

    // Move to final collection
    if (tempUser.role === 'PATIENT') {
      await Patient.create({
        name:     tempUser.name,
        email:    tempUser.email,
        password: tempUser.password,
      });
    } else {
      await Doctor.create({
        name:     tempUser.name,
        email:    tempUser.email,
        password: tempUser.password,
      });
    }

    await TempUser.deleteOne({ email });

    res.status(200).json({ status: 'SUCCESS', message: 'Account verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};






// POST /api/auth/login-user

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return next(new AppError('email, password and role are required.', 400));
    }

    let user;
    if (role === 'PATIENT') {
      user = await Patient.findOne({ email });
    } else if (role === 'DOCTOR') {
      user = await Doctor.findOne({ email });
    } else if (role === 'ADMIN') {
      user = await Admin.findOne({ email });
    } else {
      return next(new AppError('Invalid role.', 400));
    }

    if (!user) return next(new AppError('Invalid credentials.', 401));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AppError('Invalid credentials.', 401));

    // Check unverified (stored in TempUser still)
    const isTemp = await TempUser.findOne({ email });
    if (isTemp) return next(new AppError('Account not verified. Please verify your OTP.', 403));

    const refreshToken = generateRefreshToken({ id: user._id.toString(), role });
    const accessToken = generateAccessToken({ id: user._id.toString(), role });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
      status: 'SUCCESS',
      token: accessToken,
      userId: user._id,
      role,
      name:   user.name,
    });
  } catch (err) {
    next(err);
  }
};



// POST /api/auth/refreshToken

exports.refreshToken = (req, res, next) => {
try{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
         throw new AppError('No token provided. Please log in.', 401);
    }


    const decoded = verifyRefreshToken(refreshToken)


    const accessToken = generateAccessToken({id: decoded._id.toString(), role: decoded.role})

    const newRefreshToken= generateRefreshToken({id: decoded._id.toString(), role: decoded.role})


     res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

     res.status(200).json({
        message: "Access token refreshed successfully",
         accessToken 
    })


}
catch(err){
    next(err)
}


}