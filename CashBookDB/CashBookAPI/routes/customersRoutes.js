// in routes/customersRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// --- CREATE A CUSTOMER (Employee or Admin) ---
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { Fname, Lname, market_id, role_id, is_active } = req.body;
    const creatorUserId = req.user.userId;
    if (typeof market_id !== 'number' || typeof role_id !== 'number') {
      return res.status(400).send('Market ID and Role ID must be numbers.');
    }
    if (!Fname || !Lname || !market_id || !role_id) {
      return res.status(400).send('All fields are required.');
    }

    const sql = `INSERT INTO tbmember (Fname, Lname, market_id, role_id, is_active) VALUES (?, ?, ?, ?, ?)`;
    const values = [Fname, Lname, market_id, role_id, is_active];
    const [result] = await db.query(sql, values);
    const newCustomerId = result.insertId;

    try {
      const logDetails = JSON.stringify({ customer_name: `${Fname} ${Lname}` });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [creatorUserId, 'CREATE_CUSTOMER', 'tbmember', newCustomerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer creation:', logError); }

    res.status(201).send('Customer created successfully.');
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).send('Server error');
  }
});



// --- GET CUSTOMERS (Handles both Admins and Employees) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. Get all parameters from the URL query
    const { userId, roleId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // 2. Prepare variables for our dynamic SQL query
    let countSql, dataSql;
    let countValues = [], dataValues = [];
    
    const searchClause = `AND (m.Fname LIKE ? OR m.Lname LIKE ?)`;
    const searchValues = [`%${searchTerm}%`, `%${searchTerm}%`];

    // 3. Build the queries based on the user's role
    if (roleId === 1) { // --- Admin Logic ---
      countSql = `SELECT COUNT(*) AS total FROM tbmember m WHERE m.role_id = 2 ${searchTerm ? searchClause : ''}`;
      countValues = searchTerm ? searchValues : [];
      
      dataSql = `
        SELECT m.MID, m.Fname, m.Lname, mk.Mname AS market_name,
        (SELECT SUM(l.total) FROM tbloans l WHERE l.member_id = m.MID AND l.status = 1) AS total_loan_amount
        FROM tbmember AS m
        JOIN tbmarkets AS mk ON m.market_id = mk.MkID
        WHERE m.role_id = 2 ${searchTerm ? searchClause : ''}
        ORDER BY m.Fname ASC
        LIMIT ? OFFSET ?;
      `;
      dataValues = searchTerm ? [...searchValues, limit, offset] : [limit, offset];

    } else { // --- Employee Logic ---
      countSql = `SELECT COUNT(*) AS total FROM tbmember m 
                  JOIN employee_market_assignments ema ON m.market_id = ema.market_id
                  WHERE m.role_id = 2 AND ema.employee_id = ? ${searchTerm ? searchClause : ''}`;
      countValues = searchTerm ? [userId, ...searchValues] : [userId];

      dataSql = `
        SELECT m.MID, m.Fname, m.Lname, mk.Mname AS market_name,
        (SELECT SUM(l.total) FROM tbloans l WHERE l.member_id = m.MID AND l.status = 1) AS total_loan_amount
        FROM tbmember AS m
        JOIN tbmarkets AS mk ON m.market_id = mk.MkID
        JOIN employee_market_assignments AS ema ON m.market_id = ema.market_id
        WHERE m.role_id = 2 AND ema.employee_id = ? ${searchTerm ? searchClause : ''}
        ORDER BY m.Fname ASC
        LIMIT ? OFFSET ?;
      `;
      dataValues = searchTerm ? [userId, ...searchValues, limit, offset] : [userId, limit, offset];
    }
    
    // 4. Execute the queries and send the response
    const [countResult] = await db.query(countSql, countValues);
    const [customers] = await db.query(dataSql, dataValues);

    res.status(200).json({
      total: countResult[0].total,
      page: page,
      limit: limit,
      data: customers
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).send('Server error');
  }
});




// --- GET A SINGLE CUSTOMER (Employee or Admin) ---
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, roleId } = req.user;
    const customerId = req.params.id;
    let sql, values;

    if (roleId === 1) { 
      sql = `SELECT * FROM tbmember WHERE MID = ?`;
      values = [customerId];
    } else { 
      sql = `SELECT m.* FROM tbmember AS m
             JOIN employee_market_assignments AS ema ON m.market_id = ema.market_id
             WHERE m.MID = ? AND ema.employee_id = ?`;
      values = [customerId, userId];
    }
    
    const [customers] = await db.query(sql, values);
    if (customers.length === 0) {
      return res.status(404).send('Customer not found or you do not have permission.');
    }
    res.status(200).json(customers[0]);
  } catch (error) {
    console.error('Error fetching single customer:', error);
    res.status(500).send('Server error');
  }
});



// --- UPDATE A CUSTOMER (Employee or Admin) ---
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, roleId } = req.user;
    const customerId = req.params.id;
    const { Fname, Lname, market_id, is_active, edit_reason } = req.body;
    
    if (!edit_reason) return res.status(400).send('An edit reason is required.');
    
    const [customers] = await db.query(`SELECT market_id FROM tbmember WHERE MID = ?`, [customerId]);
    if (customers.length === 0) return res.status(404).send('Customer not found.');
    
    if (roleId !== 1) { 
      const customerMarketId = customers[0].market_id;
      const [assignments] = await db.query(`SELECT * FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`, [userId, customerMarketId]);
      if (assignments.length === 0) return res.status(403).send('Forbidden: You can only edit customers in your assigned markets.');
    }
    
    const sql = `UPDATE tbmember SET Fname = ?, Lname = ?, market_id = ?, is_active = ? WHERE MID = ?`;
    await db.query(sql, [Fname, Lname, market_id, is_active, customerId]);

    try {
      const logDetails = JSON.stringify({ reason: edit_reason });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_CUSTOMER', 'tbmember', customerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer update:', logError); }
    
    res.status(200).send('Customer updated successfully.');
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).send('Server error');
  }
});



// --- DELETE A CUSTOMER (Employee or Admin) ---
router.post('/:id/delete', authMiddleware, async (req, res) => {
  try {
    const { userId, roleId } = req.user;
    const customerId = req.params.id;
    const { reason } = req.body; 
    
    if (!reason) {
      return res.status(400).send('A deletion reason is required.');
    }
    
    const [customers] = await db.query(`SELECT * FROM tbmember WHERE MID = ?`, [customerId]);
    if (customers.length === 0) {
      return res.status(404).send('Customer not found.');
    }
    const customerToDelete = customers[0];
    
    if (roleId !== 1) { 
      const customerMarketId = customerToDelete.market_id;
      const [assignments] = await db.query(`SELECT * FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`, [userId, customerMarketId]);
      if (assignments.length === 0) {
        return res.status(403).send('Forbidden: You can only delete customers in your assigned markets.');
      }
    }
    
    const sql = `DELETE FROM tbmember WHERE MID = ?`;
    await db.query(sql, [customerId]);

    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      
      const logDetails = JSON.stringify({ reason: reason, deleted_record: customerToDelete });
      
      await db.query(logSql, [userId, 'DELETE_CUSTOMER', 'tbmember', customerId, logDetails, req.ip]);
    } catch (logError) { 
      console.error('Failed to log customer deletion:', logError); 
    }
    
    res.status(200).send('Customer deleted successfully.');
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).send('Server error');
  }
});



// --- GET ALL LOANS FOR A SPECIFIC CUSTOMER (Now includes customer's name) ---
router.get('/:id/loans', authMiddleware, async (req, res) => {
  try {
    const customerId = req.params.id;
    const { startDate, endDate } = req.query;

    // 1. Get the customer's details first
    const customerSql = `SELECT MID, Fname, Lname FROM tbmember WHERE MID = ?`;
    const [customers] = await db.query(customerSql, [customerId]);

    if (customers.length === 0) {
      return res.status(404).send('Customer not found.');
    }
    const customerInfo = customers[0];

    // 2. Build the query to get the loans
    let loansSql = `
      SELECT 
        l.LID, l.total, l.start_date, l.end_date, l.status,
        u.Fname AS created_by_fname, u.Lname AS created_by_lname
      FROM tbloans AS l
      JOIN tbuser AS u ON l.created_by = u.UID
      WHERE l.member_id = ?
    `;
    const queryValues = [customerId];

    if (startDate && endDate) {
      loansSql += ` AND DATE(l.start_date) BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }
    
    loansSql += ` ORDER BY l.start_date DESC;`;
    
    const [loans] = await db.query(loansSql, queryValues);
    
    // 3. Combine customer info and loans into a single response object
    res.status(200).json({
      customer: {
        id: customerInfo.MID,
        firstName: customerInfo.Fname,
        lastName: customerInfo.Lname
      },
      loans: loans
    });

  } catch (error) {
    console.error(`Error fetching loans for customer ${req.params.id}:`, error);
    res.status(500).send('Server error');
  }
});

module.exports = router;