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
        const { id } = req.params;
        let { verified, verificationNote } = req.body;
        // Convert string to boolean if needed
        if (typeof verified === "string") {
            verified = verified.toLowerCase() === "true";
        }
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return next(new AppError("Doctor not found.", 404));
        }
        doctor.verified = verified;
        // Save verification note only when rejected
        if (!verified) {
            doctor.verificationNote =
                verificationNote || "Please review your submitted information.";
        } else {
            doctor.verificationNote = "";
        }
        await doctor.save();
        try {
            if (verified) {
                await sendMail(
                    doctor.email,
                    "Doctor Account Verified VEDKRITI",
                    `
                    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#f4f9f7;padding:24px;border-radius:12px;">
                        <div style="background:linear-gradient(135deg,#16a34a,#0d9488);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
                            <div style="font-size:44px;line-height:1;margin-bottom:8px;">🩺✅</div>
                            <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">VEDKRITI</h1>
                            <p style="color:#e6fff5;margin:4px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Healthcare Platform</p>
                        </div>

                        <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                            <h2 style="color:#16a34a;margin-top:0;font-size:20px;">
                                ✓ Account Verified
                            </h2>
                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                Dear Dr. ${doctor.name},
                            </p>
                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                Congratulations! Your doctor account has been successfully
                                <strong style="color:#16a34a;">verified</strong>.
                            </p>
                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                You can now log in and start using all doctor features on
                                <strong>VEDKRITI</strong>.
                            </p>

                            <div style="text-align:center;margin:28px 0;">
                                <a href="https://ved-kriti-frontend.vercel.app/doc-dashboard/home.html" style="background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
                                    Go to Dashboard
                                </a>
                            </div>

                            <p style="color:#555;font-size:14px;">Thank you for joining VEDKRITI.</p>
                        </div>

                        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
                            © ${new Date().getFullYear()} VEDKRITI. All rights reserved.
                        </p>
                    </div>
                    `
                );
            } else {
                await sendMail(
                    doctor.email,
                    "Doctor Verification Update – VEDKRITI",
                    `
                    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:auto;background:#fdf5f4;padding:24px;border-radius:12px;">
                        <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:12px 12px 0 0;padding:32px 24px;text-align:center;">
                            <div style="font-size:44px;line-height:1;margin-bottom:8px;">🩺⚠️</div>
                            <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">VEDKRITI</h1>
                            <p style="color:#fde8e8;margin:4px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Healthcare Platform</p>
                        </div>

                        <div style="background:#ffffff;padding:32px 28px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                            <h2 style="color:#dc2626;margin-top:0;font-size:20px;">
                                Verification Rejected
                            </h2>
                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                Dear Dr. ${doctor.name},
                            </p>
                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                Unfortunately, your doctor verification request was not approved.
                            </p>

                            <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;padding:14px 16px;margin:20px 0;">
                                <p style="margin:0;color:#7f1d1d;font-size:14px;">
                                    <strong>Reason:</strong> ${doctor.verificationNote}
                                </p>
                            </div>

                            <p style="color:#333;font-size:15px;line-height:1.6;">
                                Please update the required information/documents and submit them again.
                            </p>

                            <div style="text-align:center;margin:28px 0;">
                                <a href="https://ved-kriti-frontend.vercel.app/doc-details/details.html" style="background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
                                    Update Documents
                                </a>
                            </div>

                            <p style="color:#555;font-size:14px;">Thank you,<br>VEDKRITI Team</p>
                        </div>

                        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
                            © ${new Date().getFullYear()} VEDKRITI. All rights reserved.
                        </p>
                    </div>
                    `
                );
            }
        } catch (mailError) {
            console.error("Email sending failed:", mailError); // Verification is already saved, so don't fail the API because of email
        }
        return res.status(200).json({
            status: "SUCCESS",
            message: verified
                ? "Doctor verified successfully."
                : "Doctor verification rejected.",
            data: doctor,
        });
    } catch (err) {
        next(err);
    }
};
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
exports.getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await Doctor.find(
            {},
            "name email phone specialization1 specialization2 city verified photo"
        );

        res.status(200).json({
            status: "SUCCESS",
            results: doctors.length,
            data: doctors
        });
    } catch (err) {
        next(err);
    }
};
