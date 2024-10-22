const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/user_model');

//* Middleware to validate access token
const verifyAccessToken = async (req, res, next) => {
    try {
        //* Get the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw createError.Unauthorized('Access token is required');

        const token = authHeader.split(' ')[1];  //? Extract token after "Bearer"

        if (!token) throw createError.Unauthorized('Access token is required');

        //* Verify the token
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        //* Find the user associated with the token
        const user = await User.findById(payload.userId);
        if (!user) throw createError.Unauthorized('User not found');

        //* Check if the access token has expired
        if (!user.accessToken || user.accessTokenExpiresAt < new Date()) {
            //* If token is expired or not valid, delete it from the DB
            user.accessToken = null;
            user.accessTokenExpiresAt = null;
            await user.save();
            throw createError.Unauthorized('Access token has expired');
        }

        //* Attach the user to the request for access to user info in the route handler
        req.user = user;
        next();  //? Token is valid, proceed to the next middleware or route handler
    } catch (err) {
        //* Handle invalid token errors
        if (err.name === 'JsonWebTokenError') {
            return next(createError.Unauthorized('Invalid token'));
        }
        if (err.name === 'TokenExpiredError') {
            return next(createError.Unauthorized('Token has expired'));
        }
        next(createError.Unauthorized('Unauthorized access'));
    }
};

module.exports = { verifyAccessToken };
