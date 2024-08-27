const express = require("express");
const router = express.Router(); 
const Admin = require('../model/admin.model');
const User = require('../model/user.model');
const Contestant = require('../model/contestant.model');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

        res.status(200).json({ message: "Login successful!", token, expiresAt: expirationTime });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server error" });
    }
});



router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/users/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      const deletedUser = await User.findByIdAndDelete(userId);
  
      if (!deletedUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });


router.get('/contestants', async (req, res) => {
  try {
    const contestants = await Contestant.find();
    res.json({ success: true, contestants });
  } catch (error) {
    console.error('Error fetching contestants:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/contestants/:userId', async (req, res) => {
    const { contestantsId } = req.params;
  
    try {
      const deletedUser = await User.findByIdAndDelete(contestantsId);
  
      if (!deletedUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });


router.get('/pendingOrders', async (req, res) => {
  try {
    const users = await User.find({ 'orders.status': 'Pending' });

    const pendingOrders = users.flatMap(user =>
      user.orders.filter(order => order.status === 'Pending')
    );

    res.json({ success: true, pendingOrders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/completedOrders', async (req, res) => {
    try {
      const users = await User.find({ 'orders.status': 'Completed' });
  
      const completedOrders = users.flatMap(user =>
        user.orders.filter(order => order.status === 'Completed')
      );
  
      res.json({ success: true, completedOrders });
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
  



router.post('/completeOrder', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  try {
    const users = await User.find({ 'orders.orderId': orderId });

    let orderFound = false;

    for (const user of users) {
      const order = user.orders.id(orderId);

      if (order) {
        order.status = 'Completed';
        await user.save();
        orderFound = true;
        break; 
      }
    }

    if (orderFound) {
      res.json({ success: true, message: 'Order marked as completed' });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


module.exports = router;