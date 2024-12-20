const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
const router = express.Router();
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail");  
const siteUrl = process.env.SITE_URL

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
      role:user.role,
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

    // Find the user based on the email from the token
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Filter user's orders for those with status "Completed"
    const completedOrders = user.orders.filter(order => order.status === 'Completed');

    res.json({ success: true, history: completedOrders || [] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// router.post('/update-history', async (req, res) => {
//   try {
//     const token = req.headers['x-access-token'];
//     if (!token) {
//       return res.status(401).json({ success: false, message: 'No token provided' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const email = decoded.email;

//     const { transactionReference, amount, email: payerEmail } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     user.history.push({
//       transactionReference,
//       amount,
//       email: payerEmail,
//       date: new Date().toISOString(),
//     });

//     await user.save();

//     res.json({ success: true, message: 'Purchase history updated successfully' });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

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

  if (!total) {
    return res.status(400).json({ success: false, message: 'Total amount is missing' });
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
      status: 'Awaiting',
      createdAt: new Date(),
    };

    user.orders.push(newOrder);

    user.cartItems = [];
    
    await user.save();

    const adminEmail = process.env.MAIL_USERNAME;
    const subject = `New Order from ${billingAddress.name}`;
    message = `
        A new order has been placed by ${billingAddress.name}.

        Billing Details:
        Name: ${billingAddress.name}
        Email: ${billingAddress.email}
        Phone: ${billingAddress.phone}
        Address: ${billingAddress.address}, ${billingAddress.city}, ${billingAddress.state}, ${billingAddress.zip}

        Products Ordered:
        ${products.map(product => `${product.quantity} x ${product.name} - ₦${product.price}`).join("\n")}

        Total: ₦${total.toFixed(2)}

        This order is currently marked as "awaiting."
        Visit the Admin Dashboard and confirm the Order
        <p><a href="${siteUrl}/admin">Visit Dashboard</p>
      `;

      const mailOptions = createMailOptions(adminEmail, subject, message);

      await sendMailWithPromise(mailOptions);

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