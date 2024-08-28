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
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});


router.get('/contestants', async (req, res) => {
  try {
    const contestants = await Contestant.find();
    res.json({ contestants });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contestants', error: err.message });
  }
});

router.delete('/contestants/:id', async (req, res) => {
  try {
    const contestantId = req.params.id;

    const contestant = await Contestant.findByIdAndDelete(contestantId);

    if (!contestant) {
      return res.status(404).json({ message: 'Contestant not found' });
    }

    res.status(200).json({ message: 'Contestant deleted successfully' });
  } catch (error) {
    console.error('Error deleting contestant:', error);
    res.status(500).json({ message: 'Failed to delete contestant' });
  }
});

router.put('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: 'completed' },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order marked as completed.', order: updatedOrder });
  } catch (error) {
    console.error('Error marking order as completed:', error);
    res.status(500).json({ message: 'An error occurred while marking the order as completed.' });
  }
});

router.delete('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order has been deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'An error occurred while deleting the order.' });
  }
});

router.get('/pendingOrders', async (req, res) => {
  try {
    const users = await User.find();
    const pendingOrders = [];

    users.forEach((user) => {
      user.orders.forEach((order) => {
        if (order.status === 'Pending') {
          pendingOrders.push({ ...order, userId: user._id, username: user.username });
        }
      });
    });

    res.json({ pendingOrders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending orders', error: err.message });
  }
});

router.get('/completedOrders', async (req, res) => {
  try {
    const users = await User.find();
    const completedOrders = [];

    users.forEach((user) => {
      user.orders.forEach((order) => {
        if (order.status === 'Completed') {
          completedOrders.push({ ...order, userId: user._id, username: user.username });
        }
      });
    });

    res.json({ completedOrders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch completed orders', error: err.message });
  }
});
  



  // router.patch('/orders', async (req, res) => {
  //   const { orderId, userEmail, status } = req.body;
  
  //   try {
  //     const user = await User.findOneAndUpdate(
  //       { email: userEmail, 'orders.orderId': orderId },
  //       { $set: { 'orders.$.status': status } },
  //       { new: true }
  //     );
  
  //     if (!user) {
  //       return res.status(404).json({ success: false, message: 'User or Order not found' });
  //     }
  
  //     res.json({ success: true, message: 'Order status updated successfully' });
  //   } catch (error) {
  //     console.error('Error updating order status:', error);
  //     res.status(500).json({ success: false, message: 'Internal server error' });
  //   }
  // });
  
  


module.exports = router;