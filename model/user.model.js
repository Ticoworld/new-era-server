const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
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

    cartItems: {
      type: [
        {
          name: String,
          price: Number,
          image: String,
          quantity: { type: Number, default: 1 },
        },
      ],
      default: [],
    },

    history: [
      {
        transactionReference: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    resetToken: {
      type: String,
    },
    resetTokenExpires: {
      type: Date,
    },

    role: {
      type: String,
    },
    orders: [
      {
        orderId: {
          type: String,
          required: true,
          // unique: true,
        },
        items: [
          {
            name: String,
            price: Number,
            image: String,
            quantity: { type: Number, default: 1 },
          },
        ],
        totalAmount: {
          type: Number,
          required: true,
        },
        billingAddress: {
          name: String,
          email: String,
          phone: String,
          address: String,
          city: String,
          state: String,
          zip: String,
        },
        status: {
          type: String,
          enum: ["Awaiting","Pending", "Completed",],
          default: "Awaiting",
        },
        createdAt: {
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

const User = mongoose.model("User", userSchema);

module.exports = User;