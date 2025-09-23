const jwt = require('jsonwebtoken')
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware")


router.post('/register', async (req, res)=>{
    try{
        const {Fname, Lname, username, password, phone, birth_date, gender, address, role_id, is_active} = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = 'insert into tbuser (Fname, Lname, username, password, phone, birth_date, gender, address, role_id, is_active) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [Fname, Lname, username, hashedPassword, phone, birth_date, gender, address, role_id, is_active];

        const [result] = await db.query(sql, values);
        const newUserId = result.insertId;
        if (typeof role_id !== 'number') {
            return res.status(400).send('Role ID must be numbers.');
          }

        try {
            const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
            const logDetails = JSON.stringify({ username: username, role_id: role_id });
            const ip = req.ip;
            await db.query(logSql, [newUserId, 'USER_REGISTER', 'tbuser', newUserId, logDetails, ip]);
          } catch (logError) {
            console.error('Failed to log user registration:', logError);
          }

        res.status(201).send("User created successfully with hashed password.")

    }catch(error){
        console.error('Server error during registration: ', error);
        res.status(500).send('Server error');
    }
})

router.post('/login', async (req,res) =>{
    try{
        const{username, password} = req.body;

        if(!username || !password){
            return res.status(400).send("Username or password are required.")
        }

        const sql = 'select * from tbuser where username = ?';
        const [results] = await db.query(sql, [username]);
        
            if (results.length === 0){
                return res.status(401).send('Invalid username or password.');
            }

            const user = results[0];
            const passwordIsValid = await bcrypt.compare(password, user.password);

            if (!passwordIsValid){
                return res.status(401).send('Invalid username or password')
            }

            const payload = {userId: user.UID, roleId: user.role_id};
            const secretKey = process.env.JWT_SECRET;
            const token = jwt.sign(payload, secretKey, {expiresIn: '12h'})   //this is where user auto-logout in 12h can't delete it already install jwt

            const userProfile = {
                uid: user.UID,
                fname: user.Fname,
                lname: user.Lname,
                username: user.username,
                roleId: user.role_id
            };

            try {
                const logSql = `INSERT INTO activity_log (user_id, action_type, ip_address) VALUES (?, ?, ?)`;
                const ip = req.ip; // Express gives you the IP address on the request object
                await db.query(logSql, [user.UID, 'USER_LOGIN_SUCCESS', ip]);
              } catch (logError) {
                // If logging fails for some reason, we don't want to stop the user from logging in.
                // We just log the logging error to the console and continue.
                console.error('Failed to log user login:', logError);
              }

            res.status(200).json({
                message: 'Login successful',
                token: token,
                user: userProfile
            })

        }catch (err) {
        console.error('Server error during login:', err);
        res.status(500).send('Server error.');
    }
})

//If want to make the application to still remember the user even re-open the app call this and send back the token from login
//GET /api/users/me
router.get('/me', authMiddleware, async (req, res) =>{
    try{
        const userId = req.user.userId;
        const sql = "Select UID, Fname, Lname, username from tbuser where UID = ?";
        const [results] = await db.query(sql, [userId]);

        if (results.length === 0){
            return res.status(404).send("User not found.");
        }
        res.status(200).json(results[0]);
    }catch (error){
        res.status(500).send('Server error.')
    };
});



module.exports = router;