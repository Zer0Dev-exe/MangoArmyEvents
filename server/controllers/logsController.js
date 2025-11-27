const Log = require('../models/Log');

exports.getLogs = async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).lean();
  res.json(logs);
};

exports.createSession = async (req, res) => {
  const sessionLog = new Log({
    id: Date.now().toString(),
    action: 'session',
    timestamp: new Date(),
    event: {
      type: 'page_visit',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    }
  });
  await sessionLog.save();
  res.status(200).json({ message: 'Session logged' });
};
