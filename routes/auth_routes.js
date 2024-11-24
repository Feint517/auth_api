const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');



router.post('/register', authController.register);
//*-------------------------------------Login------------------------------------------------
//* Step 1: Validate email and password
router.post('/validate-credentials', authController.validateCredentials);
//* Step 2: Validate PIN codes
router.post('/validate-pins', authController.validatePins);
//* Step 3: Validate GeoLocation
router.post('/validate-location', authController.validateGeoLocation);
//*----------------------------------------------------------------------------------------
router.post('/logout', authController.logout);

module.exports = router;
