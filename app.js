const express = require('express');
const dotenv = require('dotenv');
const videoRoutes = require('./routes/videoRoutes')
const authenticate = require('./middlewares/auth');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/videos', videoRoutes);
app.use(authenticate);

module.exports = app;