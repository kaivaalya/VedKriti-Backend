const Doctor = require("../models/Doctor.model");
const Patient = require("../models/Patient.model");
const Admin = require("../models/Admin.model");
const Booking=require("../models/Booking.model");
const AppError = require("../utils/AppError");
const DoctorDocument = require("../models/DoctorDocument.model");
const bcrypt = require("bcryptjs");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require("../utils/jwt.utils");
const {
    sendMail
} = require("../configs/mailer.config");
exports.adminLogin = async(req,res,next)=>{
 try {

    
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

     
        if (!admin) {
            return next(new AppError("Invalid email or password.", 401));
        }

     
        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin.password
        );

  
        if (!isPasswordCorrect) {
            return next(new AppError("Invalid email or password.", 401));
        }

    
        const accessToken = generateAccessToken({
            id: admin._id,
            role: "ADMIN",
        });

        const refreshToken = generateRefreshToken({
            id: admin._id,
            role: "ADMIN",
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

     
        res.status(200).json({
            status: "SUCCESS",
            message: "Admin login successful.",
            accessToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (err) {
        next(err);
    }
}

exports.verify = async(req,res,next)=>{
 try {

        const admin = await Admin.findById(req.user.id).select("-password");

        if (!admin) {
            return next(new AppError("Admin not found.", 404));
        }

        res.status(200).json({
            status: "SUCCESS",
            admin
        });

    } catch (err) {
        next(err);
    }
}

exports.refreshToken = async(req,res,next)=>{
try {

       
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return next(new AppError("Refresh token not found.", 401));
        }

       
        
        const decoded = verifyRefreshToken(refreshToken);

        
        const admin = await Admin.findById(decoded.id);

        if (!admin) {
            return next(new AppError("Admin not found.", 404));
        }

        
        
        const accessToken = generateAccessToken({
            id: admin._id,
            role: "ADMIN"
        });

      
        
        res.status(200).json({
            status: "SUCCESS",
            accessToken
        });

    } catch (err) {
        next(err);
    }
}

exports.logout = async(req,res,next)=>{
 try {

        res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
});

        res.status(200).json({
            status: "SUCCESS",
            message: "Logout successful."
        });

    } catch (err) {
        next(err);
    }
}

exports.getPlatformStats = async (req, res, next) => {
    try {
        const totalDoctors = await Doctor.countDocuments();

        const verifiedDoctors = await Doctor.countDocuments({
            verified: true,
        });

        const pendingDoctors = await Doctor.countDocuments({
            verified: false,
        });

        const totalPatients = await Patient.countDocuments();

        const totalBookings = await Booking.countDocuments();

        const completedConsultations = await Booking.countDocuments({
            status: "COMPLETED",
        });

        res.status(200).json({
            status: "SUCCESS",
            data: {
                totalDoctors,
                verifiedDoctors,
                pendingDoctors,
                totalPatients,
                totalBookings,
                completedConsultations,
            },
        });
    } catch (err) {
        next(err);
    }
};

exports.getPendingDoctors = async(req,res,next)=>{
    try{
      const PendingDoctors=await Doctor.find(
        {
            verified:false
        },
        "name email specialization1 city institute photo"
      )
      res.status(200).json({
        status:"pending doc",
        data:PendingDoctors
      })

      
            
       
    }
    catch(err){
        next(err)
    }

}



   exports.verifyDoctor = async (req, res, next) => {
   try {
    if (verified) {
        await sendMail(
            doctor.email,
            "🎉 Your VEDKRITI Doctor Account Has Been Verified",
            `
            <div style="margin:0;padding:40px;background:#f4f7fb;font-family:Arial,sans-serif;">
                <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.1);">

                    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:30px;text-align:center;">
                        <h1 style="color:#fff;margin:0;">VEDKRITI</h1>
                        <p style="color:#dbeafe;margin-top:8px;">Doctor Verification</p>
                    </div>

                    <div style="padding:35px;">
                        <h2 style="color:#16a34a;margin-top:0;">
                            ✅ Congratulations Dr. ${doctor.name}!
                        </h2>

                        <p style="font-size:16px;color:#444;">
                            Your doctor account has been successfully verified.
                        </p>

                        <div style="background:#ecfdf5;border-left:5px solid #16a34a;padding:18px;border-radius:8px;margin:25px 0;">
                            <strong>Status:</strong> VERIFIED
                        </div>

                        <p style="color:#555;">
                            You can now log in and start accepting appointments through
                            <strong>VEDKRITI</strong>.
                        </p>

                        <div style="text-align:center;margin:35px 0;">
                            <a href="https://yourwebsite.com/login"
                               style="background:#2563eb;color:#fff;padding:14px 30px;
                                      text-decoration:none;border-radius:8px;
                                      display:inline-block;font-weight:bold;">
                                Login Now
                            </a>
                        </div>

                        <p style="font-size:14px;color:#777;">
                            Thank you for joining the VEDKRITI healthcare network.
                        </p>
                    </div>

                    <div style="background:#f8fafc;padding:18px;text-align:center;font-size:13px;color:#888;">
                        © ${new Date().getFullYear()} VEDKRITI. All Rights Reserved.
                    </div>

                </div>
            </div>
            `
        );
    } else {
        await sendMail(
            doctor.email,
            "VEDKRITI Doctor Verification Update",
            `
            <div style="margin:0;padding:40px;background:#f4f7fb;font-family:Arial,sans-serif;">
                <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.1);">

                    <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:30px;text-align:center;">
                        <h1 style="color:#fff;margin:0;">VEDKRITI</h1>
                        <p style="color:#fecaca;margin-top:8px;">Doctor Verification</p>
                    </div>

                    <div style="padding:35px;">

                        <h2 style="color:#dc2626;margin-top:0;">
                            Verification Not Approved
                        </h2>

                        <p style="font-size:16px;color:#444;">
                            Dear Dr. ${doctor.name},
                        </p>

                        <p style="color:#555;">
                            Unfortunately, your verification request could not be approved at this time.
                        </p>

                        <div style="background:#fef2f2;border-left:5px solid #dc2626;padding:18px;border-radius:8px;margin:25px 0;">
                            <strong>Reason:</strong><br>
                            ${doctor.verificationNote}
                        </div>

                        <p style="color:#555;">
                            Please update your documents or information and submit your verification request again.
                        </p>

                        <div style="text-align:center;margin:35px 0;">
                            <a href="https://yourwebsite.com"
                               style="background:#dc2626;color:#fff;padding:14px 30px;
                                      text-decoration:none;border-radius:8px;
                                      display:inline-block;font-weight:bold;">
                                Update Documents
                            </a>
                        </div>

                    </div>

                    <div style="background:#f8fafc;padding:18px;text-align:center;font-size:13px;color:#888;">
                        © ${new Date().getFullYear()} VEDKRITI. All Rights Reserved.
                    </div>

                </div>
            </div>
            `
        );
    }
} catch (mailError) {
    console.error("Email sending failed:", mailError);
}
};


exports.getAllDoctors = async(req,res,next)=>{
 try {

        const doctors = await Doctor.find(
            {},
            "name email specialization1 city institute photo verified"
        );

        res.status(200).json({
            status: "SUCCESS",
            data: doctors
        });

    } catch (err) {
        next(err);
    }
}

exports.getDoctorDocuments = async(req,res,next)=>{
  try {
        const { id } = req.params;

        const documents = await DoctorDocument.find({
            docID: id
        });

        res.status(200).json({
            status: "SUCCESS",
            data: documents
        });

    } catch (err) {
        next(err);
    }
}

exports.removeDoctor = async(req,res,next)=>{
 try {

        const { id } = req.params;

        const doctor = await Doctor.findByIdAndDelete(id);

        if (!doctor) {
            return next(new AppError("Doctor not found.", 404));
        }

        res.status(200).json({
            status: "SUCCESS",
            message: "Doctor removed successfully."
        });

    } catch (err) {
        next(err);
    }
}

exports.getAllPatients = async(req,res,next)=>{
    try{
const patient=await Patient.find({},
     "name email phone gender dob address photo"
)
res.status(200).json({
    status:"success",
    data:patient

})
    }catch(err)
    {
        next(err)
    }

}

exports.removePatient = async(req,res,next)=>{
try {

        const { id } = req.params;

        const patient = await Patient.findByIdAndDelete(id);

        if (!patient) {
            return next(new AppError("Patient not found.", 404));
        }

        res.status(200).json({
            status: "SUCCESS",
            message: "Patient removed successfully."
        });

    } catch (err) {
        next(err);
    }
}
