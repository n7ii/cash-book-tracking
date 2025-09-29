// in routes/loansRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
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



// --- EMPLOYEE: GET A LIST OF LOANS THEY CREATED (with Search, Pagination & Date Filter) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. Get user ID and all optional parameters
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const { startDate, endDate } = req.query;

    // 2. Dynamically build the WHERE clause
    let whereClause = `WHERE l.created_by = ?`;
    let queryValues = [userId];

    // Add search condition (by customer name)
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (m.Fname LIKE ? OR m.Lname LIKE ?)`;
      queryValues.push(searchPattern, searchPattern);
    }

    // Add date filter condition
    if (startDate && endDate) {
      whereClause += ` AND DATE(l.start_date) BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }
    
    // 3. Get the total count of the filtered records
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalLoans = countResult[0].total;

    // 4. Get the paginated and filtered data
    const dataSql = `
      SELECT 
        l.LID, l.total, l.start_date, l.status,
        m.Fname AS customer_fname, m.Lname AS customer_lname
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      ${whereClause} 
      ORDER BY l.start_date DESC 
      LIMIT ? OFFSET ?;
    `;
    
    const [loans] = await db.query(dataSql, [...queryValues, limit, offset]);
    
    res.status(200).json({
      total: totalLoans,
      page,
      limit,
      data: loans
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).send('Server error');
  }
});


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



// --- GET A SINGLE LOAN BY ID ---
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const loanId = req.params.id;
    const { userId, roleId } = req.user;

    let sql = `SELECT l.*, m.Fname as customer_fname, m.Lname as customer_lname 
               FROM tbloans AS l 
               JOIN tbmember AS m ON l.member_id = m.MID 
               WHERE l.LID = ?`;
    const values = [loanId];

    // If user is not an admin, they can only see loans they created
    if (roleId !== 1) {
      sql += ` AND l.created_by = ?`;
      values.push(userId);
    }

    const [loans] = await db.query(sql, values);

    if (loans.length === 0) {
      return res.status(404).send('Loan not found or you do not have permission.');
    }

    res.status(200).json(loans[0]);
  } catch (error) {
    console.error('Error fetching single loan:', error);
    res.status(500).send('Server error');
  }
});



// --- UPDATE A LOAN ---
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const loanId = req.params.id;
    const { userId, roleId } = req.user;
    const { total, end_date, status, edit_reason } = req.body;

    if (!edit_reason) {
      return res.status(400).send('An edit reason is required.');
    }

    // Security check: Ensure user has permission to edit
    if (roleId !== 1) { // If not an admin, check if they created the loan
      const [loans] = await db.query('SELECT created_by FROM tbloans WHERE LID = ?', [loanId]);
      if (loans.length === 0) {
        return res.status(404).send('Loan not found.');
      }
      if (loans[0].created_by !== userId) {
        return res.status(403).send('Forbidden: You can only edit loans you created.');
      }
    }

    const sql = `UPDATE tbloans SET total = ?, end_date = ?, status = ? WHERE LID = ?`;
    const [result] = await db.query(sql, [total, end_date, status, loanId]);

    if (result.affectedRows === 0) {
      return res.status(404).send('Loan not found.');
    }

    try {
      const logDetails = JSON.stringify({ reason: edit_reason, new_status: status });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_LOAN', 'tbloans', loanId, logDetails, req.ip]);
    } catch (logError) {
      console.error('Failed to log loan update:', logError);
    }

    res.status(200).send('Loan updated successfully.');
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(500).send('Server error');
  }
});



// --- DELETE A LOAN (ADMIN ONLY) ---
router.post('/:id/delete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const loanId = req.params.id;
    const adminUserId = req.user.userId;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).send('A reason for deletion is required.');
    }
    
    const [loans] = await db.query(`SELECT * FROM tbloans WHERE LID = ?`, [loanId]);
    if (loans.length === 0) {
      return res.status(404).send('Loan not found.');
    }
    const loanToDelete = loans[0];

    await db.query(`DELETE FROM tbloans WHERE LID = ?`, [loanId]);
      
    try {
      const logDetails = JSON.stringify({ reason: reason, deleted_record: loanToDelete });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [adminUserId, 'ADMIN_DELETE_LOAN', 'tbloans', loanId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log loan deletion:', logError); }

    res.status(200).send('Loan permanently deleted by admin.');
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).send('Server error');
  }
});



module.exports = router;