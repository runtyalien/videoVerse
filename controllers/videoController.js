const Video = require('../models/videoModel');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { exec } = require('child_process');
const ffprobePath = require('ffprobe-static').path;

const MAX_SIZE = 25 * 1024 * 1024;
const MIN_DURATION = 5;
const MAX_DURATION = 300;

const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'Forbidden' });

    jwt.verify(token, process.env.JWT_SECRET, (err) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        next();
    });
};

const getVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        exec(`"${ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                return reject(`Error retrieving video duration: ${stderr}`);
            }
            resolve(parseFloat(stdout));
        });
    });
};

const uploadVideo = async (req, res) => {
    const { title } = req.body;
    const { file } = req;

    if (file.size > MAX_SIZE) {
        return res.status(400).json({ message: 'File too large. Max size is 25 MB.' });
    }

    const absoluteFilePath = path.resolve(file.path);
    if (!fs.existsSync(absoluteFilePath)) {
        return res.status(400).json({ message: 'Uploaded file does not exist.' });
    }

    try {
        console.log('Video file path:', absoluteFilePath);
        const duration = await getVideoDuration(absoluteFilePath);

        if (duration < MIN_DURATION || duration > MAX_DURATION) {
            return res.status(400).json({ message: `Duration must be between ${MIN_DURATION} and ${MAX_DURATION} seconds.` });
        }

        const newVideo = await Video.create({
            title,
            size: file.size,
            duration,
            filePath: file.path,
        });

        res.status(201).json(newVideo);
    } catch (error) {
        res.status(500).json({ message: 'Error processing video', error });
    }
};

module.exports = {
    authenticate,
    uploadVideo,
};
