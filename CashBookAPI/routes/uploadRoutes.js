const express = require('express');
const multer = require('multer');
const path = require('path')
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/')
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

    }
});

const upload = multer({ storage: storage});

router.post('/', authMiddleware, upload.single('image'), (req, res) =>{
    if(!req.file){
        return res.status(400).send('No file was uploaded.');
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(200).json({
        message: 'File uploaded successfully.',
        url: fileUrl
    });
});

module.exports = router;