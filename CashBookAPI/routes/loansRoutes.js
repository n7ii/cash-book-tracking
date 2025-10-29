const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');



// --- GET ALL LOANS FOR LOGGED-IN EMPLOYEE ---
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const { startDate, endDate } = req.query;

    let whereClause = `WHERE l.created_by = ?`;
    let queryValues = [userId];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (m.Fname LIKE ? OR m.Lname LIKE ?)`;
      queryValues.push(searchPattern, searchPattern);
    }

    if (startDate && endDate) {
      whereClause += ` AND ${getLaosDateFilterSql('l.start_date')} BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }
    
    const countSql = `SELECT COUNT(*) AS total FROM tbloans AS l JOIN tbmember AS m ON l.member_id = m.MID ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalLoans = countResult[0].total;

    // Now includes the 'notes' field in the response
    const dataSql = `
      SELECT
        l.LID, l.total,
        DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS start_date,
        l.status, l.notes, l.paid_total,
        m.Fname AS customer_fname, m.Lname AS customer_lname,
        mk.Mname AS market_name
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      JOIN tbmarkets AS mk ON m.market_id = mk.MkID
      ${whereClause}
      ORDER BY l.start_date DESC
      LIMIT ? OFFSET ?;`;
    
    const [loans] = await db.query(dataSql, [...queryValues, limit, offset]);
    
    res.status(200).json({ total: totalLoans, page, limit, data: loans });
  } catch (error) {
    next(error);
  }
});



// --- GET A SINGLE LOAN BY ID (ENHANCED FOR DETAIL VIEW) ---
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const loanId = req.params.id;
    const { userId, roleId } = req.user;

    let sql = `
        SELECT
            l.LID, l.member_id, l.total, l.paid_total, l.status, l.notes, l.created_by,
            DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS start_date,
            CASE
                WHEN l.end_date IS NOT NULL THEN DATE_FORMAT(CONVERT_TZ(l.end_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ')
                ELSE NULL
            END AS end_date,
            m.Fname as customer_fname, m.Lname as customer_lname,
            mk.Mname as market_name,
            u.Fname as created_by_fname, u.Lname as created_by_lname
        FROM tbloans AS l
        JOIN tbmember AS m ON l.member_id = m.MID
        JOIN tbmarkets AS mk ON m.market_id = mk.MkID
        JOIN tbuser AS u ON l.created_by = u.UID
        WHERE l.LID = ?`;
    const values = [loanId];

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
    next(error);
  }
});



// --- CREATE A NEW LOAN (CORRECTED) ---
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { member_id, total, end_date, status, notes = null } = req.body;
    const created_by_user_id = req.user.userId;
    
    // Basic validation
    if (!member_id || total === undefined || status === undefined) {
      return res.status(400).send('Member, total, and status are required.');
    }

    // --- NEW VALIDATION: Check for existing active loans for this customer ---
    const checkActiveLoanSql = 'SELECT LID FROM tbloans WHERE member_id = ? AND status = 1';
    const [activeLoans] = await db.query(checkActiveLoanSql, [member_id]);

    if (activeLoans.length > 0) {
        // Use 409 Conflict status code, as the request conflicts with a server rule
        return res.status(409).send('Conflict: This customer already has an active loan.');
    }
    // --- END of new validation ---

    // If the check passes, proceed with creating the new loan
    const sql = `INSERT INTO tbloans (member_id, total, end_date, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [member_id, total, end_date, status, notes, created_by_user_id];

    const [result] = await db.query(sql, values);
    const newLoanId = result.insertId;

    try {
      const logDetails = JSON.stringify({ member_id: member_id, total: total });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [created_by_user_id, 'CREATE_LOAN', 'tbloans', newLoanId, logDetails, req.ip]);
    } catch (logError) {
      console.error('Failed to log loan creation:', logError);
    }

    res.status(201).send('Loan created successfully.');
  } catch (error) {
    next(error);
  }
});



// --- UPDATE A LOAN (CORRECTED) ---
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const loanId = req.params.id;
    const { userId, roleId } = req.user;
    const { total, end_date, status, notes, edit_reason } = req.body;

    if (!edit_reason) {
      return res.status(400).send('An edit reason is required.');
    }

    if (roleId !== 1) {
      const [loans] = await db.query('SELECT created_by FROM tbloans WHERE LID = ?', [loanId]);
      if (loans.length === 0) return res.status(404).send('Loan not found.');
      if (loans[0].created_by !== userId) return res.status(403).send('Forbidden: You can only edit loans you created.');
    }

    const sql = `UPDATE tbloans SET total = ?, end_date = ?, status = ?, notes = ? WHERE LID = ?`;
    const [result] = await db.query(sql, [total, end_date, status, notes, loanId]);

    if (result.affectedRows === 0) return res.status(404).send('Loan not found.');

    try {
      const logDetails = JSON.stringify({ reason: edit_reason, new_status: status, has_notes: !!notes });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_LOAN', 'tbloans', loanId, logDetails, req.ip]);
    } catch (logError) {
      console.error('Failed to log loan update:', logError);
    }

    res.status(200).send('Loan updated successfully.');
  } catch (error) {
    next(error);
  }
});
  


// --- DELETE A LOAN (ADMIN ONLY) ---
router.post('/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const loanId = req.params.id;
    const adminUserId = req.user.userId;
    const { reason } = req.body;

    if (!reason) return res.status(400).send('A reason for deletion is required.');
    
    const [loans] = await db.query(`SELECT * FROM tbloans WHERE LID = ?`, [loanId]);
    if (loans.length === 0) return res.status(404).send('Loan not found.');
    const loanToDelete = loans[0];

    await db.query(`DELETE FROM tbloans WHERE LID = ?`, [loanId]);
      
    try {
      const logDetails = JSON.stringify({ reason: reason, deleted_record: loanToDelete });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [adminUserId, 'ADMIN_DELETE_LOAN', 'tbloans', loanId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log loan deletion:', logError); }

    res.status(200).send('Loan permanently deleted by admin.');
  } catch (error) {
    next(error);
  }
});



// --- NEW: GET A LIST OF OVERDUE LOANS ---
router.get('/overdue', authMiddleware, async (req, res, next) => {
  try {
      const { userId, roleId } = req.user;
      let sql, values;

      const overdueCondition = 'l.end_date < CURDATE() AND l.status = 1';

      // Admins see all overdue loans
      if (roleId === 1) {
        sql = `
        SELECT l.LID,
               DATE_FORMAT(CONVERT_TZ(l.end_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS end_date,
               m.Fname, m.Lname
        FROM tbloans l
        JOIN tbmember m ON l.member_id = m.MID
        WHERE ${overdueCondition}
        ORDER BY l.end_date ASC;
    `;
          values = [];
      } else {
          // Employees only see overdue loans they created
          sql = `
                SELECT l.LID,
                       DATE_FORMAT(CONVERT_TZ(l.end_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS end_date,
                       m.Fname, m.Lname
                FROM tbloans l
                JOIN tbmember m ON l.member_id = m.MID
                WHERE ${overdueCondition} AND l.created_by = ?
                ORDER BY l.end_date ASC;
            `;
          values = [userId];
      }

      const [overdueLoans] = await db.query(sql, values);
      res.status(200).json(overdueLoans);

  } catch (error) {
    next(error);
  }
});



module.exports = router;