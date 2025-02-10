const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store key in .env file

const sendPinEmail = async (recipientEmail, pin1, pin2) => {
    try {
        const msg = {
            to: recipientEmail,
            from: process.env.EMAIL_USER, // Verified sender email
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

module.exports = { sendPinEmail };
