const express = require('express');
const multer = require('multer');
const videoController = require('../controllers/videoController');
const path = require('path');


const router = express.Router();
router.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: videoController.MAX_SIZE },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/mkv', 'video/avi'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only MP4, MKV, and AVI formats are allowed.'));
        } else {
            cb(null, true);
        }
    },
});

router.post('/upload', upload.single('file'), videoController.uploadVideo);
router.post('/trim', videoController.trimVideo);
router.post('/merge', videoController.mergeVideos);

module.exports = router;
