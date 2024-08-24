const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Configure mail transporter
const mailTransporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    }
});

// Function to send email
const sendMailWithPromise = (mailOptions) => {
    return new Promise((resolve, reject) => {
        mailTransporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending mail:', error);
                reject(error);
            } else {
                console.log('Mail sent:', info.response);
                resolve(info);
            }
        });
    });
};

// Reusable mail options function
const createMailOptions = (toEmail, subject, message) => {
    return {
        from: process.env.MAIL_USERNAME, // sender address
        to: toEmail, // list of receivers
        subject: subject, // Subject line
        html: message, // plain text body
    };
};

module.exports = { sendMailWithPromise, createMailOptions };
