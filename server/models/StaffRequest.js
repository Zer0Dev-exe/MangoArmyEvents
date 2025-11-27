const mongoose = require('mongoose');

const StaffRequestSchema = new mongoose.Schema({
  id: { type: String, index: true, unique: true },
  discordId: { type: String, required: true },
  username: String,
  avatarUrl: String,
  staffType: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StaffRequest', StaffRequestSchema);
