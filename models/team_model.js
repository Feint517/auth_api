const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the team
    description: { type: String, required: true }, // A description of the team's purpose or focus
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // References to users (team members)
    createdDate: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('Team', TeamSchema);
