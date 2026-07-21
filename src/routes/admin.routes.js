const express=require("express");

const router=express.Router();

const adminController=require("../controllers/admin.controller");
const {
    getPlatformStats
} = require("../controllers/admin.controller");
const {
    getPendingDoctors
} = require("../controllers/admin.controller");
const {
    verifyDoctor
} = require("../controllers/admin.controller");
const {
    getAllDoctors
} = require("../controllers/admin.controller");
const {
    removeDoctor
}=require("../controllers/admin.controller")
const {
    adminLogin,
    verify,
    refreshToken,clearCookie,getDoctorDocuments
} = require("../controllers/admin.controller");


const { protect } = require("../middlewares/auth.middleware");


router.post("/login", adminLogin);

router.get("/verify", protect, verify);
router.post("/refresh-token", refreshToken);

router.get("/dashboard", getPlatformStats);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/doctors/:id/verify", verifyDoctor);
router.get("/doctors", getAllDoctors);
router.delete("/doctors/:id", removeDoctor);
router.get("/doctors/:id/documents, getDoctorDocuments);

module.exports=router;
