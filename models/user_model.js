const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pin1: { type: String, required: true },
    pin2: { type: String, required: true },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessTokenExpiresAt: { type: Date },
    refreshTokenExpiresAt: { type: Date },
});

//* Hash password and pins before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (!this.isModified('pin1') && !this.isModified('pin2')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.pin1 = await bcrypt.hash(this.pin1, salt);
    this.pin2 = await bcrypt.hash(this.pin2, salt);
    next();
});

//* Method to compare password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//* Method to validate the PIN
userSchema.methods.isValidPins = async function (pin1, pin2) {
    const isPin1Match = await bcrypt.compare(pin1, this.pin1);
    const isPin2Match = await bcrypt.compare(pin2, this.pin2);
    return isPin1Match && isPin2Match;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
