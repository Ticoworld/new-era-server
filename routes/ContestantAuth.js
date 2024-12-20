const express = require("express");
const router = express.Router();
const Contestant = require("../model/contestant.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require('path');
const multer = require('multer');
const saltRounds = 10;
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail");
const siteUrl = process.env.SITE_URL
const { generateOtp } = require('../utils/generateOtp');

const generateToken = (email, username) => {
  const payload = { email, username };
  const expiresIn = '1h'; // Token expires in 1 hour
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now

  return { token, expirationTime };
};

// User register
router.post("/register", async (req, res) => {
  const { fullname, username, email, phoneNumber, state, password } = req.body;

  try {
    const existingUser = await Contestant.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { otp, otpCreatedAt } = generateOtp();

    const newContestant = new Contestant({
      fullname,
      username,
      email,
      phoneNumber,
      state,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpCreatedAt,
      votes:[],
      role:'contestant',
    });

    await newContestant.save();

    const subject = "Verify Your Email";
    const message = `<h2>Hi ${username} </h2>,
    <p>
    Thank you for registering with us! To complete your registration, please verify your email using the OTP provided below:
    OTP: <b>${otp}</b> 
    This OTP will expire in 10 minutes. Alternatively, you can click the link below to verify your email address:
    <a href="${siteUrl}/contest-verify-email?otp=${otp}">Verify your Email</a>
    Thank you! 
    </p>
    `;

    const mailOptions = createMailOptions(email, subject, message);

    await sendMailWithPromise(mailOptions);

    res.status(201).json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "This Email already exists" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const contestant = await Contestant.findOne({ email });
    if (!contestant) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, contestant.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const { token, expirationTime } = generateToken(contestant.email, contestant.username);
    if (!contestant.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account is not verified. Please verify your account before logging in.",
      });
    } else {
    res.json({
      success: true,
      token,
      expirationTime,
      role: contestant.role,
    });
  }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



router.post('/complete-registration', async (req, res) => {
  try {
    const { twitter, instagram, facebook, whatsapp, profilePic, coverPic } = req.body;

    // Validate token
    const token = req.headers['x-access-token']; 
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Update contestant details in the database
    const contestant = await Contestant.findOneAndUpdate(
      { email },
      { twitter, instagram, facebook, whatsapp, profilePic, coverPic, isRegistrationCompleted: true },
      { new: true }
    );

    if (contestant) {
      res.json({ success: true, isRegistrationCompleted: true });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const contestant = await Contestant.findOne({ email });
    if (!contestant) {
      return res.status(400).json({ success: false, message: "Contestant with that email does not exist." });
    }

    // Create a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    contestant.resetToken = resetToken;
    contestant.resetTokenExpires = Date.now() + 3600000; // 1 hour expiration
    await contestant.save();

    const resetLink = `${siteUrl}/reset-password/${resetToken}`;

    const subject = "Password Reset Request";
    const message = `
      <h2>Hi ${contestant.username}</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset your password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    const mailOptions = createMailOptions(contestant.email, subject, message);
    await sendMailWithPromise(mailOptions);

    res.status(200).json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const contestant = await Contestant.findOne({
      resetToken,
      resetTokenExpires: { $gt: Date.now() } 
    });

    if (!contestant) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    contestant.password = hashedPassword;
    contestant.resetToken = undefined; 
    contestant.resetTokenExpires = undefined;
    await contestant.save();

    res.status(200).json({ success: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

module.exports = router;