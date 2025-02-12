const Project = require('../models/project_model');
const Team = require('../models/team_model');
const User = require('../models/user_model');
const createError = require('http-errors');


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
        //* Fetch all projects from the database
        const projects = await Project.find().select('-__v');

        //* If no projects are found, send a 404 response
        if (!projects || projects.length === 0) {
            return res.status(404).json({ message: 'No projects found' });
        }

        //* Send the projects as a response
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the projects' });
    }
};

exports.getProjectsByUserTeams = async (req, res) => {
    try {
        const { userId } = req.body;

        //* Step 1: Find all teams the user is a member of
        const teams = await Team.find({ members: userId });
        if (!teams.length) {
            return res.status(404).json({ message: 'User is not part of any team' });
        }

        //* Step 2: Get the team IDs
        const teamIds = teams.map((team) => team._id);

        //* Step 3: Find projects associated with these teams
        const projects = await Project.find({ team: { $in: teamIds } }).select('-__v');

        //* Step 4: Return the projects
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching projects' });
    }
};

exports.updateAdvancementRate = async (req, res) => {
    try {
        const { projectId, advancementRate } = req.body;

        //* Validate input
        if (!projectId || advancementRate === undefined) {
            return res.status(400).json({ message: 'Project ID and advancement rate are required' });
        }

        if (advancementRate < 0 || advancementRate > 100) {
            return res.status(400).json({ message: 'Advancement rate must be between 0 and 100' });
        }

        //* Find the project and update the advancement rate
        const project = await Project.findById(projectId).select('-__v');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.advancementRate = advancementRate;
        await project.save();

        res.status(200).json({ message: 'Advancement rate updated successfully', project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating the advancement rate' });
    }
};

exports.getProjectDetails = async (req, res, next) => {
    try {
        // const { projectId } = req.body;
        // if (!projectId) throw createError.BadRequest('Project ID is required');

        const { projectCode } = req.body;
        if (!projectCode) throw createError.BadRequest('Project code is required');

        //* Step 1: Find the project by ID
        //const project = await Project.findById(projectId).select('-__v');
        const project = await Project.findOne({ projectCode })
            //.select('-__v')
            .populate({
                path: 'notes.user',
                select: 'firstName lastName email',
            })
            //.populate('team');
            .populate({
                path: 'team', // Ensure team is fully populated
                populate: { path: 'members', select: 'firstName lastName email' }
            });

        if (!project) throw createError.NotFound('Project not found');
        if (!project.team) throw createError.NotFound('Team not found');

        //* Step 2: Find the corresponding team
        // const team = await Team.findById(project.team);
        // if (!team) throw createError.NotFound('Team not found');

        //* Step 3: Fetch all users in the team
        //const teamMembers = await User.find({ _id: { $in: team.members } }).select('-password -__v -refreshToken -refreshTokenExpiresAt -pin1 -pin2');

        // const teamMembers = project.team.members.map(member => ({
        //     id: member._id,
        //     firstName: member.firstName,
        //     lastName: member.lastName,
        //     email: member.email
        // }));

        //* Step 4: Return the complete project details
        res.status(200).json({
            success: true,
            project,
            // team: {
            //     id: project.team._id,
            //     name: project.team.name,
            //     members: teamMembers,
            // },
            // team: {
            //     id: team._id,
            //     name: team.name,
            //     members: teamMembers,
            // },
        });
    } catch (error) {
        next(error);
    }
};

exports.addProjectNote = async (req, res, next) => {
    try {
        const { projectCode, content } = req.body;
        const userId = req.userId;

        if (!projectCode || !content) throw createError.BadRequest('Project code and note content are required');

        //* Find the project
        const project = await Project.findOne({ projectCode });
        if (!project) throw createError.NotFound('Project not found');

        //* Add the new note
        const newNote = { user: userId, content };
        project.notes.push(newNote);
        await project.save();

        res.status(201).json({
            success: true,
            message: 'Note added successfully',
            note: newNote
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteProjectNote = async (req, res, next) => {
    try {
        const { projectCode, noteId } = req.body;
        const userId = req.userId;

        if (!projectCode || !noteId) throw createError.BadRequest('Project code and note ID are required');

        //* Find project
        const project = await Project.findOne({ projectCode });
        if (!project) throw createError.NotFound('Project not found');

        //* Find the note and check ownership
        const noteIndex = project.notes.findIndex(n => n._id.toString() === noteId);
        if (noteIndex === -1) throw createError.NotFound('Note not found');
        if (project.notes[noteIndex].user.toString() !== userId) throw createError.Forbidden('You can only delete your own notes');

        //* Remove the note
        project.notes.splice(noteIndex, 1);
        await project.save();

        res.status(200).json({ success: true, message: 'Note deleted successfully' });
    } catch (error) {
        next(error);
    }
};

