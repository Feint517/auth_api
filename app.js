const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth_routes');
const createError = require('http-errors');
require('dotenv').config();
require('./utils/init_mongodb');

const app = express();
app.use(express.json());

//* Routes
app.use('/auth', authRoutes);

app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist'));
})

//* Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({ error: { status: err.status || 500, message: err.message } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
