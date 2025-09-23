// in routes/loansRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// --- EMPLOYEE: CREATE A NEW LOAN (PROTECTED) ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { member_id, total, end_date, status } = req.body;
    
    const created_by_user_id = req.user.userId;
    
    if (typeof total !== 'number' || typeof status !== 'number') {
      return res.status(400).send('Total and status must be numbers.');
    }
    if (!member_id || !total || status === undefined) {
      return res.status(400).send('Member, total, and status are required.');
    }

    const sql = `INSERT INTO tbloans (member_id, total, end_date, status, created_by) VALUES (?, ?, ?, ?, ?)`;
    const values = [member_id, total, end_date, status, created_by_user_id];

    const [result] = await db.query(sql, values);
    const newLoanId = result.insertId;

    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      const logDetails = JSON.stringify({ member_id: member_id, total: total });
      const ip = req.ip;
      await db.query(logSql, [created_by_user_id, 'CREATE_LOAN', 'tbloans', newLoanId, logDetails, ip]);
    } catch (logError) {
      console.error('Failed to log loan creation:', logError);
    }

    res.status(201).send('Loan created successfully.');

  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;