const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teams_controller'); // Assuming your controller is in controllers/teamController.js

//* POST request to create a new team
router.post('/create', teamController.createTeam);
router.get('/fetch', teamController.getAllTeams);
router.post('/members', teamController.getTeamMembers);
router.post('/add-member', teamController.addMemberToTeams);

module.exports = router;