const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    projectCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    budget: { type: Number, required: true },
    timeline: { type: String, required: true }, // Timeline of the project (could be a string or another date format)
    startDate: { type: Date, required: true },
    advancementRate: { type: Number, required: true, min: 0, max: 100 },
});

module.exports = mongoose.model('Project', ProjectSchema);
