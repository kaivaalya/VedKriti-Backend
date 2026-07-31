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


router.post('/experience',verifedDoctor,       ctrl.addExperience);
router.get('/getexperience',verifedDoctor,        ctrl.getExperience);
router.delete('/experience/:expId',verifedDoctor, ctrl.deleteExperience);


router.post('/upload-document',verifedDoctor,    uploadMiddleware('document', 10), ctrl.uploadDocument);
router.get('/documents',verifedDoctor,           ctrl.getDocuments);
router.delete('/document/:docId',verifedDoctor,  ctrl.deleteDocument);

module.exports = router;
