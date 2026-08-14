const{generateAccessToken,generateRefreshToken,verifyAccessToken,verifyRefreshToken}=require("../utils/jwt.utils")
const AppError         = require('../utils/AppError');
const Doctor = require("../models/Doctor.model");



const protect = (req, res, next) => {


    try {
        

        const token =req.cookies.accessToken;

         if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
        const decoded = verifyAccessToken(token);

        req.user = decoded;
        next();
    } catch (err) {
        console.log(err);
        next(err);
    }
};
const restrictTo = (...roles) => (req, res, next) => {
   

    if (!roles.includes(req.user.role)) {
        return next(new AppError("You do not have permission to perform this action.", 403));
    }

    next();
};

const verifedDoctor =async  (req,res,next)=>{

  const doctor = await Doctor.findOne({_id:req.user.id ,  verified:"true"});

  if(!doctor){
    return next(new AppError("Doctor not verified",403));
  }


  next()
}

module.exports = { protect, restrictTo , verifedDoctor};



