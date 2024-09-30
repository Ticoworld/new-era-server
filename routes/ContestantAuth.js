const express = require("express");
const router = express.Router();
const Contestant = require("../model/contestant.model");
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
    <a href="https://neweraprints.vercel.app//contest-verify-email?otp=${otp}">Verify your Email</a>
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

    res.json({
      success: true,
      token,
      expirationTime,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Define Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pics', // Optional folder name on Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'], // Restrict to specific formats if necessary
    transformation: [{ width: 800, height: 600, crop: 'limit' }], // Optional resizing
  },
});

const upload = multer({ storage: storage });

router.post('/complete-registration', upload.fields([{ name: 'profilePic' }, { name: 'coverPic' }]), async (req, res) => {
  try {
    const { twitter, instagram, facebook, whatsapp } = req.body;

    const profilePic = req.files['profilePic'] ? req.files['profilePic'][0].path : null;
    const coverPic = req.files['coverPic'] ? req.files['coverPic'][0].path : null;

    const token = req.headers['x-access-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

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

module.exports = router;