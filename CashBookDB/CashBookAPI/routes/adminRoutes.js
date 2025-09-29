// in routes/adminRoutes.js
const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();



// --- ADMIN-ONLY: GET A LIST OF ALL USERS (with Pagination & Search) ---
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // 1. Get parameters from the URL query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // 2. Build the WHERE clause and values for searching
    let whereClause = '';
    let queryValues = [];
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause = `
        WHERE 
          Fname LIKE ? OR 
          Lname LIKE ? OR
          username LIKE ? OR
          phone LIKE ? 
      `;
      queryValues = [searchPattern, searchPattern, searchPattern, searchPattern];
    }

    // 3. Query for the total count of the filtered records
    const countSql = `SELECT COUNT(*) AS total FROM tbuser ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalUsers = countResult[0].total;

    // 4. Query for the paginated and filtered data
    const dataSql = `
      SELECT UID, Fname, Lname, username, role_id, is_active 
      FROM tbuser 
      ${whereClause}
      ORDER BY Fname ASC
      LIMIT ?
      OFFSET ?;
    `;
    
    const [users] = await db.query(dataSql, [...queryValues, limit, offset]);

    // 5. Send the final response
    res.status(200).json({
      total: totalUsers,
      page: page,
      limit: limit,
      data: users
    });

  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: UPDATE A USER'S ACTIVE STATUS ---
router.put('/users/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userIdToUpdate = req.params.id;
      const { is_active } = req.body; // Expecting { "is_active": 0 } or { "is_active": 1 }
      
      // 1. Validate the incoming data
      if (is_active === undefined || (is_active !== 0 && is_active !== 1)) {
        return res.status(400).send('Invalid status. Please provide is_active as 0 (inactive) or 1 (active).');
      }
  
      // 2. Prepare and execute the SQL query
      const sql = `UPDATE tbuser SET is_active = ? WHERE UID = ?`;
      const [result] = await db.query(sql, [is_active, userIdToUpdate]);
  
      // 3. Check if a user was actually updated (if not, the UID didn't exist)
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found.');
      }
  
      // 4. Log the action
      try {
        const adminUserId = req.user.userId; // The ID of the admin performing the action
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ updated_user_id: userIdToUpdate, new_status: is_active });
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_UPDATE_USER_STATUS', 'tbuser', userIdToUpdate, logDetails, ip]);
      } catch (logError) {
        console.error('Failed to log user status update:', logError);
      }
  
      res.status(200).send('User status updated successfully.');
  
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).send('Server error');
    }
  });



// in routes/adminRoutes.js

// --- ADMIN-ONLY: ADD FUNDS (CAPITAL INJECTION) ---
router.post('/funds', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { total, notes, member_id = null, market_id = null } = req.body;
    const adminUserId = req.user.userId;

    // 1. Validate input
    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).send('Total must be a positive number.');
    }

    // 2. Insert the income record
    const sql = `INSERT INTO tbincome (member_id, user_id, total, notes, market_id) VALUES (?, ?, ?, ?, ?)`;
    const values = [member_id, adminUserId, total, notes, market_id];

    const [result] = await db.query(sql, values);
    const newIncomeId = result.insertId;

    // 3. Log the action
    try {
      const logDetails = JSON.stringify({ total: total, notes: notes, type: 'FUNDING' });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [adminUserId, 'ADMIN_ADD_FUNDS', 'tbincome', newIncomeId, logDetails, req.ip]);
    } catch (logError) {
      console.error('Failed to log fund addition:', logError);
    }

    res.status(201).send('Funds added successfully.');

  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL COLLECTIONS (with Pagination, Search & Date Filter) ---
router.get('/collections', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    // Get date filters
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1'; 
    let queryValues = [];
    
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (u.Fname LIKE ? OR u.Lname LIKE ? OR m.Fname LIKE ? OR m.Lname LIKE ? OR i.notes LIKE ?)`;
      queryValues.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    // Add date filter condition
    if (startDate && endDate) {
      whereClause += ` AND DATE(i.created_at) BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbincome i 
      JOIN tbuser u ON i.user_id = u.UID 
      JOIN tbmember m ON i.member_id = m.MID 
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalCollections = countResult[0].total;

    const dataSql = `
      SELECT i.IID, i.total, i.notes, i.created_at, u.Fname AS employee_fname, m.Fname AS customer_fname
      FROM tbincome i
      JOIN tbuser u ON i.user_id = u.UID 
      JOIN tbmember m ON i.member_id = m.MID 
      ${whereClause} 
      ORDER BY i.created_at DESC 
      LIMIT ? OFFSET ?;
    `;
    
    const [collections] = await db.query(dataSql, [...queryValues, limit, offset]);
    
    res.status(200).json({
      total: totalCollections,
      page,
      limit,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching all collections:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL EXPENSES (with Pagination, Search & Date Filter) ---
router.get('/expenses', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    // Get date filters
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    let queryValues = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (e.expense_type LIKE ? OR u.Fname LIKE ? OR u.Lname LIKE ?)`;
      queryValues.push(searchPattern, searchPattern, searchPattern);
    }

    // Add date filter condition
    if (startDate && endDate) {
      whereClause += ` AND DATE(e.created_at) BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }

    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbexpenses AS e
      JOIN tbuser AS u ON e.user_id = u.UID
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalExpenses = countResult[0].total;

    const dataSql = `
      SELECT e.EID, e.amount, e.expense_type, e.created_at, u.Fname AS employee_fname
      FROM tbexpenses AS e
      JOIN tbuser AS u ON e.user_id = u.UID 
      ${whereClause} 
      ORDER BY e.created_at DESC 
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
    console.error('Error fetching all expenses:', error);
    res.status(500).send('Server error');
  }
});



  // --- ADMIN-ONLY: RESET A USER'S PASSWORD ---
router.put('/users/:id/password', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userIdToUpdate = req.params.id;
      const { newPassword } = req.body; // Expecting { "newPassword": "..." }
      
      // 1. Validate the incoming data (e.g., enforce a minimum length)
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).send('A new password with at least 6 characters is required.');
      }
  
      // 2. Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // 3. Prepare and execute the SQL query to update the password
      const sql = `UPDATE tbuser SET password = ? WHERE UID = ?`;
      const [result] = await db.query(sql, [hashedPassword, userIdToUpdate]);
  
      // 4. Check if a user was actually updated
      if (result.affectedRows === 0) {
        return res.status(404).send('User not found.');
      }
  
      // 5. Log the action
      try {
        const adminUserId = req.user.userId;
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, ip_address) VALUES (?, ?, ?, ?, ?)`;
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_RESET_PASSWORD', 'tbuser', userIdToUpdate, ip]);
      } catch (logError) {
        console.error('Failed to log password reset:', logError);
      }
  
      res.status(200).send('User password updated successfully.');
  
    } catch (error) {
      console.error('Error updating user password:', error);
      res.status(500).send('Server error');
    }
  });



// --- ADMIN-ONLY: GET A SINGLE COLLECTION BY ID ---
router.get('/collections/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const collectionId = req.params.id;
  
      // No user_id check needed, as an admin can view any record
      const sql = `SELECT * FROM tbincome WHERE IID = ?`;
      const [collections] = await db.query(sql, [collectionId]);
      
      if (collections.length === 0) {
        return res.status(404).send('Collection not found.');
      }
      
      res.status(200).json(collections[0]);
    } catch (error) {
      console.error('Error fetching single collection by admin:', error);
      res.status(500).send('Server error');
    }
  });



  // --- ADMIN-ONLY: UPDATE ANY COLLECTION ---
router.put('/collections/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const collectionId = req.params.id;
      const { total, notes, edit_reason } = req.body;
      const adminUserId = req.user.userId;
  
      if (!edit_reason) {
        return res.status(400).send('An edit reason is required.');
      }
  
      // NOTICE: The ownership check is GONE. An admin can edit anyone's record.
  
      const sql = `UPDATE tbincome SET total = ?, notes = ? WHERE IID = ?`;
      const [result] = await db.query(sql, [total, notes, collectionId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).send('Collection not found.');
      }
  
      // Log the action
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ updated_total: total, reason: edit_reason });
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_UPDATE_INCOME', 'tbincome', collectionId, logDetails, ip]);
      } catch (logError) {
        console.error('Failed to log admin income update:', logError);
      }
  
      res.status(200).send('Collection updated successfully by admin.');
    } catch (error) {
      console.error('Error updating collection by admin:', error);
      res.status(500).send('Server error');
    }
  });



// --- ADMIN-ONLY: DELETE ANY COLLECTION ---
router.post('/collections/:id/delete', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const collectionId = req.params.id;
      const adminUserId = req.user.userId;
      const { reason } = req.body;
  
      if (!reason) {
        return res.status(400).send('A reason for deletion is required.');
      }
  
      const [collections] = await db.query(`SELECT * FROM tbincome WHERE IID = ?`, [collectionId]);
      if (collections.length === 0) {
        return res.status(404).send('Collection not found.');
      }
      const collectionToDelete = collections[0];
  
      await db.query(`DELETE FROM tbincome WHERE IID = ?`, [collectionId]);
      
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ reason: reason, deleted_record: collectionToDelete });
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_DELETE_INCOME', 'tbincome', collectionId, logDetails, ip]);
      } catch (logError) { console.error('Failed to log admin income deletion:', logError); }
  
      res.status(200).send('Collection permanently deleted by admin.');
    } catch (error) {
      console.error('Error deleting collection by admin:', error);
      res.status(500).send('Server error');
    }
  });


  
  // --- ADMIN-ONLY: GET A SINGLE EXPENSE ---
  router.get('/expenses/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const expenseId = req.params.id;
      const sql = `SELECT * FROM tbexpenses WHERE EID = ?`;
      const [expenses] = await db.query(sql, [expenseId]);
  
      if (expenses.length === 0) {
        return res.status(404).send('Expense not found.');
      }
      res.status(200).json(expenses[0]);
    } catch (error) {
      console.error('Error fetching single expense:', error);
      res.status(500).send('Server error');
    }
  });


  
  // --- ADMIN-ONLY: UPDATE ANY EXPENSE ---
  router.put('/expenses/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const expenseId = req.params.id;
      const { amount, notes, edit_reason } = req.body;
      const adminUserId = req.user.userId;
  
      if (!edit_reason) {
        return res.status(400).send('An edit reason is required.');
      }
  
      const sql = `UPDATE tbexpenses SET amount = ?, notes = ? WHERE EID = ?`;
      const [result] = await db.query(sql, [amount, notes, expenseId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).send('Expense not found.');
      }
  
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ updated_amount: amount, reason: edit_reason });
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_UPDATE_EXPENSE', 'tbexpenses', expenseId, logDetails, ip]);
      } catch (logError) { console.error('Failed to log admin expense update:', logError); }
  
      res.status(200).send('Expense updated successfully by admin.');
    } catch (error) {
      console.error('Error updating expense by admin:', error);
      res.status(500).send('Server error');
    }
  });
  


  // --- ADMIN-ONLY: DELETE ANY EXPENSE ---
  router.post('/expenses/:id/delete', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const expenseId = req.params.id;
      const adminUserId = req.user.userId;
      const { reason } = req.body;
  
      if (!reason) {
        return res.status(400).send('A reason for deletion is required.');
      }
  
      const [expenses] = await db.query(`SELECT * FROM tbexpenses WHERE EID = ?`, [expenseId]);
      if (expenses.length === 0) {
        return res.status(404).send('Expense not found.');
      }
      const expenseToDelete = expenses[0];
  
      await db.query(`DELETE FROM tbexpenses WHERE EID = ?`, [expenseId]);
      
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ reason: reason, deleted_record: expenseToDelete });
        const ip = req.ip;
        await db.query(logSql, [adminUserId, 'ADMIN_DELETE_EXPENSE', 'tbexpenses', expenseId, logDetails, ip]);
      } catch (logError) { console.error('Failed to log admin expense deletion:', logError); }
  
      res.status(200).send('Expense permanently deleted by admin.');
    } catch (error) {
      console.error('Error deleting expense by admin:', error);
      res.status(500).send('Server error');
    }
  });



// --- ADMIN-ONLY: GET A LIST OF ALL LOANS (with Pagination, Search & Date Filter) ---
router.get('/loans', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // 1. Get parameters from the URL query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    // Get date filters
    const { startDate, endDate } = req.query;

    // 2. Dynamically build the WHERE clause
    let whereClause = 'WHERE 1=1';
    let queryValues = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (m.Fname LIKE ? OR m.Lname LIKE ? OR u.Fname LIKE ? OR u.Lname LIKE ?)`;
      queryValues.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Add date filter condition on the loan's start_date
    if (startDate && endDate) {
      whereClause += ` AND DATE(l.start_date) BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }

    // 3. Query for the total count of the filtered records
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      JOIN tbuser AS u ON l.created_by = u.UID
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalLoans = countResult[0].total;

    // 4. Query for the paginated and filtered data
    const dataSql = `
      SELECT 
        l.LID, l.total, l.start_date, l.status,
        m.Fname AS customer_fname,
        u.Fname AS created_by_fname
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      JOIN tbuser AS u ON l.created_by = u.UID
      ${whereClause}
      ORDER BY l.start_date DESC
      LIMIT ?
      OFFSET ?;
    `;
    
    const [loans] = await db.query(dataSql, [...queryValues, limit, offset]);

    // 5. Send the final response
    res.status(200).json({
      total: totalLoans,
      page,
      limit,
      data: loans
    });

  } catch (error) {
    console.error('Error fetching all loans:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: CREATE A NEW CUSTOMER ---
router.post('/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { Fname, Lname, market_id, role_id, is_active } = req.body;
    const adminUserId = req.user.userId;

    if (!Fname || !Lname || !market_id || !role_id) {
      return res.status(400).send('All fields are required.');
    }

    const sql = `INSERT INTO tbmember (Fname, Lname, market_id, role_id, is_active) VALUES (?, ?, ?, ?, ?)`;
    const values = [Fname, Lname, market_id, role_id, is_active];
    const [result] = await db.query(sql, values);
    const newCustomerId = result.insertId;

    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      const logDetails = JSON.stringify({ customer_name: `${Fname} ${Lname}` });
      await db.query(logSql, [adminUserId, 'ADMIN_CREATE_CUSTOMER', 'tbmember', newCustomerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer creation:', logError); }

    res.status(201).send('Customer created successfully.');
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL CUSTOMERS ---
router.get('/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sql = `SELECT m.MID, m.Fname, m.Lname, m.is_active, mk.Mname AS market_name 
                 FROM tbmember AS m 
                 JOIN tbmarkets AS mk ON m.market_id = mk.MkID
                 WHERE m.role_id = 2 ORDER BY m.Fname ASC`; // Assuming role_id 2 is for customers
    const [customers] = await db.query(sql);
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error fetching all customers:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: GET A SINGLE CUSTOMER ---
router.get('/customers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const sql = `SELECT * FROM tbmember WHERE MID = ?`;
    const [customers] = await db.query(sql, [customerId]);
    if (customers.length === 0) {
      return res.status(404).send('Customer not found.');
    }
    res.status(200).json(customers[0]);
  } catch (error) {
    console.error('Error fetching single customer:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: UPDATE A CUSTOMER ---
router.put('/customers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { Fname, Lname, market_id, is_active, edit_reason } = req.body;
    const adminUserId = req.user.userId;

    if (!edit_reason) {
      return res.status(400).send('An edit reason is required.');
    }

    const sql = `UPDATE tbmember SET Fname = ?, Lname = ?, market_id = ?, is_active = ? WHERE MID = ?`;
    const [result] = await db.query(sql, [Fname, Lname, market_id, is_active, customerId]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Customer not found.');
    }

    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      const logDetails = JSON.stringify({ reason: edit_reason });
      await db.query(logSql, [adminUserId, 'ADMIN_UPDATE_CUSTOMER', 'tbmember', customerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer update:', logError); }

    res.status(200).send('Customer updated successfully by admin.');
  } catch (error) {
    console.error('Error updating customer by admin:', error);
    res.status(500).send('Server error');
  }
});



// --- ADMIN-ONLY: DELETE A CUSTOMER ---
router.post('/customers/:id/delete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const adminUserId = req.user.userId;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).send('A reason for deletion is required.');
    }

    const [customers] = await db.query(`SELECT * FROM tbmember WHERE MID = ?`, [customerId]);
    if (customers.length === 0) {
      return res.status(404).send('Customer not found.');
    }
    const customerToDelete = customers[0];

    await db.query(`DELETE FROM tbmember WHERE MID = ?`, [customerId]);
    
    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      const logDetails = JSON.stringify({ reason: reason, deleted_record: customerToDelete });
      await db.query(logSql, [adminUserId, 'ADMIN_DELETE_CUSTOMER', 'tbmember', customerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log admin customer deletion:', logError); }

    res.status(200).send('Customer permanently deleted by admin.');
  } catch (error) {
    console.error('Error deleting customer by admin:', error);
    res.status(500).send('Server error');
  }
});

  

module.exports = router;