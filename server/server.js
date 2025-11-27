const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const apiKeyAuth = require('./middlewares/apiKeyAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// API Key middleware
app.use(apiKeyAuth);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api', require('./routes/discord'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
