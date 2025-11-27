const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const dbPath = path.join(__dirname, 'db.json');
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventos', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Mongo connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const Event = require('./models/Event');
const User = require('./models/User');
const StaffRequest = require('./models/StaffRequest');
const Log = require('./models/Log');

const migrate = async () => {
  if (!fs.existsSync(dbPath)) {
    console.error('db.json not found');
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(raw);

  // Clear collections (CAUTION)
  await Event.deleteMany({});
  await User.deleteMany({});
  await StaffRequest.deleteMany({});
  await Log.deleteMany({});

  if (Array.isArray(db.events)) {
    const events = db.events.map(e => ({ ...e, createdAt: e.createdAt ? new Date(e.createdAt) : new Date() }));
    await Event.insertMany(events);
    console.log(`Imported ${events.length} events`);
  }

  if (Array.isArray(db.users)) {
    const users = db.users.map(u => ({ ...u, createdAt: u.createdAt ? new Date(u.createdAt) : new Date() }));
    await User.insertMany(users);
    console.log(`Imported ${users.length} users`);
  }

  if (Array.isArray(db.staffRequests)) {
    const reqs = db.staffRequests.map(r => ({ ...r, createdAt: r.createdAt ? new Date(r.createdAt) : new Date() }));
    await StaffRequest.insertMany(reqs);
    console.log(`Imported ${reqs.length} staff requests`);
  }

  if (Array.isArray(db.logs)) {
    const logs = db.logs.map(l => ({ ...l, timestamp: l.timestamp ? new Date(l.timestamp) : new Date() }));
    await Log.insertMany(logs);
    console.log(`Imported ${logs.length} logs`);
  }

  console.log('Migration finished');
  process.exit(0);
};

connect().then(migrate).catch(err => { console.error(err); process.exit(1); });
