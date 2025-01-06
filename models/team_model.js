const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], //? References to users (team members)
});

module.exports = mongoose.model('Team', TeamSchema);