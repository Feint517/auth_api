const Project = require('../models/project_model');  
const Team = require('../models/team_model');        


exports.createProject = async (req, res, next) => {
    try {
        const { projectCode, name, team, budget, timeline, startDate, advancementRate } = req.body;

        //* Validate that projectCode, name, and other fields are provided
        if (!projectCode || !name || !team || !budget || !timeline || !startDate || advancementRate === undefined) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        //* Check if the team exists
        const foundTeam = await Team.findById(team);
        if (!foundTeam) {
            return res.status(400).json({ error: 'Team does not exist' });
        }

        //* Create a new project
        const newProject = new Project({
            projectCode,
            name,
            team,  //? Team is an ObjectId reference
            budget,
            timeline,
            startDate,
            advancementRate,
        });

        //* Save the project to the database
        const savedProject = await newProject.save();

        //* Send the saved project data as a response
        res.status(201).json(savedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the project' });
    }
};

exports.getAllProjects = async (req, res, next) => {
    try {
        // Fetch all projects from the database
        const projects = await Project.find();

        // If no projects are found, send a 404 response
        if (!projects || projects.length === 0) {
            return res.status(404).json({ message: 'No projects found' });
        }

        // Send the projects as a response
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the projects' });
    }
};
