import nodemailer from 'nodemailer';
import express from 'express';

const app = express();

// Your email credentials (e.g., Gmail SMTP or a service like SendGrid)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or another provider
  auth: {
    user: 'satyamgdoc@gmail.com',  // Your email address
    pass: 'Satyamk1078@',   // Your email password
  }
});

app.use(express.json());

// Your subscription route
app.post('/subscribe', (req, res) => {
  const userEmail = req.body.email;  // Assume the user sends email via form

  // Send a welcome email after user subscribes
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: userEmail,
    subject: 'Welcome to Code Crusaders',
    text: 'Thank you for subscribing to our website. We are glad to have you on board!',
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send('Error sending email');
    }
    res.status(200).send('Subscription successful. Email sent.');
  });
});


