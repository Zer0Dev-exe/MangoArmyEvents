const User = require('../models/User');
const StaffRequest = require('../models/StaffRequest');
const Log = require('../models/Log');
const axios = require('axios');
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').filter(Boolean);

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
  return password;
};

exports.login = async (req, res) => {
  const { discordId, password } = req.body;
  const user = await User.findOne({ discordId, password }).lean();
  if (!user) return res.status(401).json({ error: 'ID o contraseña incorrectos' });
  res.json({ user: { discordId: user.discordId, username: user.username, avatarUrl: user.avatarUrl, role: user.role, roles: user.roles } });
};

exports.requestStaff = async (req, res) => {
  const { discordId, staffType } = req.body;
  if (!discordId || discordId.trim() === '') return res.status(400).json({ error: 'El ID de Discord es requerido' });
  if (!staffType || !['podcaster', 'minecraft', 'discord'].includes(staffType)) return res.status(400).json({ error: 'Debes seleccionar un tipo de acceso válido' });

  const existingUser = await User.findOne({ discordId });
  if (existingUser) return res.status(400).json({ error: 'Ya eres parte del staff' });

  const existingRequest = await StaffRequest.findOne({ discordId, status: 'pending' });
  if (existingRequest) return res.status(400).json({ error: 'Ya tienes una solicitud pendiente' });

  const botToken = process.env.DISCORD_BOT_TOKEN;
  let discordUser = { username: `Usuario_${discordId.slice(-4)}`, avatar: null };

  try {
    if (botToken) {
      const response = await axios.get(`https://discord.com/api/v10/users/${discordId}`, { headers: { Authorization: `Bot ${botToken}` } });
      discordUser = response.data;
    }
  } catch (err) {
    console.error('Error fetching Discord user:', err.message);
  }

  const request = new StaffRequest({ id: Date.now().toString(), discordId, username: discordUser.username, avatarUrl: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png` : null, staffType, status: 'pending', createdAt: new Date() });
  await request.save();
  res.status(201).json({ message: 'Solicitud enviada correctamente' });
};

exports.getRequests = async (req, res) => {
  const pending = await StaffRequest.find({ status: 'pending' }).lean();
  res.json(pending);
};

exports.approveRequest = async (req, res) => {
  const { id } = req.params;
  const { adminDiscordId } = req.body;

  const adminUser = await User.findOne({ discordId: adminDiscordId });
  if (!adminUser && !ADMIN_IDS.includes(adminDiscordId)) return res.status(403).json({ error: 'No tienes permisos de administrador' });

  const reqDoc = await StaffRequest.findOne({ id });
  if (!reqDoc) return res.status(404).json({ error: 'Solicitud no encontrada' });

  const password = generatePassword();
  const roleMap = { podcaster: 'podcaster', minecraft: 'staff-mc', discord: 'staff-discord' };
  const role = roleMap[reqDoc.staffType] || 'staff';

  const newUser = new User({ discordId: reqDoc.discordId, username: reqDoc.username, avatarUrl: reqDoc.avatarUrl, password, role, roles: [role], createdAt: new Date() });
  await newUser.save();

  reqDoc.status = 'approved';
  await reqDoc.save();

  res.json({ message: 'Usuario aprobado', user: { username: newUser.username, password, roles: newUser.roles } });
};

exports.rejectRequest = async (req, res) => {
  const { id } = req.params;
  const { adminDiscordId } = req.body;
  const adminUser = await User.findOne({ discordId: adminDiscordId });
  if (!adminUser && !ADMIN_IDS.includes(adminDiscordId)) return res.status(403).json({ error: 'No tienes permisos de administrador' });

  const reqDoc = await StaffRequest.findOne({ id });
  if (!reqDoc) return res.status(404).json({ error: 'Solicitud no encontrada' });
  reqDoc.status = 'rejected';
  await reqDoc.save();
  res.json({ message: 'Solicitud rechazada' });
};

exports.getUsers = async (req, res) => {
  const users = await User.find().lean();
  const normalized = users.map(u => ({ discordId: u.discordId, username: u.username, avatarUrl: u.avatarUrl, role: u.role, roles: u.roles || [u.role], createdAt: u.createdAt }));
  res.json(normalized);
};

exports.updateRoles = async (req, res) => {
  const { id } = req.params;
  const { adminDiscordId, roles } = req.body;

  const getUserRoles = (u) => Array.isArray(u.roles) ? u.roles : [u.role];
  const adminUser = await User.findOne({ discordId: adminDiscordId });
  if (!adminUser && !ADMIN_IDS.includes(adminDiscordId)) return res.status(403).json({ error: 'No tienes permisos de administrador' });

  const targetUser = await User.findOne({ discordId: id });
  if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  const adminRoles = adminUser ? getUserRoles(adminUser) : [];
  const isOwner = adminRoles.includes('owner') || ADMIN_IDS.includes(adminDiscordId);
  if (targetUser.roles && targetUser.roles.includes('owner') && !isOwner) return res.status(403).json({ error: 'Solo los owners pueden modificar a otros owners' });

  const validRoles = ['owner', 'admin', 'developer', 'podcaster', 'staff-mc', 'staff-discord'];
  const filteredRoles = (roles || []).filter(r => validRoles.includes(r));
  if (filteredRoles.includes('owner') && !isOwner) return res.status(403).json({ error: 'Solo los owners pueden asignar el rol de owner' });
  if (filteredRoles.includes('developer') && !isOwner) return res.status(403).json({ error: 'Solo los owners pueden asignar el rol de developer' });
  if (filteredRoles.length === 0) return res.status(400).json({ error: 'Debe tener al menos un rol válido' });

  targetUser.roles = filteredRoles;
  targetUser.role = filteredRoles[0];
  await targetUser.save();
  res.json({ message: 'Roles actualizados', roles: filteredRoles });
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { adminDiscordId } = req.body;
  const getUserRoles = (u) => Array.isArray(u.roles) ? u.roles : [u.role];
  const adminUser = await User.findOne({ discordId: adminDiscordId });
  if (!adminUser && !ADMIN_IDS.includes(adminDiscordId)) return res.status(403).json({ error: 'No tienes permisos de administrador' });

  const targetUser = await User.findOne({ discordId: id });
  if (!targetUser) return res.status(404).json({ error: 'Usuario no encontrado' });

  const adminRoles = adminUser ? getUserRoles(adminUser) : [];
  const isOwner = adminRoles.includes('owner') || ADMIN_IDS.includes(adminDiscordId);
  if (targetUser.roles && targetUser.roles.includes('owner') && !isOwner) return res.status(403).json({ error: 'Solo los owners pueden eliminar a otros owners' });

  await User.deleteOne({ discordId: id });
  res.json({ message: 'Usuario eliminado' });
};

exports.checkAdmin = async (req, res) => {
  const { id } = req.params;
  const user = await User.findOne({ discordId: id }).lean();
  const isInitialAdmin = ADMIN_IDS.includes(id);
  if (user) return res.json({ isAdmin: user.role === 'admin', isUser: true });
  res.json({ isAdmin: isInitialAdmin, isUser: false });
};
