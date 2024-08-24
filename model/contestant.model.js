const mongoose = require("mongoose");

const contestantSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    otp: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePic: {
      type: String, // Store file path or URL
      default: null,
    },
    coverPic: {
      type: String, // Store file path or URL
      default: null,
    },
    twitter: {
      type: String,
      default: null,
    },
    instagram: {
      type: String,
      default: null,
    },
    facebook: {
      type: String,
      default: null,
    },
    whatsapp: {
      type: String,
      default: null,
    },
    isRegistrationCompleted: {
      type: Boolean,
      default: false,
    },

    votes: [
      {
        voterName: {
          type: String,
          required: true,
        },
        voterEmail: {
          type: String,
          required: true,
        },
        numberOfVotes: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Contestant = mongoose.model("Contestant", contestantSchema);

module.exports = Contestant;
