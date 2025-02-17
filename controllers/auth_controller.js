const User = require('../models/user_model');
const Researcher = require('../models/researcher_model');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken } = require('../utils/jwtUtils');
const { authSchema } = require('../validation/auth_validation');
const haversine = require('haversine-distance'); //? to calculate the distance between UserLocation and AllowedArea
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { sendPinEmail } = require('../services/email_service');
const twilio = require('twilio');

//* Load environment variables
require('dotenv').config();

//* Initialize Twilio Client
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//* Function to generate a random 4-digit PIN
const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();  //? Generates a 4-digit string
};

exports.register = async (req, res, next) => {
    try {

        console.log('Request body:', req.body);
        //* Validate user input
        const result = await authSchema.validateAsync(req.body);
        const { activity, teams, projects } = req.body;

        console.log('Validation result:', result);

        //* Check if user already exists
        const doesExist = await User.findOne({ email: result.email });
        if (doesExist) throw createError.Conflict(`Email ${result.email} is already registered`);

        //* Generate two random PINs
        const pin1 = generateRandomPin();
        const pin2 = generateRandomPin();

        //* Step1: Create new user
        const newUser = new User({
            firstName: result.firstName,
            lastName: result.lastName,
            username: result.username,
            email: result.email,
            phoneNumber: result.phoneNumber,
            password: result.password,  //? Password will be hashed automatically via pre-save hook
            pin1: pin1,
            pin2: pin2,
        });

        const savedUser = await newUser.save();

        //* Step 2: Validate and convert teams/projects to ObjectId
        const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

        if (teams && !teams.every(isValidObjectId)) {
            throw createError.BadRequest('One or more team IDs are invalid');
        }

        //* Step 3: Create the researcher record linked to the user
        const newResearcher = new Researcher({
            userId: savedUser._id,
            activity: activity,
            teams: teams ? teams.map((team) => new ObjectId(team)) : [], //? Convert strings to ObjectId
        });

        await newResearcher.save();

        //* Step 4: Send SMS with PINs
        const messageBody = `Welcome to the app! Your login PINs are:\nPIN 1: ${pin1}\nPIN 2: ${pin2}\nKeep them secure and do not share with anyone.`;
        console.log(messageBody);
        await client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: result.phoneNumber,
        }).then(message => console.log(message.sid));

        //* or send them through email
        //sendPinEmail(newUser.email, pin1, pin2);

        //* Automatically log the user in after registration by generating tokens
        const accessToken = signAccessToken(newUser.id);
        const refreshToken = signRefreshToken(newUser.id);

        const userId = newUser.id;

        //* Calculate expiration dates
        const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        //savedUser.accessToken = accessToken;
        savedUser.refreshToken = refreshToken;
        //savedUser.accessTokenExpiresAt = accessTokenExpiresAt;
        savedUser.refreshTokenExpiresAt = refreshTokenExpiresAt;

        await savedUser.save();


        //* Send tokens back to the client
        res.status(201).json({ userId, accessToken, refreshToken, pin1, pin2 });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest('Invalid email or password'));
        next(error);
    }
};

//*-------------------------------------Login--------------------------------------------------------
//* Step 1: Validate email and password
exports.validateCredentials = async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body);

        //* Find user by email
        const user = await User.findOne({ email: result.email });
        if (!user) throw createError.NotFound('User not found');

        //* Validate password
        const isMatch = await user.isValidPassword(result.password);
        if (!isMatch) throw createError.Unauthorized('Username/password not valid');

        res.json({ message: 'User Found, verify your pins', userId: user.id });
    } catch (error) {
        next(error);
    }
};

//* Step2: validate GeoLocation
exports.validateGeoLocation = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;

        //* Define the allowed area
        const allowedArea = {
            latitude: 36.815099,    //? Center latitude
            longitude: 7.716793, //? Center longitude
            radius: 5000          //? Radius in meters (5 km)
        };

        //* User's location from the request
        const userLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        };

        //* Calculate the distance between user's location and allowed area
        const distance = haversine(allowedArea, userLocation);

        //* Check if the user is within the allowed radius
        if (distance > allowedArea.radius) {
            throw createError.Unauthorized('This operation is only allowed in specific geographic areas');
        }

        res.json({ message: 'Location is valid.' });
    } catch (error) {
        next(error);
    }
}

//* Step3: validate PINs
exports.validatePins = async (req, res, next) => {
    try {
        const { userId, pin1, pin2 } = req.body;

        //* Find user by ID
        const user = await User.findById(userId);
        if (!user) throw createError.NotFound('User not found');

        //* Validate PINs
        const isPinValid = await user.isPinValid(pin1, pin2);
        if (!isPinValid) throw createError.Unauthorized('Invalid PIN codes');

        //* Generate tokens
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        //* Save tokens to the user document
        //user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        //user.accessTokenExpiresAt = accessTokenExpiresAt;
        user.refreshTokenExpiresAt = refreshTokenExpiresAt;
        await user.save();

        res.json({ userId, accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
};
//*-------------------------------------------------------------------------------------------

//* logout
exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw createError.BadRequest('Refresh token is required.');
        }

        //* Find and remove the refresh token from the database
        const user = await User.findOne({ refreshToken });

        if (!user) {
            throw createError.NotFound('User not found.');
        }

        //* optionnaly clear the tokens
        user.refreshToken = null;
        user.refreshTokenExpiresAt = null;
        //user.accessToken = null;
        //user.accessTokenExpiresAt = null;
        user.save();

        res.status(200).json({ message: 'Successfully logged out.' });
    } catch (error) {
        next(error);
    }
};

exports.checkRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw createError.BadRequest('Refresh token is required');
        }

        //* Find the user by refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) {
            throw createError.Unauthorized('Refresh token is invalid');
        }

        //* Check if the refresh token has expired
        if (new Date() > user.refreshTokenExpiresAt) {
            throw createError.Unauthorized('Refresh token has expired');
        }

        //* Verify the token's signature and payload
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, payload) => {
                if (err) {
                    throw createError.Unauthorized('Refresh token is invalid');
                }
                //? Refresh token is valid
                res.status(200).json({ message: 'Refresh token is valid' });
            }
        );
    } catch (err) {
        next(err);
    }
};

exports.refreshTokens = async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw createError.BadRequest('Refresh token is required');
    }

    //* Find the user by refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
        throw createError.Unauthorized('Refresh token is invalid');
    }

    try {

        //* Verify the refresh token
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        //* Check expiration (handled automatically by jwt.verify)
        console.log('Token is valid, user ID:', payload.id);

        if (new Date() > user.refreshTokenExpiresAt) {
            //* Generate a new refresh token and expiration date
            //const newAccessToken = signAccessToken(user.id);
            const newRefreshToken = signRefreshToken(user.id);

            const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); //* 7 days from now

            //* Update the user document
            user.refreshToken = newRefreshToken;
            user.refreshTokenExpiresAt = newExpiresAt;
            await user.save();

        }

        //* Generate a new access token
        const newAccessToken = signAccessToken(user.id);

        res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken || refreshToken });
    } catch (err) {
        next(err);
    }
};


exports.refreshTokensFixed = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest('Refresh token is required');

        //* Find user by refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) throw createError.Unauthorized('Invalid refresh token');

        //* Check if refresh token has expired BEFORE verifying it
        if (new Date() > user.refreshTokenExpiresAt) {
            throw createError.Unauthorized('Refresh token expired, please log in again');
        }

        //* Verify refresh token
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('Valid refresh token for user ID:', payload.id);

        let newRefreshToken = refreshToken; //? Keep old token by default

        //* If token is close to expiration, generate a new one
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000); //? 1 day from now
        if (user.refreshTokenExpiresAt < expiresInOneDay) {
            console.log('Generating new refresh token...');
            newRefreshToken = signRefreshToken(user.id);
            user.refreshToken = newRefreshToken;
            user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); //? 7 days from now
            await user.save();
        }

        //* Generate a new access token
        const newAccessToken = signAccessToken(user.id);

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(createError.Unauthorized('Refresh token expired, please log in again'));
        }
        next(err);
    }
};

exports.refreshTokensFixed2 = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw createError.BadRequest('Refresh token is required');

        //* Find user by refresh token
        const user = await User.findOne({ refreshToken });
        if (!user) throw createError.Unauthorized('Invalid refresh token');

        //* Check if refresh token has expired BEFORE verifying it
        if (new Date() > user.refreshTokenExpiresAt) {
            throw createError.Unauthorized('Refresh token expired, please log in again');
        }

        //* Verify refresh token
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        console.log('Valid refresh token for user ID:', payload.id);

        let newRefreshToken = refreshToken; // Default: keep the old refresh token

        //* If the refresh token is about to expire, generate a new one
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
        if (user.refreshTokenExpiresAt < expiresInOneDay) {
            console.log('Generating new refresh token...');
            newRefreshToken = signRefreshToken(user.id);
            user.refreshToken = newRefreshToken;
            user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }

        //* ✅ Generate a new access token
        const newAccessToken = signAccessToken(user.id);

        //* ✅ Save both tokens in the database
        user.accessToken = newAccessToken;
        user.accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        await user.save();

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(createError.Unauthorized('Refresh token expired, please log in again'));
        }
        next(err);
    }
};


exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId; //? Extract user ID from the authentication middleware

        //* Validate inputs
        if (!currentPassword || !newPassword) {
            throw createError.BadRequest('Current and new passwords are required.');
        }

        //* Fetch user from the database
        const user = await User.findById(userId);
        if (!user) throw createError.NotFound('User not found');

        //* Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw createError.Unauthorized('Incorrect current password');

        //* Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        //* Update password in the database
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};