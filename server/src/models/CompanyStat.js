const mongoose = require('mongoose');

const companyStatSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: ['years_experience', 'projects_completed', 'active_clients', 'team_members'],
  },
  value: {
    type: Number,
    required: true,
  },
  suffix: {
    type: String,
    default: '+',
  },
  label: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('CompanyStat', companyStatSchema);
