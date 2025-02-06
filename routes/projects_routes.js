const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects_controller');
const { verifyAccessToken } = require('../middlewares/auth');


router.post('/create', projectsController.createProject);
router.get('/fetch', projectsController.getAllProjects);
router.post('/user', projectsController.getProjectsByUserTeams);
router.put('/update-advancement-rate', projectsController.updateAdvancementRate);

module.exports = router;
