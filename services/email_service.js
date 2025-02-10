const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like SendGrid, Outlook, etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email with the generated PINs.
 * @param {string} recipientEmail - The email of the recipient.
 * @param {string} pin1 - First generated PIN.
 * @param {string} pin2 - Second generated PIN.
 */
const sendPinEmail = async (recipientEmail, pin1, pin2) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
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

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${recipientEmail}`);
    } catch (error) {
        console.error(`❌ Failed to send email: ${error.message}`);
    }
};

module.exports = { sendPinEmail };
