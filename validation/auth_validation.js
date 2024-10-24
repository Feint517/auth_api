const Joi = require('joi');

const authSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    pin:Joi.string().length(4).pattern(/^[0-9]+$/).required(),
});

module.exports = { authSchema };
