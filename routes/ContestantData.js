const express = require('express');
const jwt = require('jsonwebtoken');
const Contestant = require("../model/contestant.model");
const router = express.Router();

router.get('/getdata', async (req, res) => {
    const token = req.headers['x-access-token'];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }
  
    try {
      // Use environment variable for the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const email = decoded.email;
  
      const contestant = await Contestant.findOne({ email: email });
  
      if (!contestant) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({
        success: true,
        firstname: contestant.firstname,
        lastname: contestant.lastname,
        username: contestant.username,
        email: contestant.email,
        phoneNumber:contestant.phoneNumber,
        address:contestant.address,
        state:contestant.state,
        isRegistrationCompleted:contestant.isRegistrationCompleted,
        profilePic:contestant.profilePic,
        coverPic:contestant.coverPic,
        votes: contestant.votes,
        role:contestant.role,
      });
    } catch (error) {
      // Improve error handling
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token has expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      console.error('Error fetching user data:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // server/routes/contestantRoutes.js

router.get('/invite/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Find the contestant by username
    const contestant = await Contestant.findOne({ username });

    if (contestant) {
      res.json({ success: true, data: contestant }); 
    } else {
      res.status(404).json({ success: false, message: 'Contestant not found' });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




router.post('/update-votes', async (req, res) => {
  const { username, name, votes } = req.body;

  if (!username || !name || votes === undefined) {
    return res.status(400).json({ error: 'Username, name, and votes are required' });
  }

  try {
    const contestant = await Contestant.findOne({ username });

    if (!contestant) {
      return res.status(404).json({ error: 'Contestant not found' });
    }

    // Ensure 'votes' is a number
    if (isNaN(votes) || votes <= 0) {
      return res.status(400).json({ error: 'Votes must be a positive number' });
    }

    // Update the votes for the contestant
    await Contestant.updateOne(
      { username },
      {
        $push: {
          votes: {
            voterName: name,
            voterEmail: req.body.voterEmail, // Ensure this field is included if needed
            numberOfVotes: votes
          }
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating votes:', error);
    res.status(500).json({ error: 'Server error' });
  } 
});


  
module.exports = router