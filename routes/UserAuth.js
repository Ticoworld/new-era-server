const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require('path');
const multer = require('multer');
const saltRounds = 10;
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail");
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
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { otp, otpCreatedAt } = generateOtp();

    const newUser = new User({
      fullname,
      username,
      email,
      phoneNumber,
      state,
      password: hashedPassword,
      cartItems: [],
      history: [],
      order: [],
      isVerified: false,
      otp,
      otpCreatedAt,
      role:'customer',
    });

    await newUser.save();

    const subject = "Verify Your Email";
    const message = `<h2>Hi ${username} </h2>,
    <p>
    Thank you for registering with us! To complete your registration, please verify your email using the OTP provided below:
    OTP: <b>${otp}</b> 
    This OTP will expire in 10 minutes. Alternatively, you can click the link below to verify your email address:
    <a href="http://localhost:5173/verify-email?otp=${otp}">Verify your Email</a>
   
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const { token, expirationTime } = generateToken(user.email, user.username);

    res.json({
      success: true,
      token,
      expirationTime,
      role: user.role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;