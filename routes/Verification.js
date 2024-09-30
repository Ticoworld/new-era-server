const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail");
  const {generateOtp} = require('../utils/generateOtp');

  router.post("/verify-email", async (req, res) => {
    const { email, otp } = req.body;
  
    if (!otp || !email) {
      return res.status(400).json({ success: false, message: "Invalid OTP or email" });
    }
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Email is already verified" });
      }
  
      // Check if OTP matches
      if (user.otp !== otp) {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
  
      // Check if OTP has expired (10 minutes expiry time)
      const currentTime = Date.now();
      const otpExpiryTime = new Date(user.otpCreatedAt).getTime() + 10 * 60 * 1000; // 10 minutes in milliseconds
  
      if (currentTime > otpExpiryTime) {
        return res.status(400).json({ success: false, message: "OTP has expired" });
      }
  
      // Mark user as verified and clear OTP-related fields
      user.isVerified = true;
      user.otp = undefined;
      user.otpCreatedAt = undefined;
  
      await user.save();
  
      res.status(200).json({ success: true, message: "Email verification successful"  });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
});

  
  
  router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if email is already verified
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }

        // Generate new OTP
        const { otp, otpCreatedAt } = generateOtp();

        // Update user with new OTP
        user.otp = otp;
        user.otpCreatedAt = otpCreatedAt;
        await user.save();

        // Send OTP email
        const subject = "Your New OTP";
        const message = `
            <h2>Hi ${user.username},</h2>
            <p>You requested a new OTP for email verification. Please use the following OTP:</p>
            <p><b>OTP:</b>${otp}</p>
            <p>This OTP will expire in 10 minutes. Alternatively, you can click the link below to verify your email address:</p>
            <p><a href="https://new-era-server-five.vercel.app/verify-email?otp=${otp}">Verify your Email</a></p>
            <p>Thank you!</p>
        `;

        const mailOptions = createMailOptions(user.email, subject, message);
        await sendMailWithPromise(mailOptions);

        res.status(200).json({ success: true, message: "New OTP sent to email" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

  
  module.exports = router