const crypto = require('crypto');

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const getOTPExpiry = () => {
    return new Date(Date.now() + 10 * 60 * 1000);
};

const isOTPExpired = (expiry) => {
    return new Date() > new Date(expiry);
};

const generateConsultationOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

module.exports = {
    generateOTP,
    getOTPExpiry,
    isOTPExpired,
    generateConsultationOTP
};