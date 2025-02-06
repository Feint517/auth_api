const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teams_controller');
const { verifyAccessToken } = require('../middlewares/auth');

//* POST request to create a new team
router.post('/create', teamController.createTeam);
router.get('/fetch', verifyAccessToken, teamController.getAllTeams);
router.post('/members', teamController.getTeamMembers);
router.post('/add-member', teamController.addMemberToTeams);

module.exports = router;