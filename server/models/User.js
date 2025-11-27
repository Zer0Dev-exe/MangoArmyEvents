const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true, unique: true },
  username: String,
  avatarUrl: String,
  password: String,
  role: String,
  roles: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
