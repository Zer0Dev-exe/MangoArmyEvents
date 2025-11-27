// Entrypoint backward-compatible: cargar la nueva estructura modular
require('dotenv').config();
// Si el usuario ejecuta index.js, arrancamos server.js
require('./server');
