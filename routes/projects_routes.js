const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projects_controller');

// POST request to create a new project
router.post('/create', projectsController.createProject);
router.get('/fetch', projectsController.getAllProjects);

module.exports = router;
