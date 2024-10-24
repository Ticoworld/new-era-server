const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail");
const { generateOtp } = require('../utils/generateOtp');
const crypto = require('crypto')
const siteUrl = process.env.SITE_URL
const generateToken = (email, username) => {
  const payload = { email, username };
  const expiresIn = '1h'; // Token expires in 1 hour
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

  const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now

  return { token, expirationTime };
};


router.post("/register", async (req, res) => {
  const { fullname, username, email, phoneNumber, state, password } = req.body;

  try {
    // Check if the email or phone number already exists
    const existingUserByEmail = await User.findOne({ email });
    const existingUserByPhone = await User.findOne({ phoneNumber });
    const existingUserByUsername = await User.findOne({ username });

    if (existingUserByEmail) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    if (existingUserByPhone) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }
    if (existingUserByUsername) {
      return res.status(400).json({ success: false, message: "Phone number already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate OTP
    const { otp, otpCreatedAt } = generateOtp();

    // Create a new user
    const newUser = new User({
      fullname,
      username,
      email,
      phoneNumber,
      state,
      password: hashedPassword,
      cartItems: [],
      history: [],
      orders: [],
      isVerified: false,
      otp,
      otpCreatedAt,
      role: 'customer',
    });

    // Save the user
    await newUser.save();

    // Send verification email
    const subject = "Verify Your Email";
    const message = `<h2>Hi ${username} </h2>,
    <p>
    Thank you for registering with us! To complete your registration, please verify your email using the OTP provided below:
    OTP: <b>${otp}</b> 
    This OTP will expire in 10 minutes. Alternatively, you can click the link below to verify your email address:
    <a href="${siteUrl}/verify-email?otp=${otp}">Verify your Email</a>
   
    Thank you! 
    </p>
    `;

    const mailOptions = createMailOptions(email, subject, message);

    await sendMailWithPromise(mailOptions);

    res.status(201).json({ success: true, message: "User registered successfully! Please check your email to verify your account." });
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
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Generate token
    const { token, expirationTime } = generateToken(user.email, user.username);
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account is not verified. Please verify your account before logging in.",
      });
    } else {
    res.json({
      success: true,
      token,
      expirationTime,
      role: user.role,
    });
  }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User with that email does not exist." });
    }

    // Create a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const resetLink = `${siteUrl}/reset-password/${resetToken}`;

    const subject = "Password Reset Request";
    const message = `
      <h2>Hi ${user.username}</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset your password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    const mailOptions = createMailOptions(user.email, subject, message);
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
    const user = await User.findOne({
      resetToken,
      resetTokenExpires: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;
    user.resetToken = undefined; 
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

module.exports = router;