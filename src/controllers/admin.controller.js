const Doctor = require("../models/Doctor.model");
const Patient = require("../models/Patient.model");
const AppError = require("../utils/AppError");
const bcrypt = require("bcrypt");
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../utils/jwt.utils");
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
            role: "admin",
        });

        const refreshToken = generateRefreshToken({
            id: admin._id,
            role: "admin",
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
            role: "admin"
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

        res.clearCookie("refreshToken");

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
            verified: true
        });

        const pendingDoctors = await Doctor.countDocuments({
            verified: false
        });

  
        const totalPatients = await Patient.countDocuments();

        res.status(200).json({
            status: "SUCCESS",
            data: {
                totalDoctors,
                verifiedDoctors,
                pendingDoctors,
                totalPatients,
                totalBookings: 0,
                completedConsultations: 0
            }
        });

    } catch (err) {
        next(err);
    }
};

exports.getPendingDoctors = async(req,res)=>{
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
        const { verified, verificationNote } = req.body;

        const doctor = await Doctor.findById(id);

        if (!doctor) {
            return next(new AppError("Doctor not found.", 404));
        }

        doctor.verified = verified;

        if (verificationNote) {
            doctor.verificationNote = verificationNote;
        }

        await doctor.save();

        res.status(200).json({
            status: "SUCCESS",
            message: verified
                ? "Doctor verified successfully."
                : "Doctor verification rejected.",
            data: doctor
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
    data:"patient"

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
