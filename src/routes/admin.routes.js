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
    refreshToken,clearCookie
} = require("../controllers/admin.controller");


const { protect,restrictTo} = require("../middlewares/auth.middleware");


router.post("/login", adminLogin);

router.get("/verify", protect, verify);
router.post("/refresh-token", refreshToken);

router.get("/dashboard",protect,restrictTo("ADMIN"), getPlatformStats);
router.get("/doctors/pending",protect,restrictTo("ADMIN"), getPendingDoctors);
router.patch("/doctors/:id/verify",protect,restrictTo("ADMIN"), verifyDoctor);
router.get("/doctors",protect,restrictTo("ADMIN"), getAllDoctors);
router.delete("/doctors/:id",protect,restrictTo("ADMIN"), removeDoctor);

module.exports=router;
