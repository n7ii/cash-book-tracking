const express = require('express');
const db = require('../db')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
      // Destructure all relevant fields from the request body
      const { expense_type, amount, photo_url = null, notes, category, payment_method, market_id } = req.body;
      const userId = req.user.userId;

      // Validation
      if (typeof amount !== 'number') {
          return res.status(400).send('Amount must be a number.');
      }
      if (!expense_type || !amount) {
          return res.status(400).send('Expense type and amount are required.');
      }

      // The SQL INSERT statement including the new columns
      const sql = 'INSERT INTO tbexpenses (user_id, expense_type, amount, photo_url, notes, category, payment_method, market_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      
      // The values array that matches the placeholders in the SQL
      const values = [userId, expense_type, amount, photo_url, notes, category, payment_method, market_id];

      const [result] = await db.query(sql, values);
      const newExpenseId = result.insertId;

      // Logging logic (remains the same)
      try {
          const logSql = 'INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)';
          const logDetails = JSON.stringify({ total: amount, has_photo: !!photo_url });
          const ip = req.ip;
          await db.query(logSql, [userId, 'CREATE_EXPENSE', 'tbexpenses', newExpenseId, logDetails, ip]);
      } catch (logError) {
          console.error('Failed to log expenses creation:', logError);
      }

      res.status(201).send('Expense created successfully.');
  } catch (err) {
    next(error);
  };
});



// --- READ: GET ALL EXPENSES FOR THE LOGGED-IN USER (with Pagination, Search & Date Filter) ---
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    // Get startDate and endDate from the query
    const { startDate, endDate } = req.query;

    let whereClause = `WHERE user_id = ?`;
    let queryValues = [userId];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (expense_type LIKE ? OR Notes LIKE ?)`;
      queryValues.push(searchPattern, searchPattern);
    }
    
    if (startDate && endDate) {
      whereClause += ` AND ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }
    
    const countSql = `SELECT COUNT(*) AS total FROM tbexpenses ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalExpenses = countResult[0].total;

    const dataSql = `
      SELECT 
        EID, user_id, expense_type, amount, photo_url, notes, category, payment_method, market_id,
        DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at 
      FROM tbexpenses AS e 
      ${whereClause} 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?;
    `;
    
    const [expenses] = await db.query(dataSql, [...queryValues, limit, offset]);
    
    res.status(200).json({
      total: totalExpenses,
      page,
      limit,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
});


// --- READ: GET A SINGLE EXPENSE BY ID (PROTECTED & UPDATED FOR ADMIN) ---
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const { userId, roleId } = req.user;

    // UPDATED QUERY with JOINs to get market and employee names
    let sql = `
      SELECT 
        e.EID, e.user_id, e.expense_type, e.amount, e.photo_url, e.notes, e.category, e.payment_method, e.market_id,
        DATE_FORMAT(CONVERT_TZ(e.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at, 
        mk.Mname as market_name,
        u.Fname as employee_fname,
        u.Lname as employee_lname
      FROM tbexpenses AS e
      LEFT JOIN tbmarkets AS mk ON e.market_id = mk.MkID
      JOIN tbuser AS u ON e.user_id = u.UID
      WHERE e.EID = ?
    `;
    const values = [expenseId];

    if (roleId !== 1) {
      sql += ` AND e.user_id = ?`;
      values.push(userId);
    }
    
    const [expenses] = await db.query(sql, values);

    if (expenses.length === 0) {
      return res.status(404).send('Expense not found or you do not have permission.');
    }
    
    res.status(200).json(expenses[0]);
  } catch (error) {
    next(error);
  }
});



router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
      const expenseId = req.params.id;
      // Destructure all updatable fields from the body
      const { amount, notes, edit_reason, expense_type, category, payment_method, market_id } = req.body;
      const userId = req.user.userId;

      // Ownership check logic (remains the same)
      const [ownerCheck] = await db.query(`SELECT user_id FROM tbexpenses WHERE EID = ?`, [expenseId]);
      if (amount !== undefined && typeof amount !== 'number') {
          return res.status(400).send('If provided, amount must be a number.');
      }
      if (ownerCheck.length === 0) {
          return res.status(404).send('Expense not found.');
      }
      if (!edit_reason) {
          return res.status(400).send('An edit reason is required to make an update.');
      }
      if (ownerCheck[0].user_id !== userId) {
          return res.status(403).send('Forbidden: You can only edit your own expenses.');
      }
    
      // The SQL UPDATE statement with all new and existing fields
      const sql = `UPDATE tbexpenses SET amount = ?, notes = ?, expense_type = ?, category = ?, payment_method = ?, market_id = ? WHERE EID = ?`;
      
      // The values array for the update query
      await db.query(sql, [amount, notes, expense_type, category, payment_method, market_id, expenseId]);

      // Logging logic (remains the same)
      try {
          const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
          const logDetails = JSON.stringify({ updated_total: amount, reason: edit_reason });
          const ip = req.ip;
          await db.query(logSql, [userId, 'UPDATE_EXPENSE', 'tbexpenses', expenseId, logDetails, ip]);
      } catch (logError) {
          console.error('Failed to log expense update:', logError);
      }

      res.status(200).send('Expense updated successfully.');
  } catch (error) {
    next(error);
  }
});

  

  router.post('/:id/delete', authMiddleware, async (req, res, next) => {
    try {
      const expenseId = req.params.id;
      const userId = req.user.userId;
      const { reason } = req.body;
  
      if (!reason) {
        return res.status(400).send('A reason for deletion is required.');
      }
  
      const [expenses] = await db.query(`SELECT * FROM tbexpenses WHERE EID = ? AND user_id = ?`, [expenseId, userId]);
  
      if (expenses.length === 0) {
        return res.status(404).send('Expenses not found or you do not have permission.');
      }
      const expenseToDelete = expenses[0];
  
      await db.query(`DELETE FROM tbexpenses WHERE EID = ?`, [expenseId]);
      
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        
        const logDetails = JSON.stringify({
          reason: reason,
          deleted_record: expenseToDelete
        });
        const ip = req.ip;
        await db.query(logSql, [userId, 'DELETE_EXPENSE', 'tbexpenses', expenseId, logDetails, ip]);
      } catch (logError) {
        console.error('Failed to log expense deletion:', logError);
      }
  
      res.status(200).send('Expense permanently deleted successfully.');
  
    } catch (error) {
      next(error);
    }
  });  



module.exports = router;