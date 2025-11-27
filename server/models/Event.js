const mongoose = require('mongoose');

const OrganizerSchema = new mongoose.Schema({
  id: String,
  username: String,
  avatarUrl: String
});

const EventSchema = new mongoose.Schema({
  id: { type: String, index: true, unique: true },
  title: { type: String, required: true },
  description: String,
  date: { type: Date },
  time: String,
  category: String,
  organizers: [OrganizerSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
