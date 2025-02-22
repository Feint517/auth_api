const express = require('express');
const authRoutes = require('./routes/auth_routes');
const userRoutes = require('./routes/user_routes');
const teamRoutes = require('./routes/teams_routes');
const projectRoutes = require('./routes/projects_routes');
const pingRoute = require('./routes/server_routes');
const createError = require('http-errors');
require('dotenv').config();
require('./utils/init_mongodb');
require('./cron/changeSecrets');
const { verifyAccessToken } = require('./middlewares/auth');
const { cleanupExpiredTokens } = require('./cron/cleanupTokens');
const { sendPinEmail, sendWarningEmail } = require('./services/email_service2');


const app = express();
app.use(express.json());

app.get('/', verifyAccessToken, async (req, res, next) => {
    res.send('Hello from express');
})

//* Routes
app.use('/api', pingRoute);
app.use('/teams', teamRoutes);
app.use('/projects', projectRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

app.use(async (req, res, next) => {
    next(createError.NotFound('This route does not exist'));
})

//* Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({ error: { status: err.status || 500, message: err.message } });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//sendPinEmail('arselene.main@gmail.com', 1234, 1234);
//sendWarningEmail('arselene.dev@gmail.com');
//cleanupExpiredTokens();
