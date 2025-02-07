const User = require('../models/user_model');
const Researcher = require('../models/researcher_model');
const createError = require('http-errors');

exports.fetchUserData = async (req, res, next) => {
    try {
        const userId = req.userId; //? Extracted from the access token

        const user = await User.findById(userId).select('-password -pin1 -pin2 -__v -accessToken -accessTokenExpiresAt -refreshToken -refreshTokenExpiresAt'); //? Exclude sensitive fields like password
        if (!user) throw createError.NotFound('User not found');

        const researcher = await Researcher.findOne({ userId });

        res.status(200).json({ success: true, user, researcher: researcher || null });
    } catch (error) {
        next(error);
    }
}