const Joi = require('joi');

const authSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    username: Joi.string(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string(),
    password: Joi.string().min(6).required(),
    pin1: Joi.string().length(4).pattern(/^[0-9]+$/),
    pin2: Joi.string().length(4).pattern(/^[0-9]+$/),
}).unknown();   //? Allow additional fields

module.exports = { authSchema };
