const express = require('express');
const axios = require('axios');  // Add this line to import axios
const router = express.Router();
const User = require("../model/user.model");
const Contestant = require("../model/contestant.model");
const dotenv = require('dotenv');

dotenv.config();


router.post('/initialize-payment', async (req, res) => {
  const { email, amount } = req.body;
  console.log(email, amount);

  // Check if email and amount are present
  if (!email || !amount) {
    return res.status(400).json({ error: 'Email and amount are required' });
  }

  // Convert amount to number
  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Invalid amount format' });
  }

  try {
    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: numericAmount,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Use environment variable
      },
    });

    const data = response.data;

    if (data.status) {
      res.json({ accessCode: data.data.access_code });
    } else {
      res.status(500).json({ error: data.message });
    }
  } catch (error) {
    console.error("Error initializing payment:", error);
    res.status(500).json({ error: 'Server error' });
  }
});


// router.post('/vote-payment', async (req, res) => {
//   const { email, amount, voteNo, voterName, username } = req.body;
//   if (!email || !amount || vote  || voterName || username) {
//     return res.status(400).json({ error: 'Email and amount are required' });
//   }

//   try {

//     const contestant = await Contestant.findOne({ username });
//     if (!contestant) {
//       return res.status(404).json({ error: 'Contestant not found' });
//     }

//     const response = await axios.post('https://api.paystack.co/transaction/initialize', {
//       email,
//       amount,
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Use environment variable
//       },
//     });

//     const data = response.data;

//     if (data.status) {

//       res.json({ accessCode: data.data.access_code });
//     } else {
//       res.status(500).json({ error: data.message });
//     }
//   } catch (error) {
//     res.status(500).json({ error: 'Server error' });
//   }
// });



router.get('/verify-payment/:reference', async (req, res) => {
    const { reference } = req.params;
    const expectedAmount = req.query.amount; // Ensure the expected amount is passed or calculated
  
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });
  
      const transactionData = response.data.data;
  
      if (transactionData.status === 'success' && transactionData.amount === parseInt(expectedAmount)) {
        
        res.json({ success: true, transactionData });
      } else {
        res.status(400).json({ success: false, message: 'Payment verification failed.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error verifying payment', error });
    }
  });


  router.post('/vote-payment', async (req, res) => {
    const { email, amount, name, username } = req.body;
    if (!email || !amount || !name || !username) {
      return res.status(400).json({ error: 'Email, amount, name, and username are required' });
    }
  
    try {
      const contestant = await Contestant.findOne({ username });
      if (!contestant) {
        return res.status(404).json({ error: 'Contestant not found' });
      }
  
      const response = await axios.post('https://api.paystack.co/transaction/initialize', {
        email,
        amount,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Use environment variable
        },
      });
  
      const data = response.data;
  
      if (data.status) {
        res.json({ accessCode: data.data.access_code });
      } else {
        res.status(500).json({ error: data.message });
      }
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  

  router.get('/verify-vote-payment/:reference', async (req, res) => {
    const { reference } = req.params;
    const expectedAmount = req.query.amount; // Ensure the expected amount is passed or calculated
  
    try {
      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      });
  
      const transactionData = response.data.data;
  
      if (transactionData.status === 'success' && transactionData.amount === parseInt(expectedAmount)) {
        // Optionally, update user data here if needed
  
        res.json({ success: true, transactionData });
      } else {
        res.status(400).json({ success: false, message: 'Payment verification failed.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error verifying payment', error });
    }
  });
  

module.exports = router;