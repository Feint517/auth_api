const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/user_model');

//* Middleware to validate access token
// const verifyAccessToken = async (req, res, next) => {
//     try {
//         //* Get the token from the Authorization header
//         const authHeader = req.headers['authorization'];
//         if (!authHeader) throw createError.Unauthorized('Access token is required');

//         const token = authHeader.split(' ')[1];  //? Extract token after "Bearer"
//         if (!token) throw createError.Unauthorized('Access token is required');

//         //* Verify the token
//         const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//         console.log('Decoded Payload:', payload);

//         //* Find the user associated with the token
//         const user = await User.findById(payload.userId).select('-password');
//         if (!user) {
//             console.log('No user found for ID:', payload.userId); //? Debugging
//             throw createError.Unauthorized('User not found');
//         }
//         console.log('user:', user);

//         //* Check if the access token has expired
//         if (!user.accessToken || user.accessTokenExpiresAt < new Date()) {
//             //* If token is expired or not valid, delete it from the DB
//             user.accessToken = null;
//             user.accessTokenExpiresAt = null;
//             await user.save();
//             throw createError.Unauthorized('Access token has expired');
//         }

//         //* Attach the userId to the request for access to user info in the route handler
//         //req.userId = user.id;
//         req.userId = payload.userId;


//         console.log("userId attached to req:", user.id);
//         next();  //? Token is valid, proceed to the next middleware or route handler
//     } catch (err) {
//         //* Handle invalid token errors
//         if (err.name === 'JsonWebTokenError') {
//             return next(createError.Unauthorized('Invalid token'));
//         }
//         if (err.name === 'TokenExpiredError') {
//             return next(createError.Unauthorized('Token has expired'));
//         }
//         next(createError.Unauthorized('Unauthorized access'));
//     }
// };


const verifyAccessToken = async (req, res, next) => {
    try {
        //* Get the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw createError.Unauthorized('Access token is required');

        const token = authHeader.split(' ')[1];  //? Extract token after "Bearer"
        if (!token) throw createError.Unauthorized('Access token is required');

        //* Verify the token with JWT
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('Decoded Payload:', payload);

        //* Find the user in the database (DO NOT check `user.accessToken`)
        const user = await User.findById(payload.userId || payload.id).select('-password');
        if (!user) {
            console.log('No user found for ID:', payload.userId || payload.id);
            throw createError.Unauthorized('User not found');
        }
        //console.log('User:', user);

        //* Attach userId to the request for route access
        req.userId = user.id;
        console.log("User ID attached to req:", req.userId);

        next(); //? Token is valid, proceed to the next middleware or route handler
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
