const express = require("express")
const { protect } = require("../middlewares/auth.middleware")
const {signinUpUser, resendOTP, verifyUser, loginUser, refreshToken} = require('../controllers/auth.controller');

const router = express.Router()

router.post("/signin-user", signinUpUser)

router.post('/resend-otp', resendOTP);

router.post('/verify-user', verifyUser);

router.post('/login-user', loginUser);


router.post('/refresh', refreshToken);

module.exports = router;