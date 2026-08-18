
const Patient = require('../models/Patient.model');
const Booking = require('../models/Booking.model');
const { uploadToCloudinary } = require('../configs/cloudinary.config');
const AppError = require('../utils/AppError');




// GET /api/patient/profile

exports.getProfile= async (req,res,next)=>{

    try {
        const patient = await Patient.findById(req.user.id).select('-password');
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



        const patient = await Patient.findByIdAndUpdate(req.user.id,updateData,{returnDocument:true }).select('-password')
        
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
    
    res.status(200).json({ status: 'SUCCESS', message: 'Pre-diagnosis submitted.' });
        
    } catch (err) {
        next(err)
        
    }
}


exports.profileStatus = async (req, res, next) => {
    try {
        const patient = await Patient.findById(req.user.id);

        if (!patient) {
            return next(new AppError("Patient not found.", 404));
        }

        const completed = Boolean(
            patient.name &&
            patient.email &&
            patient.phone &&
            patient.gender &&
            patient.dob &&
            patient.address
        );

        res.status(200).json({
            status: "SUCCESS",
            data: completed
        });

    } catch (err) {
        next(err);
    }
};
