const Team = require('../models/team_model');


exports.createTeam = async (req, res, next) => {
    try {
        const { name, description, members } = req.body;

        //* Validate that name and description are provided
        if (!name || !description) {
            return res.status(400).json({ error: 'Name and description are required' });
        }

        //* Create a new team
        const newTeam = new Team({
            name,
            description,
            members,  //? members is an array of ObjectIds (you can populate this later)
        });

        //* Save the team to the database
        const savedTeam = await newTeam.save();

        //* Send the saved team data as a response
        res.status(201).json(savedTeam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the team' });
    }
};

exports.getAllTeams = async (req, res, next) => {
    try {
        // Fetch all teams from the database
        const teams = await Team.find();

        // If no teams are found, send a 404 response
        if (!teams || teams.length === 0) {
            return res.status(404).json({ message: 'No teams found' });
        }

        // Send the teams as a response
        res.status(200).json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the teams' });
    }
};