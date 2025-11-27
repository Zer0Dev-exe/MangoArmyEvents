const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  id: { type: String, index: true, unique: true },
  action: String,
  timestamp: { type: Date, default: Date.now },
  event: mongoose.Schema.Types.Mixed,
  performedBy: mongoose.Schema.Types.Mixed,
  changes: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Log', LogSchema);
