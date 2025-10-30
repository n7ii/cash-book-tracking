const express = require('express');
const multer = require('multer');
const path = require('path')
const sharp = require('sharp');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.memoryStorage();

// --- ADD THIS FILE FILTER ---
const fileFilter = (req, file, cb) => {
    // Check if the file is an image
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type, only JPEG, PNG, or GIF is allowed!'), false); // Reject the file
    }
};
// -----------------------------

const upload = multer({
    storage: storage,
    // --- ADD THESE TWO PROPERTIES ---
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB file size limit
    },
    fileFilter: fileFilter
    // --------------------------------
});

// --- UPDATE THE ROUTE TO HANDLE MULTER ERRORS ---
router.post('/', authMiddleware, (req, res) => {
    // Use a custom handler to catch errors from multer (like file size)
    upload.single('image')(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred (e.g., file too large)
            if (err.code === 'LIMIT_FILE_SIZE') {
                 return res.status(400).send('File is too large. Maximum size is 5MB.');
            }
            return res.status(400).send(err.message);
        } else if (err) {
            // An unknown error or file type error occurred
            return res.status(400).send(err.message);
        }
        
        // --- This code only runs if upload is successful ---
        if (!req.file) {
            return res.status(400).send('No file was uploaded.');
        }

        // --- START SHARP PROCESSING ---
        try {
            // Generate a unique filename, forcing .webp extension
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const newFilename = `image-${uniqueSuffix}.webp`;
            const outputPath = path.join('public/uploads', newFilename);

            // Process the image:
            await sharp(req.file.buffer) // Get the file from memory
                .resize({ 
                    width: 1200, // Set a max width of 1200px
                    fit: 'inside', // Keep aspect ratio, don't enlarge
                    withoutEnlargement: true 
                })
                .toFormat('webp', { quality: 80 }) // Convert to WEBP with 80% quality
                .toFile(outputPath); // Save the processed file

            // Return the URL of the NEW processed file
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${newFilename}`;

            res.status(200).json({
                message: 'File uploaded and processed successfully.',
                url: fileUrl
            });

        } catch (processingError) {
            console.error('Error processing image:', processingError);
            res.status(500).send('Error processing the image.');
        }
        // --- END SHARP PROCESSING ---
    });
});

module.exports = router;