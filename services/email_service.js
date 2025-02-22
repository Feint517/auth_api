const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const apiKey = process.env.SENDGRID_API_KEY;


if (!apiKey) {
    console.error('🚨 ERROR: SendGrid API Key is missing!');
    process.exit(1);
}

sgMail.setApiKey(apiKey);

const sendWarningEmail = async (recipientEmail) => {
    try {
        const msg = {
            to: recipientEmail,
            from: process.env.EMAIL_USER,
            subject: 'Account warning',
            html: `
                <h3>Warning!</h3>
                <p>We noticed multiple failed tries to access your account.</p>
                <p>If it wasn't you, please consider changing your password!</p>
                <p>Thank you!</p>
            `,
        };

        await sgMail.send(msg);
        console.log(`✅ Warning email sent to ${recipientEmail}`);
    } catch (error) {
        console.error(`❌ Failed to send email: ${error.message}`);
    }
};

const sendPinEmail = async (recipientEmail, pin1, pin2) => {
    try {
        const msg = {
            to: recipientEmail,
            from: process.env.EMAIL_USER,
            subject: 'Your Secure PIN Codes',
            html: `
                <h3>Welcome!</h3>
                <p>Your account has been successfully created.</p>
                <p>Here are your secure PIN codes:</p>
                <ul>
                    <li><strong>PIN 1:</strong> ${pin1}</li>
                    <li><strong>PIN 2:</strong> ${pin2}</li>
                </ul>
                <p>Please keep these PINs safe and do not share them with anyone.</p>
                <p>Thank you!</p>
            `,
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent to ${recipientEmail}`);
    } catch (error) {
        console.error(`❌ Failed to send email: ${error.message}`);
    }
};


module.exports = { sendWarningEmail, sendPinEmail };
