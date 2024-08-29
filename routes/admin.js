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

router.get('/users', async(req, res)=>{
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.get('/contestants', async(req, res)=>{
  try {
    const contestants = await Contestant.find();
    res.status(200).json(contestants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

router.get('/orders/pending', async(req, res)=>{
  try {
    const pendingOrders = await User.find({ 'orders.status': 'Pending' }, 'fullname email orders')
      .exec();

    res.status(200).json(pendingOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})


router.get('/orders/completed', async(req, res)=>{
  try {
    const completedOrders = await User.find({ 'orders.status': 'Completed' }, 'fullname email orders')
      .exec();

    res.status(200).json(completedOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})


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
  try {
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
  try {
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
router.patch('/orders/:id/complete', async (req, res) => {
  try {
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

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router