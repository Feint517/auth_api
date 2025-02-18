const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    projectCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    budget: { type: Number, required: true },
    timeline: { type: String, required: true },
    startDate: { type: Date, required: true },
    advancementRate: { type: Number, required: true, min: 0, max: 100 },
    notes: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

module.exports = mongoose.model('Project', ProjectSchema);
