const cron = require('node-cron');
const User = require('../models/user_model');

//? Cron job runs every day at midnight to remove expired tokens
cron.schedule('0 0 * * *', async () => {
    console.log('Running token cleanup job...');

    const now = new Date();

    try {
        //* Find users with expired refresh tokens and remove the tokens
        await User.updateMany(
            { refreshTokenExpiresAt: { $lte: now } },
            { $unset: { refreshToken: "", refreshTokenExpiresAt: "" } }
        );

        //* Optionally also clean up access tokens
        await User.updateMany(
            { accessTokenExpiresAt: { $lte: now } },
            { $unset: { accessToken: "", accessTokenExpiresAt: "" } }
        );

        console.log('Expired tokens cleaned up');
    } catch (err) {
        console.error('Error during token cleanup:', err);
    }
});
