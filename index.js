const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
// Routes
const userAuthRoutes = require('./routes/UserAuth')
const contestantAuthRoutes = require('./routes/ContestantAuth')
const verifyRoutes = require('./routes/Verification')
const verifyContestant = require('./routes/ContestantVerification')
const userRoutes = require('./routes/UserData')
const contestantRoutes = require('./routes/ContestantData')
const paymentRoutes = require('./routes/payment')
const adminRoutes = require('./routes/admin')
const productRoute = require('./routes/Product')
const AdminSettings = require('./routes/AdminSettings')

app.use(express.json());
const path = require('path');
const dotenv = require('dotenv');
app.use(cors()) 
dotenv.config();
app.use('/images', express.static(path.join(__dirname, 'public/images')));

const dbUri = process.env.MONGODB_URI
 
mongoose.connect(dbUri)

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

app.use(express.json());

// Use the auth routes
app.use('/admin', adminRoutes);
app.use('/user-auth', userAuthRoutes);
app.use('/contestant-auth', contestantAuthRoutes);
app.use('/verify', verifyRoutes);
app.use('/contest-verify', verifyContestant);
app.use('/contestant', contestantRoutes);
app.use('/user', userRoutes);
app.use('/payment', paymentRoutes)
app.use('/product', productRoute)
app.use('/setting', AdminSettings)
