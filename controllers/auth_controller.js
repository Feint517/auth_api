const User = require('../models/user_model');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { signAccessToken, signRefreshToken } = require('../utils/jwtUtils');
const { authSchema } = require('../validation/auth_validation');
const haversine = require('haversine-distance'); //? to calculate the distance between UserLocation and AllowedArea


//* Function to generate a random 4-digit PIN
const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();  // Generates a 4-digit string
};

exports.register = async (req, res, next) => {
    try {
        //* Validate user input
        const result = await authSchema.validateAsync(req.body);

        //* Check if user already exists
        const doesExist = await User.findOne({ email: result.email });
        if (doesExist) throw createError.Conflict(`Email ${result.email} is already registered`);

        //* Generate two random PINs
        const pin1 = generateRandomPin();
        const pin2 = generateRandomPin();

        //* Create new user and save to database
        const newUser = new User({
            firstName: result.firstName,
            lastName: result.lastName,
            username: result.username,
            email: result.email,
            password: result.password,  //? Password will be hashed automatically via pre-save hook
            pin: result.pin,
        });
        await newUser.save();

        //* Automatically log the user in after registration by generating tokens
        const accessToken = signAccessToken(newUser.id);
        const refreshToken = signRefreshToken(newUser.id);

        //* Calculate expiration dates
        const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        //* Save tokens and expiration times to the user record
        newUser.accessToken = accessToken;
        newUser.refreshToken = refreshToken;
        newUser.accessTokenExpiresAt = accessTokenExpiresAt;
        newUser.refreshTokenExpiresAt = refreshTokenExpiresAt;
        await newUser.save();

        //* Send tokens back to the client
        res.status(201).json({ accessToken, refreshToken, pin1, pin2 });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest('Invalid email or password'));
        next(error);
    }
};

// exports.login = async (req, res, next) => {
//     try {
//         const result = await authSchema.validateAsync(req.body);

//         //* Find user by email
//         const user = await User.findOne({ email: result.email });
//         if (!user) throw createError.NotFound('User not found');

//         //* Validate password
//         const isMatch = await user.isValidPassword(result.password);
//         if (!isMatch) throw createError.Unauthorized('Username/password not valid');

//         //* Validate PIN
//         const isPinValid = await user.isPinValid(result.pin1, result.pin2);
//         if (!isPinValid) throw createError.Unauthorized('Invalid PIN codes');

//         //* Generate tokens
//         const accessToken = signAccessToken(user.id);
//         const refreshToken = signRefreshToken(user.id);

//         const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
//         const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

//         //* Save tokens to the user document
//         user.accessToken = accessToken;
//         user.refreshToken = refreshToken;
//         user.accessTokenExpiresAt = accessTokenExpiresAt;
//         user.refreshTokenExpiresAt = refreshTokenExpiresAt;
//         await user.save();

//         res.json({ accessToken, refreshToken });
//     } catch (error) {
//         if (error.isJoi === true) return next(createError.BadRequest('Invalid email or password'));
//         next(error);
//     }
// };


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

        //* Validate PIN
        //const isPinMatch = await user.isValidPins(result.pin);
        //if (!isPinMatch) throw createError.Unauthorized('Invalid PIN');

        //* Generate tokens
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        //* Save tokens to the user document
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.accessTokenExpiresAt = accessTokenExpiresAt;
        user.refreshTokenExpiresAt = refreshTokenExpiresAt;
        await user.save();

        res.json({ userId, accessToken, refreshToken });
        res.json({ message: 'PINS valid. Verifying your location', userId: user.id });
    } catch (error) {
        next(error);
    }
};


///* logout
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

        user.refreshToken = null; //? Clear the refresh token
        user.accessToken = null; //? Optionally clear the access token
        user.save();

        res.status(200).json({ message: 'Successfully logged out.' });
    } catch (error) {
        next(error);
    }
};




