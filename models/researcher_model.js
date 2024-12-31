const mongoose = require('mongoose');

const ResearcherSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //? Link to UserSchema
    role: { type: String, enum: ['Chief', 'Team Leader', 'PhD' ,'Researcher'], required: true },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }], //? References to teams
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }], //? References to projects
    //contactDetails: { type: String },
});

module.exports = mongoose.model('Researcher', ResearcherSchema);
