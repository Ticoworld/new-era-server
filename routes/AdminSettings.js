const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const AdminSettings = require('../model/AdminSettings.model');
const Admin = require('../model/admin.model');

// Route to update vote price
router.post('/updateVotePrice', async (req, res) => {
    const token = req.headers["x-access-token"];
    const { votePrice } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token missing' });
    }
    if (!votePrice || typeof votePrice !== 'number') {
        return res.status(400).json({ error: 'Invalid vote price' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const admin = await Admin.findOne({ email });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const updatedSettings = await AdminSettings.findOneAndUpdate(
            {},
            {
                $set: {
                    price: votePrice,
                    lastUpdated: Date.now(),
                },
            },
            { new: true, upsert: true } // `upsert: true` creates the setting if it doesn't exist
        );

        res.status(200).json({ success: true, message: 'Vote price updated', updatedSettings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating vote price', details: error.message });
    }
});

// Route to update contest status
router.post('/updateContestStatus', async (req, res) => {
    const token = req.headers["x-access-token"];
    const { contestActive } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token missing' });
    }
    if (typeof contestActive !== 'boolean') {
        return res.status(400).json({ error: 'Invalid contest status' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const updatedSettings = await AdminSettings.findOneAndUpdate(
            {},
            {
                $set: {
                    contestActive,
                    lastUpdated: Date.now(),
                },
            },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: 'Contest status updated', updatedSettings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error updating contest status', details: error.message });
    }
});

// Route to get current admin settings
router.get('/settings', async (req, res) => {
    const token = req.headers["x-access-token"];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        let settings = await AdminSettings.findOne({});
        if (!settings) {
            // Initialize default settings if none exist
            settings = await AdminSettings.create({
                price: 0, // default vote price
                contestActive: false, // default contest status
                lastUpdated: Date.now(),
                updatedBy: admin._id
            });
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching admin settings', details: error.message });
    }
});

router.get('/getVotePrice', async (req, res) => {
    try {
        const settings = await AdminSettings.findOne({}, 'price');
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        res.status(200).json({ price: settings.price });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vote price', error: error.message });
    }
});

router.get('/getContestStatus', async (req, res) => {
    try {
        const settings = await AdminSettings.findOne({}, 'contestActive');
        if (!settings) {
            return res.status(404).json({ message: 'Settings not found' });
        }
        res.status(200).json({ contestActive: settings.contestActive });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching contest status', error: error.message });
    }
});




// Route to store initial vote price and contest status
// router.post('/storeInitialSettings', async (req, res) => {
//     const { votePrice, contestActive } = req.body;

//     // Validation
//     if (typeof votePrice !== 'number' || typeof contestActive !== 'boolean') {
//         return res.status(400).json({ success: false, message: 'Invalid input. Vote price must be a number and contestActive must be a boolean.' });
//     }

//     try {
//         // Check if settings already exist
//         const existingSettings = await AdminSettings.findOne({});
//         if (existingSettings) {
//             return res.status(400).json({ success: false, message: 'Initial settings already exist.' });
//         }

//         // Create new settings
//         const newSettings = new AdminSettings({
//             price: votePrice,
//             contestActive: contestActive,
//             lastUpdated: Date.now()
//         });

//         await newSettings.save();

//         res.status(200).json({ success: true, message: 'Initial settings saved successfully', settings: newSettings });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
//     }
// });

// module.exports = router;


module.exports = router;
