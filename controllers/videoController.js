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

const trimVideo = async (req, res) => {
    console.log("Request Body:", req.body);
    const { id, trimStart, trimEnd } = req.body;

    if (!id || (trimStart === undefined && trimEnd === undefined)) {
        return res.status(400).json({ message: 'Invalid id, trimStart, or trimEnd.' });
    }

    try {
        const video = await Video.findByPk(id);
        console.log("Fetched video:", video);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        const duration = await getVideoDuration(video.filePath);
        let start = 0;
        let end = duration;

        if (trimStart !== undefined) {
            if (trimStart < 0 || trimStart > duration) {
                return res.status(400).json({ message: 'Invalid trimStart time.' });
            }
            start = trimStart;
        }

        if (trimEnd !== undefined) {
            if (trimEnd < start || trimEnd > duration) {
                return res.status(400).json({ message: 'Invalid trimEnd time.' });
            }
            end = trimEnd;
        }

        const outputFilePath = path.join(__dirname, '..', 'uploads', `trimmed_${video.id}_${Date.now()}.mp4`);
        console.log(`Executing FFmpeg command: ${ffmpegPath} -i "${video.filePath}" -ss ${start} -to ${end} -c copy "${outputFilePath}"`);

        exec(`${ffmpegPath} -i "${video.filePath}" -ss ${start} -to ${end} -c copy "${outputFilePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('FFmpeg Error:', stderr);
                return res.status(500).json({ message: 'Error trimming video', error: stderr });
            }
            res.status(200).json({ message: 'Video trimmed successfully', filePath: outputFilePath });
        });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Error trimming video', error });
    }
};


module.exports = {
    authenticate,
    uploadVideo,
    trimVideo
};
