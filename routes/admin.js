const express = require("express");
const router = express.Router(); 
const Admin = require('../model/admin.model');
const User = require('../model/user.model');
const Contestant = require('../model/contestant.model');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createMailOptions, sendMailWithPromise } = require("../utils/sendVerificationEmail"); 

const generateToken = (email) => {
    const payload = { email };
    const expiresIn = '1h'; 
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60);

    return { token, expirationTime };
};

router.post("/register", async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne({});
        
        if (existingAdmin) {
            return res.status(403).json({ message: "Admin already exists. Registration is closed." });
        }

        const { email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            email,
            password: hashedPassword,
        });

        await newAdmin.save();

        res.status(201).json({ message: "Admin registered successfully!" });
    } catch (error) {
        console.error("Error registering admin:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const { token, expirationTime } = generateToken(admin.email);

        res.json({
          success: true,
          token,
          expirationTime,
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server error" });
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
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const responseData = {
      success: true,
    };    

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


router.get('/users', async(req, res)=>{
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.get('/contestants', async(req, res)=>{
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const contestants = await Contestant.find();
    res.status(200).json(contestants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.get('/orders/awaiting', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const users = await User.find({ 'orders.status': 'Awaiting' }, 'fullname email orders')
      .exec();

    // Filter orders for each user to only include 'Awaiting' status orders
    const AwaitingOrders = users.map(user => {
      const awaitingOrders = user.orders.filter(order => order.status === 'Awaiting');
      return {
        fullname: user.fullname,
        email: user.email,
        orders: awaitingOrders,  // Only include orders with 'Awaiting' status
      };
    });

    res.status(200).json(AwaitingOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders/pending', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const users = await User.find({ 'orders.status': 'Pending' }, 'fullname email orders')
      .exec();

    // Filter orders for each user to only include 'Awaiting' status orders
    const PendingOrders = users.map(user => {
      const pendingOrders = user.orders.filter(order => order.status === 'Pending');
      return {
        fullname: user.fullname,
        email: user.email,
        orders: pendingOrders, 
      };
    });

    res.status(200).json(PendingOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders/completed', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const users = await User.find({ 'orders.status': 'Completed' }, 'fullname email orders')
      .exec();

  
    const CompletedOrders = users.map(user => {
      const completedOrders = user.orders.filter(order => order.status === 'Completed');
      return {
        fullname: user.fullname,
        email: user.email,
        orders: completedOrders, 
      };
    });

    res.status(200).json(CompletedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/leaderboard', async (req, res) => {
  try {
    const contestants = await Contestant.find().sort({ votes: -1 }); // Sort contestants by votes in descending order
    res.json({ success: true, contestants });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


router.delete('/users/:id', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { id } = req.params;
    
    const result = await User.findByIdAndDelete(id);
    
    if (result) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/contestants/:id', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { id } = req.params;
    
    const result = await Contestant.findByIdAndDelete(id);
    
    if (result) {
      res.status(200).json({ message: 'Contestant deleted successfully' });
    } else {
      res.status(404).json({ message: 'Contestant not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Assuming you have this route defined in a file like `routes/admin.js`
router.patch('/orders/:id/pending', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { id } = req.params; 
    
    const user = await User.findOne({ 'orders._id': id });
    if (!user) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the order within the user's orders array
    const order = user.orders.id(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status to 'Pending'
    order.status = 'Pending';
    console.log(order.status);

    await user.save();
    const userEmail = user.email;
    const subject = "Your Order is Now Pending";
    
    const message = `
    Dear ${user.username},
    
    Your order (Order ID: ${order._id}) has been verified and is now pending. We will keep you updated on the progress.
    
    Thank you for your patience!
    
    Best regards,
    NEW ERA PRINTS
    `;
    
    const mailOptions = createMailOptions(userEmail, subject, message);

    await sendMailWithPromise(mailOptions);

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/orders/:id/complete', async (req, res) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email }); 

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const { id } = req.params; 
    
    const user = await User.findOne({ 'orders._id': id });
    if (!user) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the order within the user's orders array
    const order = user.orders.id(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update the order status to 'Completed'
    order.status = 'Completed';
    console.log(order.status);
    // Save the updated user document
    await user.save();

    const userEmail = user.email;
const subject = "Your Order is Complete";

const message = `
Dear ${user.username},

We’re happy to inform you that your order (Order ID: ${order._id}) has been successfully completed. Thank you for choosing us!

If you have any questions, feel free to contact us.

Best regards,
NEW ERA PRINTS
`;
const mailOptions = createMailOptions(userEmail, subject, message);

await sendMailWithPromise(mailOptions);

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router