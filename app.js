const express = require('express');
const dotenv = require('dotenv');
const videoRoutes = require('./routes/videoRoutes')
const errorMiddleware = require('./middlewares/errorMiddleware')

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api/videos', videoRoutes);
app.use(errorMiddleware);

module.exports = app;