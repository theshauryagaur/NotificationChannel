require('dotenv').config();

const requiredEnv = [
    'PUBLIC_KEY',
    'PRIVATE_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
];
const missing = requiredEnv.filter(key => !process.env[key]);

// Check for at least one email configuration
const hasSMTP = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
const hasMailtrapToken = process.env.MAILTRAP_API_TOKEN;

if (!hasSMTP && !hasMailtrapToken) {
    missing.push('MAILTRAP_API_TOKEN (or EMAIL_USER & EMAIL_PASSWORD)');
}

if (missing.length) {
    console.warn('⚠️ Missing environment variables:', missing.join(', '));
} else {
    console.log('✅ Required environment variables are set');
}

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const pushNotificationService = require('./pushNotificationService');
const smsService = require('./smsService');
const emailService = require('./emailService');
const { validateNotificationRequest } = require('./validation');

// Middleware
app.use(bodyParser.json());
app.use(cors());
// Serve static files (frontend) from the project root
app.use(express.static(path.join(__dirname, '..')));

// Root route – serve index.html explicitly for clarity
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.post('/notify', async (req, res) => {
    try {
        validateNotificationRequest(req.body);
        const { message, channels, targetUsers } = req.body;
        switch (channels) {
            case 'all':
                await pushNotificationService.sendPush(message, targetUsers);
                await smsService.sendSMS(message, targetUsers);
                await emailService.sendEmail(message, targetUsers);
                break;
            case 'push':
                await pushNotificationService.sendPush(message, targetUsers);
                break;
            case 'sms':
                await smsService.sendSMS(message, targetUsers);
                break;
            case 'email':
                await emailService.sendEmail(message, targetUsers);
                break;
            default:
                throw new Error('Invalid channels specified');
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.PUBLIC_KEY });
});

app.post('/save-subscription', (req, res) => {
    pushNotificationService.insertPushSubscription(req.body);
    console.log(req.body);
    res.json({ status: 'Success', message: 'Subscription saved!' });
});

app.listen(3000, () => console.log('Notification server listening on port 3000'));
