const Event = require('../models/Event');
const Log = require('../models/Log');

const logAction = async (action, eventData, oldEventData = null, performedBy = null) => {
  const logEntry = new Log({
    id: Date.now().toString(),
    action,
    timestamp: new Date(),
    event: eventData,
    performedBy
  });

  if (action === 'update' && oldEventData) {
    const changes = {};
    if (eventData.title !== oldEventData.title) changes.title = { old: oldEventData.title, new: eventData.title };
    if (eventData.description !== oldEventData.description) changes.description = { old: oldEventData.description, new: eventData.description };
    if (eventData.time !== oldEventData.time) changes.time = { old: oldEventData.time, new: eventData.time };
    if (eventData.category !== oldEventData.category) changes.category = { old: oldEventData.category, new: eventData.category };
    if (JSON.stringify(eventData.date) !== JSON.stringify(oldEventData.date)) changes.date = { old: oldEventData.date, new: eventData.date };

    const oldOrgIds = (oldEventData.organizers || []).map(o => o.id);
    const newOrgIds = (eventData.organizers || []).map(o => o.id);
    const addedOrgs = (eventData.organizers || []).filter(o => !oldOrgIds.includes(o.id));
    const removedOrgs = (oldEventData.organizers || []).filter(o => !newOrgIds.includes(o.id));
    if (addedOrgs.length) changes.organizersAdded = addedOrgs;
    if (removedOrgs.length) changes.organizersRemoved = removedOrgs;

    logEntry.changes = changes;
  }

  await logEntry.save();
};

exports.getEvents = async (req, res) => {
  const events = await Event.find().sort({ date: 1 }).lean();
  res.json(events);
};

exports.createEvent = async (req, res) => {
  try {
    const { performedBy, ...eventData } = req.body;
    const newEvent = new Event({ id: Date.now().toString(), ...eventData });
    await newEvent.save();
    await logAction('create', newEvent.toObject(), null, performedBy);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando evento' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { performedBy, ...eventData } = req.body;
    const existing = await Event.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });
    const oldEvent = existing.toObject();
    Object.assign(existing, eventData);
    await existing.save();
    await logAction('update', existing.toObject(), oldEvent, performedBy);
    res.json(existing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando evento' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { performedBy } = req.body || {};
    const existing = await Event.findOne({ id });
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });
    await existing.remove();
    await logAction('delete', existing.toObject(), null, performedBy);
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando evento' });
  }
};
