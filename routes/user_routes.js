const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { verifyAccessToken, authenticate} = require('../middlewares/auth');


router.get('/fetch', authenticate ,userController.fetchUserData);

module.exports = router;