const mongoose = require('mongoose');

const ResearcherSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //? Link to UserSchema
    activity: { type: String, required: true },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }], //? References to teams
});

module.exports = mongoose.model('Researcher', ResearcherSchema);