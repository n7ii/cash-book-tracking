// in routes/adminRoutes.js
const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');



// --- ADMIN-ONLY: GET A LIST OF ALL USERS (UPDATED SEARCH) ---
router.get('/users', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    let whereClause = '';
    let queryValues = [];
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      // UPDATED: Added 'Email' to the list of searchable fields
      whereClause = `
        WHERE 
          Fname LIKE ? OR 
          Lname LIKE ? OR
          username LIKE ? OR
          phone LIKE ? OR
          Email LIKE ? 
      `;
      // UPDATED: Added one more searchPattern for the Email field
      queryValues = [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];
    }

    const countSql = `SELECT COUNT(*) AS total FROM tbuser ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalUsers = countResult[0].total;

    // The data we select doesn't need to change, just what we search by.
    const dataSql = `
    SELECT 
        u.UID, u.Fname, u.Lname, u.username, u.role_id, u.is_active, u.phone, u.Email,
        u.address as address_id,
        CONCAT_WS(', ', v.Vname, d.Dname) as address_name
    FROM 
        tbuser AS u
    LEFT JOIN 
        tbvillages AS v ON u.address = v.VID
    LEFT JOIN 
        tbdistricts AS d ON v.district_id = d.DID
    ${whereClause}
    ORDER BY u.is_active DESC, u.Fname ASC
    LIMIT ? OFFSET ?;
`;
    
    const [users] = await db.query(dataSql, [...queryValues, limit, offset]);

    res.status(200).json({
      total: totalUsers,
      page: page,
      limit: limit,
      data: users
    });

  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: UPDATE A USER'S ACTIVE STATUS ---
router.put('/users/:id/status', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });



  // --- ADMIN-ONLY: PERMANENTLY DELETE A USER (POST METHOD) ---
router.post('/users/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      const userIdToDelete = parseInt(req.params.id, 10);
      const { reason } = req.body; // Get reason from the request body
      const adminUserId = req.user.userId;

      // Validate that a reason was provided
      if (!reason) {
          return res.status(400).send('A reason for deletion is required.');
      }

      // Prevent an admin from deleting their own account
      if (userIdToDelete === adminUserId) {
          return res.status(403).send('Forbidden: You cannot delete your own account.');
      }

      const [users] = await db.query('SELECT username FROM tbuser WHERE UID = ?', [userIdToDelete]);
      if (users.length === 0) {
          return res.status(404).send('User not found.');
      }

      await db.query('DELETE FROM tbuser WHERE UID = ?', [userIdToDelete]);

      // Log the action, now including the reason
      try {
          const logDetails = JSON.stringify({ 
              reason: reason,
              deleted_user: { UID: userIdToDelete, username: users[0].username } 
          });
          await db.query(
            `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
            [adminUserId, 'ADMIN_DELETE_USER', 'tbuser', userIdToDelete, logDetails, req.ip]
          );
      } catch (logError) {
          console.error('Failed to log user deletion:', logError);
      }

      res.status(200).send('User permanently deleted successfully.');

  } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(409).send('Conflict: This user cannot be deleted because they have existing records (loans, expenses, etc.) associated with them.');
      }
      next(error);
  }
});



// in routes/adminRoutes.js

// --- ADMIN-ONLY: ADD FUNDS (CAPITAL INJECTION) ---
router.post('/funds', authMiddleware, adminMiddleware, async (req, res, next) => {
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
    next(error);
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL COLLECTIONS (with Pagination, Search & Date Filter) ---
router.get('/collections', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      whereClause += ` AND ${getLaosDateFilterSql('i.created_at')} BETWEEN ? AND ?`;
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
      SELECT i.IID, i.total, i.notes,
             DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at,
             u.Fname AS employee_fname, m.Fname AS customer_fname
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
    next(error);
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL EXPENSES (with Pagination, Search & Date Filter) ---
router.get('/expenses', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      whereClause += ` AND ${getLaosDateFilterSql('e.created_at')} BETWEEN ? AND ?`;
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
      SELECT e.EID, e.amount, e.expense_type,
             DATE_FORMAT(CONVERT_TZ(e.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at,
             u.Fname AS employee_fname
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
    next(error);
  }
});



  // --- ADMIN-ONLY: RESET A USER'S PASSWORD ---
router.put('/users/:id/password', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });


  
  // --- ADMIN-ONLY: UPDATE A USER'S DETAILS ---
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const userIdToUpdate = req.params.id;
    const adminUserId = req.user.userId;

    // 1. Get the new data and the reason from the request body
    const { Fname, Lname, username, phone, Email, address, role_id, edit_reason, } = req.body;

    // 2. Validate the input
    if (!edit_reason) {
      return res.status(400).send('An edit reason is required to update user details.');
    }
    if (!Fname || !Lname || !role_id) {
        return res.status(400).send('First name, last name, and role are required.');
    }

    // 3. Prepare and execute the SQL UPDATE query
    const sql = `
        UPDATE tbuser 
        SET Fname = ?, Lname = ?, username = ?, phone = ?, Email = ?, address = ?, role_id = ? 
        WHERE UID = ?`;

    const values = [Fname, Lname, username, phone, Email, address, role_id, userIdToUpdate];
    const [result] = await db.query(sql, values);

    // 4. Check if a user was actually updated
    if (result.affectedRows === 0) {
      return res.status(404).send('User not found.');
    }

    // 5. Log the action
    try {
      const logDetails = JSON.stringify({ reason: edit_reason, updated_user_id: userIdToUpdate });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [adminUserId, 'ADMIN_UPDATE_USER', 'tbuser', userIdToUpdate, logDetails, req.ip]);
    } catch (logError) {
      console.error('Failed to log user update:', logError);
    }

    res.status(200).send('User details updated successfully.');

  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: GET A SINGLE COLLECTION BY ID ---
router.get('/collections/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
      const collectionId = req.params.id;
  
      // No user_id check needed, as an admin can view any record
      const sql = `
        SELECT
          IID, member_id, user_id, total, photo_url, notes, market_id, type, category, payment_method,
          DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at
        FROM tbincome
        WHERE IID = ?`;
      const [collections] = await db.query(sql, [collectionId]);
      
      if (collections.length === 0) {
        return res.status(404).send('Collection not found.');
      }
      
      res.status(200).json(collections[0]);
    } catch (error) {
      next(error);
    }
  });



  // --- ADMIN-ONLY: UPDATE ANY COLLECTION ---
router.put('/collections/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });



// --- ADMIN-ONLY: DELETE ANY COLLECTION ---
router.post('/collections/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });


  
  // --- ADMIN-ONLY: GET A SINGLE EXPENSE ---
  router.get('/expenses/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
      const expenseId = req.params.id;
      const sql = `
        SELECT
          EID, user_id, expense_type, amount, photo_url, notes, category, payment_method, market_id,
          DATE_FORMAT(CONVERT_TZ(created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at
        FROM tbexpenses
        WHERE EID = ?`;
      const [expenses] = await db.query(sql, [expenseId]);
  
      if (expenses.length === 0) {
        return res.status(404).send('Expense not found.');
      }
      res.status(200).json(expenses[0]);
    } catch (error) {
      next(error);
    }
  });


  
  // --- ADMIN-ONLY: UPDATE ANY EXPENSE ---
  router.put('/expenses/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });
  


  // --- ADMIN-ONLY: DELETE ANY EXPENSE ---
  router.post('/expenses/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
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
      next(error);
    }
  });



// --- ADMIN-ONLY: GET A LIST OF ALL LOANS (ENHANCED with Market Name) ---
router.get('/loans', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const { startDate, endDate } = req.query; // We already have date filters here

    let whereClause = 'WHERE 1=1';
    let queryValues = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      // UPDATED: Now also searches by market name
      whereClause += ` AND (m.Fname LIKE ? OR m.Lname LIKE ? OR u.Fname LIKE ? OR u.Lname LIKE ? OR mk.Mname LIKE ?)`;
      queryValues.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (startDate && endDate) {
      whereClause += ` AND ${getLaosDateFilterSql('l.start_date')} BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }

    // UPDATED: Added JOIN to tbmarkets
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbloans AS l
      JOIN tbmember AS m ON l.member_id = m.MID
      JOIN tbuser AS u ON l.created_by = u.UID
      JOIN tbmarkets AS mk ON m.market_id = mk.MkID
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalLoans = countResult[0].total;

    // UPDATED: Added JOIN and selected market_name
    const dataSql = `
      SELECT
        l.LID, l.total,
        DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS start_date,
        l.status, l.paid_total,
        m.Fname AS customer_fname,
        u.Fname AS created_by_fname,
        mk.Mname AS market_name
      FROM tbloans AS l
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
    next(error);
  }
});



// --- ADMIN-ONLY: CREATE A NEW CUSTOMER ---
router.post('/customers', authMiddleware, adminMiddleware, async (req, res, next) => {
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
    next(error);
  }
});



// --- ADMIN-ONLY: GET A LIST OF ALL CUSTOMERS ---
router.get('/customers', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const sql = `SELECT m.MID, m.Fname, m.Lname, m.is_active, mk.Mname AS market_name 
                 FROM tbmember AS m 
                 JOIN tbmarkets AS mk ON m.market_id = mk.MkID
                 WHERE m.role_id = 2 ORDER BY m.Fname ASC`; // Assuming role_id 2 is for customers
    const [customers] = await db.query(sql);
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: GET A SINGLE CUSTOMER ---
router.get('/customers/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const sql = `SELECT * FROM tbmember WHERE MID = ?`;
    const [customers] = await db.query(sql, [customerId]);
    if (customers.length === 0) {
      return res.status(404).send('Customer not found.');
    }
    res.status(200).json(customers[0]);
  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: UPDATE A CUSTOMER ---
router.put('/customers/:id', authMiddleware, adminMiddleware, async (req, res, next) => {
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
    next(error);
  }
});



// --- ADMIN-ONLY: DELETE A CUSTOMER ---
router.post('/customers/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
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
    next(error);
  }
});



router.put('/assignments/market/:market_id', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const marketId = parseInt(req.params.market_id, 10);
    // Get the new employee ID from the request body (can be null to unassign)
    const newEmployeeId = req.body.employee_id !== undefined ? (req.body.employee_id ? parseInt(req.body.employee_id, 10) : null) : undefined;
    const adminUserId = req.user.userId;

    // --- Basic Validation ---
    if (isNaN(marketId)) {
      return res.status(400).send('Invalid Market ID.');
    }
    if (newEmployeeId === undefined) {
      return res.status(400).send('Request body must contain "employee_id" (can be null).');
    }
    if (newEmployeeId !== null && isNaN(newEmployeeId)) {
       return res.status(400).send('Invalid Employee ID provided.');
    }

    // --- Optional: Check if market exists ---
    const [marketCheck] = await db.query('SELECT MkID FROM tbmarkets WHERE MkID = ?', [marketId]);
    if (marketCheck.length === 0) {
      return res.status(404).send('Market not found.');
    }

    // --- Optional: Check if employee exists and is valid if assigning ---
    if (newEmployeeId !== null) {
        const [userCheck] = await db.query('SELECT role_id FROM tbuser WHERE UID = ? AND is_active = 1', [newEmployeeId]);
        if (!(userCheck.length > 0 && (userCheck[0].role_id === 4 || userCheck[0].role_id === 1))) {
            console.warn(`Attempted assignment for Market ${marketId} to invalid/inactive User ${newEmployeeId}.`);
            return res.status(400).send('Invalid or inactive user selected for assignment.');
        }
    }

    // --- Perform UPSERT (Insert or Update) ---
    // This command tries to INSERT. If a row with the same market_id already exists
    // (due to the UNIQUE key), it triggers the ON DUPLICATE KEY UPDATE part instead.
    const upsertSql = `
      INSERT INTO employee_market_assignments (market_id, employee_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE employee_id = VALUES(employee_id);
    `;
    // VALUES(employee_id) refers to the employee_id provided in the VALUES clause (i.e., newEmployeeId)
    const [result] = await db.query(upsertSql, [marketId, newEmployeeId]);

    console.log(`Upsert result for Market ${marketId}:`, result); // Debug log

    // --- Logging ---
    try {
      const logDetails = JSON.stringify({ market_id: marketId, new_assigned_employee_id: newEmployeeId });
      await db.query(
        `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
        [adminUserId, 'ADMIN_UPDATE_MARKET_ASSIGNMENT', 'employee_market_assignments', marketId, logDetails, req.ip]
      );
    } catch (logError) {
      console.error('Failed to log market assignment update:', logError);
    }

    res.status(200).send(`Market ${marketId} assignment updated.`);

  } catch (err) {
    console.error("Error updating market assignment:", err);
    next(err); // Pass error to global handler
  }
});

  

module.exports = router;