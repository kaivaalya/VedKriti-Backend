
const Patient = require('../models/Patient.model');
const Booking = require('../models/Booking.model');
const { uploadToCloudinary } = require('../configs/cloudinary.config');
const AppError = require('../utils/AppError');




// GET /api/patient/profile

exports.getProfile= async (req,resizeBy,next)=>{

    try {
        const patient = await Patient.findById(req.user.id).select('-passwors');
        if(!patient)return next(new AppError('patient not found ',404));
        res.status(200).json({status:'SUCCESS',data: patient});
    } catch (err) {
        next(err)
        
    }
}


// PUT /api/patient/update-profile  

exports.updateProfile =async (req,res,next)=>{
    try 
    {
        const {name,phone,gender,dob,address}=req.body;
        const updateData = { name, phone, gender, dob, address };


        if(req.file){

            const result = await uploadToCloudinary(req.file.buffer,'patient_photo','image');

            updateData.photo = result.secure_url;
        }



        const patient = await patient.findByIdAndUpdate(req.user.id,updateData,{returnDocument:true }).select('-password')
        
        res.status(200).json({ status: 'SUCCESS', data: patient });
    } catch (err) {
        next(err)
        
    }
}


// POST /api/patient/pre-diagnosis


exports.submitPreDiagnosis = async (req,res,next)=>{

    try {
        const {bookingId,preDiagnosis}=req.body;

        if(!bookingId||!preDiagnosis) {
            return next(new AppError('booking and preDiagnosis are required',400));

        }

        const booking = await Booking.findOne({ _id: bookingId, patID: req.user.id})
        if (!booking) return next(new AppError('Booking not found.', 404));
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return next(new AppError('Pre-diagnosis can only be submitted before consultation starts.', 400));
    }

     booking.preDiagnosis = preDiagnosis;
    await booking.save();
        
    } catch (err) {
        next(err)
        
    }
}