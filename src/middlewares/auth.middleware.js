const{generateAccessToken,generateRefreshToken,verifyAccessToken,verifyRefreshToken}=require("../utils/jwt.utils")
const AppError         = require('../utils/AppError');



const protect = (req, res, next) => {

    try{
        
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Please log in.', 401);
    }
    const accessToken  = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    next();
    }
    catch(err){
         if (err.name === "TokenExpiredError") {
            return next(new AppError("Access token expired.", 401));
        }

        if (err.name === "JsonWebTokenError") {
            return next(new AppError("Invalid access token.", 401));
        }


        next(err);
    }




}

const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { protect, restrictTo };