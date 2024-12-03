const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { verifyAccessToken } = require('../middlewares/auth');


router.get('/fetch', verifyAccessToken, userController.fetchUserData);

module.exports = router;