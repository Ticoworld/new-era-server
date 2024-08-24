const crypto = require("crypto");

const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString(); // Generates a 6-digit OTP
  const otpCreatedAt = Date.now(); // Timestamp for OTP creation
  return { otp, otpCreatedAt };
};

module.exports = { generateOtp };
