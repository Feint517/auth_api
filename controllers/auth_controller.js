const User = require('../models/user_model');
const Researcher = require('../models/researcher_model');
const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { signAccessToken, signRefreshToken } = require('../utils/jwtUtils');
const { authSchema } = require('../validation/auth_validation');
const haversine = require('haversine-distance'); //? to calculate the distance between UserLocation and AllowedArea
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

//* Function to generate a random 4-digit PIN
const generateRandomPin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();  // Generates a 4-digit string
};

exports.register = async (req, res, next) => {
    try {

        console.log('Request body:', req.body);
        //* Validate user input
        const result = await authSchema.validateAsync(req.body);
        const { role, teams, projects } = req.body;

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

        if (projects && !projects.every(isValidObjectId)) {
            throw createError.BadRequest('One or more project IDs are invalid');
        }

        //* Step 3: Create the researcher record linked to the user
        const newResearcher = new Researcher({
            userId: savedUser._id,
            role: role,
            //teams: teams,
            //projects: projects,
            teams: teams ? teams.map((team) => new ObjectId(team)) : [], //? Convert strings to ObjectId
            projects: projects ? projects.map((project) => new ObjectId(project)) : [], //? Convert strings to ObjectId
        });

        await newResearcher.save();

        //* Automatically log the user in after registration by generating tokens
        const accessToken = signAccessToken(newUser.id);
        const refreshToken = signRefreshToken(newUser.id);

        //* Calculate expiration dates
        const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        //* Save tokens and expiration times to the user record
        // newUser.accessToken = accessToken;
        // newUser.refreshToken = refreshToken;
        // newUser.accessTokenExpiresAt = accessTokenExpiresAt;
        // newUser.refreshTokenExpiresAt = refre shTokenExpiresAt;
        //await newUser.save();

        savedUser.accessToken = accessToken;
        savedUser.refreshToken = refreshToken;
        savedUser.accessTokenExpiresAt = accessTokenExpiresAt;
        savedUser.refreshTokenExpiresAt = refreshTokenExpiresAt;

        await savedUser.save();


        //* Send tokens back to the client
        res.status(201).json({ accessToken, refreshToken, pin1, pin2 });
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

        // //* Generate tokens
        // const accessToken = signAccessToken(user.id);
        // const refreshToken = signRefreshToken(user.id);

        // const accessTokenExpiresAt = new Date(jwt.decode(accessToken).exp * 1000);
        // const refreshTokenExpiresAt = new Date(jwt.decode(refreshToken).exp * 1000);

        // //* Save tokens to the user document
        // user.accessToken = accessToken;
        // user.refreshToken = refreshToken;
        // user.accessTokenExpiresAt = accessTokenExpiresAt;
        // user.refreshTokenExpiresAt = refreshTokenExpiresAt;
        // await user.save();

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
            throw createError.Unauthorized('Login is only allowed in specific geographic areas');
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
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        user.accessTokenExpiresAt = accessTokenExpiresAt;
        user.refreshTokenExpiresAt = refreshTokenExpiresAt;
        await user.save();

        res.json({ accessToken, refreshToken });
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
        user.accessToken = null;
        user.accessTokenExpiresAt = null;
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
                // Refresh token is valid
                res.status(200).json({ message: 'Refresh token is valid' });
            }
        );
    } catch (err) {
        next(err);
    }
};

// exports.refreshTokens1 = async (req, res, next) => {
//     try {
//         const { refreshToken } = req.body;

//         if (!refreshToken) {
//             throw createError.BadRequest('Refresh token is required');
//         }

//         //* Find the user by refresh token
//         const user = await User.findOne({ refreshToken });
//         if (!user) {
//             throw createError.Unauthorized('Refresh token is invalid');
//         }

//         //* Check if the refresh token has expired
//         if (new Date() > user.refreshTokenExpiresAt) {
//             //* Generate a new refresh token and expiration date
//             const newAccessToken = signAccessToken(user.id);
//             const newRefreshToken = signRefreshToken(user.id);

//             const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); //* 7 days from now

//             //* Update the user document
//             user.refreshToken = newRefreshToken;
//             user.refreshTokenExpiresAt = newExpiresAt;
//             await user.save();

//             return res.status(200).json({
//                 accessToken: newAccessToken,
//                 refreshToken: newRefreshToken,
//                 refreshTokenExpiresAt: newExpiresAt,
//             });
//         }

//         // *Token is still valid; no need to re-generate
//         return res.status(400).json({ message: 'Refresh token is still valid' });
//     } catch (err) {
//         next(err);
//     }
// };


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

            // return res.status(200).json({
            //     accessToken: newAccessToken,
            //     refreshToken: newRefreshToken,
            //     refreshTokenExpiresAt: newExpiresAt,
            // });
        }

        //* Generate a new access token
        const newAccessToken = signAccessToken(user.id);
        // const newAccessToken = jwt.sign(
        //     { id: payload.id },
        //     process.env.ACCESS_TOKEN_SECRET,
        //     { expiresIn: '15m' }
        // );
        res.status(200).json({ accessToken: newAccessToken, refreshToken: refreshToken });
    } catch (err) {
        next(err);
    }
};