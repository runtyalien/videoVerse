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
        // const fileExtension = path.extname(file.originalname);
        const originalName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `temp_${originalName}`);
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
router.post('/share', videoController.shareVideo);
router.get('/:id/play', videoController.playVideo);

module.exports = router;
