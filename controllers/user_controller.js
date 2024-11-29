const User = require('../models/user_model');
const createError = require('http-errors');

exports.fetchUserData = async (req, res, next) => {
    try {
        const userId = req.userId; //? Extracted from the access token
        const user = await User.findById(userId).select('-password'); //? Exclude sensitive fields like password

        if (!user) {
            throw createError.NotFound('User not found');
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
}