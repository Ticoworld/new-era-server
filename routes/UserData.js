const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
const router = express.Router();

// Endpoint to update cart items
router.post('/updateCart', async (req, res) => {
  const token = req.headers['x-access-token'];
  const { cartItems } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.cartItems = cartItems;
    await user.save();

    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.get('/getdata', async (req, res) => {
  const token = req.headers['x-access-token'];
 
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email: email }); 

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const responseData = {
      success: true,
      firstname: user.fullname.split(' ')[0],
      lastname: user.fullname.split(' ').slice(1).join(' '),
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      state: user.state,
    };

   
      responseData.cartItems = user.cartItems
    

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



// Define the gethistory route
router.get('/gethistory', async (req, res) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, history: user.history || [] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/update-history', async (req, res) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const { transactionReference, amount, email: payerEmail } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.history.push({
      transactionReference,
      amount,
      email: payerEmail,
      date: new Date().toISOString(),
    });

    await user.save();

    res.json({ success: true, message: 'Purchase history updated successfully' });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/clearCart', async (req, res) => {
  const token = req.headers['x-access-token']; 

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.cartItems = []; // Clear the cart
    await user.save();

    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

const { v4: uuidv4 } = require('uuid');

router.post('/createOrder', async (req, res) => {
  const token = req.headers['x-access-token'];
  const { billingAddress, products, total } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const orderId = uuidv4();

    const newOrder = {
      orderId: orderId,
      items: products,
      totalAmount: total,
      billingAddress: billingAddress,
      status: 'Processing',
      createdAt: new Date(),
    };

    user.orders.push(newOrder);

    user.cartItems = [];

    user.history.push({
      transactionReference: orderId,
      amount: total,
      email: billingAddress.email,
      date: new Date().toISOString(),
    });

    await user.save();

    res.json({ success: true, message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
 

router.get('/getorders', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, orders: user.orders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



module.exports = router;

