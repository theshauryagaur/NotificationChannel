const nodemailer = require('nodemailer');
const { MailtrapClient } = require("mailtrap");

// Configure SMTP transport if credentials are provided
let transporter;
if (process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
        port: process.env.EMAIL_PORT || 2525,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Configure Mailtrap SDK client if token is provided
const TOKEN = process.env.MAILTRAP_API_TOKEN;
let client;
if (TOKEN) {
    client = new MailtrapClient({
        token: TOKEN,
    });
}

module.exports = {
    async sendEmail(message, targetUsers) {
        const emailRecipients = targetUsers.filter(user => user.email);
        if (emailRecipients.length === 0) {
            console.log("No email recipients provided, skipping email channel.");
            return;
        }

        // Try SMTP first (e.g. Mailtrap Sandbox)
        if (transporter) {
            const mailOptions = {
                from: 'Shaurya Gaur <mailtrap@demomailtrap.com>',
                to: emailRecipients.map(user => user.email).join(', '),
                subject: 'Notification',
                text: message,
            };

            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    await transporter.sendMail(mailOptions);
                    return;
                } catch (error) {
                    const isRateLimit = error.message && error.message.includes("Too many emails per second");
                    if (isRateLimit && attempt < maxRetries) {
                        console.warn(`⚠️ Mailtrap rate limit hit. Retrying in 2 seconds... (Attempt ${attempt}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } else {
                        throw error;
                    }
                }
            }
            return;
        }

        // Fallback to Mailtrap SDK (requires verified domain)
        if (client) {
            const sender = {
                email: "mailtrap@demomailtrap.com",
                name: "Shaurya Gaur",
            };
            const recipients = emailRecipients.map(user => ({
                email: user.email,
            }));
            await client.send({
                from: sender,
                to: recipients,
                subject: "Notification",
                text: message,
                category: "Notification",
            });
            return;
        }

        throw new Error("Neither SMTP credentials (EMAIL_USER) nor MAILTRAP_API_TOKEN are configured.");
    }
};
