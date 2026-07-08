const Twilio = require('twilio');

// Configure Twilio for sending SMS
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
    async sendSMS(message, targetUsers) {
        const smsRecipients = targetUsers.filter(user => user.phoneNumber);
        if (smsRecipients.length === 0) {
            console.log("No SMS recipients provided, skipping SMS channel.");
            return;
        }
        await Promise.all(smsRecipients.map(user => twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phoneNumber,
        })));
    }
};
