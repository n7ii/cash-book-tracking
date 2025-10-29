const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require('../middleware/adminMiddleware');

// --- ADMIN-ONLY: REGISTER A NEW USER (SIMPLIFIED) ---
router.post('/register', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        // UPDATED: Destructure the new, simpler user object
        const { Fname, Lname, username, password, phone, Email, address, role_id } = req.body;

        // --- START: DUPLICATE CHECK (Now includes Email) ---
        const checkSql = 'SELECT UID FROM tbuser WHERE username = ? OR phone = ? OR Email = ?';
        const [existingUsers] = await db.query(checkSql, [username, phone, Email]);

        if (existingUsers.length > 0) {
            return res.status(409).send('Conflict: Username, phone number, or email is already in use.');
        }
        // --- END: DUPLICATE CHECK ---

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // UPDATED: SQL query now matches the new table structure
        const sql = 'INSERT INTO tbuser (Fname, Lname, username, password, phone, Email, address, role_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
        // UPDATED: Values array matches the new query. 'is_active' is hardcoded to 1.
        const values = [Fname, Lname, username, hashedPassword, phone, Email, address, role_id, 1];

        const [result] = await db.query(sql, values);
        const newUserId = result.insertId;

        try {
            const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
            const logDetails = JSON.stringify({ username: username, role_id: role_id });
            const ip = req.ip;
            await db.query(logSql, [newUserId, 'USER_REGISTER', 'tbuser', newUserId, logDetails, ip]);
        } catch (logError) {
            console.error('Failed to log user registration:', logError);
        }

        res.status(201).send("User created successfully.");

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('Conflict: A user with those details already exists.');
        }
        next(error);
    }
});

// --- USER LOGIN ---
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send("Username or password are required.");
        }

        const sql = 'SELECT * FROM tbuser WHERE username = ?';
        const [results] = await db.query(sql, [username]);
        
        if (results.length === 0) {
            return res.status(401).send('Invalid username or password.');
        }

        const user = results[0];
        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send('Invalid username or password');
        }

        // Check if user is active
        if (user.is_active !== 1) {
            return res.status(403).send('Forbidden: Your account has been deactivated.');
        }

        const payload = { userId: user.UID, roleId: user.role_id };
        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign(payload, secretKey, { expiresIn: '12h' });

        const userProfile = {
            uid: user.UID,
            fname: user.Fname,
            lname: user.Lname,
            username: user.username,
            roleId: user.role_id
        };

        try {
            const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, ip_address) VALUES (?, ?, ?, ?, ?)`;
            const ip = req.ip;
            await db.query(logSql, [user.UID, 'USER_LOGIN_SUCCESS', 'tbuser', user.UID, ip]);
        } catch (logError) {
            console.error('Failed to log user login:', logError);
        }

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: userProfile
        });

    } catch (err) {
        next(error);
    }
});

// --- GET CURRENT USER PROFILE ---
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const sql = "SELECT UID, Fname, Lname, username, Email FROM tbuser WHERE UID = ?";
        const [results] = await db.query(sql, [userId]);

        if (results.length === 0) {
            return res.status(404).send("User not found.");
        }
        res.status(200).json(results[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;