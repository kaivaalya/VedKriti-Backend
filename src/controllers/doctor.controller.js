const Doctor = require('../models/Doctor.model');
const DoctorExperience = require('../models/DoctorExperience.model');
const DoctorDocument = require('../models/DoctorDocument.model');
const DoctorAvailability = require('../models/DoctorAvailability.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary.config');
const AppError = require('../utils/AppError');
const { updateOne } = require('../models/Admin.model');


const regenrateAvailability = async (docID, morningCap, afternoonCap, eveningCap, holidays) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0)

    const holidayDays = holidays.split('').map(Number);

    const ops = [];
    for (let i = 0; i < 14; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i);

        const jsDay = date.getDay;
        const dayNum = jsDay === 0 ? 7 : jsDay;
        const isHoliday = holidayDays.includes(dayNum);

        ops.push({
            updateOne: {
                filter: { doctID, date },
                update: {
                    $set: {
                        morningCapacity: isHoliday ? 0 : morningCap,
                        afternoonCapacity: isHoliday ? 0 : afternoonCap,
                        eveningCapacity: isHoliday ? 0 : eveningCap,


                    },
                },
                upsert: true,
            },
        });
    }

    await DoctorAvailability.bulkWrite(ops);
};


put / api / doctor / set - practiceLOcation

// PUT /api/doctor/set-practiceLocation
exports.setPracticeLOcation = async (req, res, next) => {

    try {
        const { city, state, country, address, pin, facilityName, consultationFee } = req.body;
        const { docID } = req.user.id;


        const update = await Doctor.findByIdAndUpdate(
            docID,
            { city, state, country, address, pin, facilityName, consultationFee },
            { returnDocument: "after", runValidator: true }

        );

        if (!update) {
            return next(new AppError('doctor not found', 404));

        }
        res.status(200).json({
            status: 'SUCCESS', message: 'Location updated successfully.'
        })
    } catch (err) {
        next(err);
    }
}

// GET /api/doctor/get-practiceLocation
exports.getPracticeLocation = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select(
            'city state country address pin facilityName consultationFee'
        );
        if (!doctor) return next(new AppError('Doctor not found.', 404));
        res.status(200).json({ status: 'SUCCESS', data: doctor });
    }
    catch (err) {
        next(err)
    }
}

// PUT /api/doctor/set-education
exports.setEducation = async () => {
    try {

        const { institute, degreeType, degreeName, fieldOfStudy, specialization1, specialization2, specialization3 } = req.body;
        await Doctor.findByIdAndUpdate(req.user.id, {
            institute, degreeType, degreeName, fieldOfStudy,
            specialization1, specialization2, specialization3,
        });
        res.status(200).json({ status: 'SUCCESS', message: 'Education updated successfully.' });
    }
    catch (err) {

    }

}
// GET /api/doctor/get-education
exports.getEducation = async (req, res, next) => {
    try {
        const doctor = await Doctor.findById(req.user.id).select('institute degreeType degreeName fieldOfStudy specialization1 specialization2 specialization3');
        res.status(200).json({
            status: 'SUCCESS', data: doctor
        })

    }
    catch (err) {
        next(err)
    }
}

// PUT /api/doctor/set-operationalDetails
exports.setOperationalDetails =async (req,res,next)=>{
    try{
        const {morningCapacity,afternoonCapacity,eveningCapacity,holidays}=req.body;
        const docID= req.user.id;

        const doctor = await Doctor.findByIdAndUpdate(docID,{morningCapacity,afternoonCapacity,eveningCapacity,holidays},
            {returnDocument:true}
        );

        if(!doctor){
            return next(AppError('doctor not found',404))
        }

        await regenrateAvailability(docID, morningCapacity, afternoonCapacity, eveningCapacity, holidays);

        res.status(200).json({status: 'SUCCESS', message: 'Operational details updated.' })

    }
    catch(err){
        next(err)
    }
};

// GET /api/doctor/get-operationalDetails

exports.getOperationalDetails = async (req,res,next)=>{
    try{

    const doctor = await Doctor.findById(req.user.id).select('morningCapacity afternoonCapacity eveningCapacity holidays');
    res.status(200)({ status: 'SUCCESS', data: doctor})
    }
    catch(err){
        next(err)

    }
}

// PUT /api/doctor/set-about 
exports.setAbout = async (req,res,next)=>{
    try{

        const {destination,about}=req.body;
        const docID = req.user.id;
        const updateData = {designation,about};

        if(req.file){
            const result = await uploadToCloudinary(req.file.buffer,'doctor_photos','image');
            updateData.photo = result.secure_url
        }

        await Doctor.findByIdAndUpdate(docID,updateData);
        res.status(200).json({ status: 'SUCCESS', message: 'Profile updated successfully.' });

    }
    catch(err){
        next(err)
    }
}

// GET /api/doctor/get-about
exports.getAbout= (req,res,next)=>{
    try{

        const doctor = Doctor.findById(req.user.id).select('designation about photo name')
        res.status(200).json({ status: 'SUCCESS', data: doctor });
    }
    catch(err){

    }
}

// GET /api/doctor/find-doctor?city=&facilityName=&specialization=&name=&minFee=&maxFee=&minRating=

exports.findDoctor = async (req,res,next)=>{
    try{
         const { city, facilityName, specialization, name, minFee, maxFee, minRating } = req.query;
         const query = {veriified:true};

    if (city)         query.city         = new RegExp(city, 'i');
    if (facilityName) query.facilityName = new RegExp(facilityName, 'i');
    if (name)         query.name         = new RegExp(name, 'i');
    if (specialization) {
      query.$or = [
        { specialization1: new RegExp(specialization, 'i') },
        { specialization2: new RegExp(specialization, 'i') },
        { specialization3: new RegExp(specialization, 'i') },
      ];
    }
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };

    const doctors = await Doctor.find(query).select(
      '-password -holidays -morningCapacity -afternoonCapacity -eveningCapacity'
    );

    if (!doctors.length) return next(new AppError('No doctors found matching your criteria.', 404));

    res.status(200).json({ status: 'SUCCESS', count: doctors.length, data: doctors });
    }
    catch(err){
        next(err)
    }
};

// GET /api/doctor/profile/:id 
exports.getDoctorProfile = async (req,res,next)=>{
    try{
        const doctor = await Doctor.findById(req.params.id).select('-password');
        const experiance = await DoctorExperience.find({docID: req.params.id}).sort({startDate:-1});
        const Document = await DoctorDocument.find({docID: req.params.id,isPublic:true})


        const today = new Date(); today.setHours(0,0,0,0);
        const end = new Date(todat); end.setDate(today.getDate+14)
        const availability= await DoctorAvailability.find({
            docID:req.params.id, date:{
                $gte:today,
                $lt:end
            }
        }).sort({date:1})

        res.status(200).json({status:'SUCCESS',data:{doctor,experiance,documents,availability}});

    }catch(err){
        next(err);
    }



}

// POST /api/doctor/addexperience
exports.addExperiance = async (req,res,next)=>{
    try{
        const {facilityName, designation, startDate, endDate, isCurrent}=req.body
        const exp = await DoctorExperiance.create({
            docID:req.user.id,facilityName, designation, startDate, endDate, isCurrent
        });

        res.status(201).json({status:'SUCCESS',data:exp})
    }
    catch(err){
        next(err)
    }
}

// GET /api/doctor/getexperience 

exports.getExperience = async (req,res,next)=>{
    try{
        const exps = await DoctorExperience.find({docID:req.user.id}).sort({startDate:-1});
        res.status(200).json({status:'SUCCESS',data:exps});
    }catch(err){next(err)}
}

// DELETE /api/doctor/experience/:expId
exports.deleteExperiance = async (req,res,next)=>{
    try{
        const exp = await DoctorExperience.findOneAndDelete({_id: req.params.expId, docID: req.user.id });
        if(!exp)return next(new AppError('experiance record not Found',404));
        res.status(200).json({status: 'SUCCESS', message: 'Experience deleted.'})
    }


catch(err){
    next(err)

}}


//POST /api/doctor/upload-document 
exports.uploadDocument = async(req,res,next)=>{
    try{
        if(!req.file){
            return next(new AppError('no file attached',400));}
        
        const {title,isPublic}=req.body;
        if(!title) return next(AppError('document title is required',400));
        const result = await uploadToCloudinary(req.file.buffer,'doctor_document','auto');

        const doc = await DoctorDocument.create({
            docID: req.user.id,
            title,
            fileurl:result.secure_url,
            publicId:result.publicId,
            fileType: req.file.mimetype.startsWith('image')?'image':'pdf',
            isPublic:isPublic==='true',

        });

        res.status(201).json({Status:'SUCCESS',data:doc});


    }catch(err){
        next(err)
    }
}

// GET /api/doctor/documents
exports.getDocuments = async (req,res,next)=>{
    try{

        const docs = await DoctorDocument.find({docID:req.user.id});
        res.status(200).json({ status: 'SUCCESS', data: docs });
    }catch(err){
        next(err)
    }
}


//DELETE /api/doctor/document/:documentId
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await DoctorDocument.findOneAndDelete({ _id: req.params.documentId, docID: req.user.id });
    if (!doc) return next(new AppError('Document not found.', 404));
    await deleteFromCloudinary(doc.publicId, doc.fileType === 'pdf' ? 'raw' : 'image');
    res.status(200).json({ status: 'SUCCESS', message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
};


//GET /api/doctor/availability/:id
exports.getAvailability = async (req,res,next)=>{
    try {
        const today = new Date(); today.setHours(0,0,0,0);
        const end =new Date(today); end.setDate(today.getDate()+14);

        const availability = await DoctorAvailability.find({doctID: req.params.id,Date:{
            $gte: today,
            $lt:end
        }}).sort({date:1})


        res.status(200).json({
            status:'SUCCESS',data: availability
        })
    } catch (err) {
        next(err)
        
    }
}