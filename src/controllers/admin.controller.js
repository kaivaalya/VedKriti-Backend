const Doctor = require("../models/Doctor.model");
const Patient = require("../models/Patient.model");
const Admin = require("../models/Admin.model");
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
                    <div style="font-family:sans-serif;max-width:480px;margin:auto">
                        <h2 style="color:#16a34a">
                            Account Verified ✓
                        </h2>

                        <p>Dear Dr. ${doctor.name},</p>

                        <p>
                            Congratulations! Your doctor account has been successfully verified.
                        </p>

                        <p>
                            You can now log in and start using all doctor features on <strong>VEDKRITI</strong>.
                        </p>

                        <p>Thank you for joining VEDKRITI.</p>
                    </div>
                    `
                );
            } else {
                await sendMail(
                    doctor.email,
                    "Doctor Verification Update – VEDKRITI",
                    `
                    <div style="font-family:sans-serif;max-width:480px;margin:auto">
                        <h2 style="color:#dc2626">
                            Verification Rejected
                        </h2>

                        <p>Dear Dr. ${doctor.name},</p>

                        <p>
                            Unfortunately, your doctor verification request was not approved.
                        </p>

                        <p>
                            <strong>Reason:</strong>
                            ${doctor.verificationNote}
                        </p>

                        <p>
                            Please update the required information/documents and submit them again.
                        </p>

                        <p>Thank you,<br>VEDKRITI Team</p>
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
