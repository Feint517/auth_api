const User = require('../models/user_model');
const createError = require('http-errors');
const { signAccessToken, signRefreshToken } = require('../utils/jwtUtils');
const { authSchema } = require('../validation/auth_validation');

exports.register = async (req, res, next) => {
    try {
        //* Validate user input
        const result = await authSchema.validateAsync(req.body);

        //* Check if user already exists
        const doesExist = await User.findOne({ email: result.email });
        if (doesExist) throw createError.Conflict(`Email ${result.email} is already registered`);

        //* Create new user and save to database
        const newUser = new User({
            email: result.email,
            password: result.password  //? Password will be hashed automatically via pre-save hook
        });
        await newUser.save();

        //* Automatically log the user in after registration by generating tokens
        const accessToken = signAccessToken(newUser.id);
        const refreshToken = signRefreshToken(newUser.id);

        //* Save tokens to user document
        // newUser.accessToken = accessToken;
        // newUser.refreshToken = refreshToken;
        await newUser.save();

        //* Send tokens back to the client
        res.status(201).json({ accessToken, refreshToken });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest('Invalid email or password'));
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body);

        //* Find user by email
        const user = await User.findOne({ email: result.email });
        if (!user) throw createError.NotFound('User not found');

        //* Validate password
        const isMatch = await user.isValidPassword(result.password);
        if (!isMatch) throw createError.Unauthorized('Username/password not valid');

        //* Generate tokens
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        //* Save tokens to the user document
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();

        res.json({ accessToken, refreshToken });
    } catch (error) {
        if (error.isJoi === true) return next(createError.BadRequest('Invalid email or password'));
        next(error);
    }
};
