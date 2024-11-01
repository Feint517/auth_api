const Joi = require('joi');

const authSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    pin1: Joi.string().length(4).pattern(/^[0-9]+$/),
    pin2: Joi.string().length(4).pattern(/^[0-9]+$/),
});

module.exports = { authSchema };
