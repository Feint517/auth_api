const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pin: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
});

//* Hash password and pins before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (!this.isModified('pin')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.pin = await bcrypt.hash(this.pin, salt);
    next();
});

//* Method to compare password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//* Method to validate the PIN
userSchema.methods.isValidPins = async function (pin) {
    return await bcrypt.compare(pin, this.pin);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
