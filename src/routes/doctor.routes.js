const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/doctor.controller');
const { protect, restrictTo ,verifedDoctor} = require('../middlewares/auth.middleware');
const { uploadMiddleware }    = require('../configs/cloudinary.config');



router.get('/find-doctor', ctrl.findDoctor);

router.get('/profile/:id', ctrl.getDoctorProfile);

router.get('/availability/:id', ctrl.getAvailability);





router.use(protect, restrictTo('DOCTOR'));


router.put('/set-practiceLocation', ctrl.setPracticeLocation);
router.get('/get-practiceLocation', ctrl.getPracticeLocation);


router.put('/set-education', ctrl.setEducation);
router.get('/get-education', ctrl.getEducation);


router.put('/set-operationalDetails', ctrl.setOperationalDetails);
router.get('/get-operationalDetails', ctrl.getOperationalDetails);


router.put('/set-about', uploadMiddleware('photo', 5), ctrl.setAbout);
router.get('/get-about', ctrl.getAbout);


<<<<<<< HEAD
router.post('/addexperience', ctrl.addExperience);
router.get('/getexperience', ctrl.getExperience);
router.delete('/experience/:expId',verifedDoctor, ctrl.deleteExperience);
=======
router.post('/addexperience',       ctrl.addExperience);
router.get('/getexperience',        ctrl.getExperience);
router.delete('/experience/:expId'r, ctrl.deleteExperience);
>>>>>>> 058153b3627153838c7c4b5d880847968de59c75


router.post('/upload-document',    uploadMiddleware('document', 10), ctrl.uploadDocument);
router.get('/documents',           ctrl.getDocuments);
router.delete('/document/:docId',  ctrl.deleteDocument);

module.exports = router;
