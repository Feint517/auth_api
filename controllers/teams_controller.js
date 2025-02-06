const Team = require('../models/team_model');
const User = require('../models/user_model');
const Researcher = require('../models/researcher_model');


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
        //* Fetch all teams from the database
        const teams = await Team.find().select('-__v');

        //* If no teams are found, send a 404 response
        if (!teams || teams.length === 0) {
            return res.status(404).json({ message: 'No teams found' });
        }

        //* Send the teams as a response
        res.status(200).json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the teams' });
    }
};

exports.getTeamMembers = async (req, res) => {
    try {
        const { teamId } = req.body;

        //* Validate teamId
        if (!teamId) {
            return res.status(400).json({ message: 'Team ID is required' });
        }


        //* Step 1: Find the team and populate members
        const team = await Team.findById(teamId).populate('members', 'firstName lastName email phoneNumber username');
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        //* Step 2: Extract members from the team document
        const members = team.members;

        //* Step 3: Return the members' information
        res.status(200).json({ teamName: team.name, members });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching team members' });
    }
};

exports.addMemberToTeams = async (req, res) => {
    try {
        const { teamIds, userId } = req.body;
        // const { teamIds } = req.body;
        // const userId = req.userId;

        //* Validate teamIds and userId
        if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
            return res.status(400).json({ message: 'At least one Team ID is required' });
        }
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        //* Step 1: Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        //* Step 2: Find the Researcher document for the user
        const researcher = await Researcher.findOne({ userId });
        if (!researcher) {
            return res.status(404).json({ message: 'Researcher record not found' });
        }

        const addedTeams = [];
        const errors = [];

        //* Step 3: Process each teamId
        for (const teamId of teamIds) {
            try {
                //* Find the team
                const team = await Team.findById(teamId);
                if (!team) {
                    errors.push({ teamId, message: 'Team not found' });
                    continue;
                }

                //* Check if the user is already a member of the team
                if (team.members.includes(userId)) {
                    errors.push({ teamId, message: 'User is already a member of the team' });
                    continue;
                }

                //* Add the user to the team's members
                team.members.push(userId);
                await team.save();

                //* Add the team to the Researcher document if not already present
                if (!researcher.teams.includes(teamId)) {
                    researcher.teams.push(teamId);
                }

                addedTeams.push(teamId);
            } catch (teamError) {
                errors.push({ teamId, message: teamError.message });
            }
        }

        //* Save the updated Researcher document
        await researcher.save();

        //* Return a response summarizing the results
        res.status(200).json({
            message: 'Processing complete',
            addedTeams,
            errors,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while adding the member to teams' });
    }
};

