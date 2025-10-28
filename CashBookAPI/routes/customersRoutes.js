// in routes/customersRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils'); // Adjust path if needed

// --- CREATE A CUSTOMER (Employee or Admin) ---
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { Fname, Lname, market_id, role_id, is_active ,birth_date } = req.body;
    const creatorUserId = req.user.userId;
    if (typeof market_id !== 'number' || typeof role_id !== 'number') {
      return res.status(400).send('Market ID and Role ID must be numbers.');
    }
    if (!Fname || !Lname || !market_id || !role_id) {
      return res.status(400).send('All fields are required.');
    }

    const sql = `INSERT INTO tbmember (Fname, Lname, market_id, role_id, is_active, birth_date) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [Fname, Lname, market_id, role_id, is_active, (birth_date || null)];
    const [result] = await db.query(sql, values);
    const newCustomerId = result.insertId;

    try {
      const logDetails = JSON.stringify({ customer_name: `${Fname} ${Lname}` });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [creatorUserId, 'CREATE_CUSTOMER', 'tbmember', newCustomerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer creation:', logError); }

    res.status(201).send('Customer created successfully.');
  } catch (error) {
    next(error);
  }
});



// --- GET CUSTOMERS (Handles both Admins and Employees) ---
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = (req.query.search || '').trim();

    // ---- role filter ----
    // accept: '2','3','member','collector','all'
    let roleFilter = 2; // default: member
    const r = (req.query.role || '').toString().toLowerCase();
    if (r === '3' || r === 'collector') roleFilter = 3;
    if (r === 'all') roleFilter = 0; // 0 = no filter

    const whereParts = [];
    const whereVals = [];

    if (roleFilter) {
      whereParts.push('m.role_id = ?');
      whereVals.push(roleFilter);
    } else {
      // all: no role filter
    }

    if (searchTerm) {
      whereParts.push('(m.Fname LIKE ? OR m.Lname LIKE ?)');
      whereVals.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // ----- build base sql by role (admin vs employee) -----
    let baseFromSQL = `
      FROM tbmember AS m
      JOIN tbmarkets AS mk ON m.market_id = mk.MkID
    `;
    let countJoinVals = [...whereVals];
    let dataJoinVals  = [...whereVals];

    if (roleId !== 1) {
      // employee: restrict to assigned markets
      baseFromSQL += `
        JOIN employee_market_assignments AS ema ON m.market_id = ema.market_id
      `;
      // prepend employee guard to WHERE
      const guard = whereSQL ? `${whereSQL} AND ema.employee_id = ?` : `WHERE ema.employee_id = ?`;
      // for count/data we need employee id at end (keep order consistent)
      countJoinVals = [...whereVals, userId];
      dataJoinVals  = [...whereVals, userId];

      // rebuild whereSQL with guard
      // note: we can't just reuse whereSQL string because we need to insert the guard
      // so compute guardWhere separately for queries below
      const guardWhere = whereParts.length
        ? `WHERE ${whereParts.join(' AND ')} AND ema.employee_id = ?`
        : `WHERE ema.employee_id = ?`;

      // COUNT
      const countSql = `SELECT COUNT(*) AS total ${baseFromSQL} ${guardWhere}`;
      const [countRows] = await db.query(countSql, countJoinVals);

      // DATA
      const dataSql = `
        SELECT
          m.MID, m.Fname, m.Lname,
          m.birth_date,
          TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) AS age,
          m.role_id, m.is_active,
          mk.Mname AS market_name,
          (SELECT SUM(l.total) FROM tbloans l WHERE l.member_id = m.MID AND l.status = 1) AS total_loan_amount
        ${baseFromSQL}
        ${guardWhere}
        ORDER BY m.Fname ASC
        LIMIT ? OFFSET ?;
      `;
      const [rows] = await db.query(dataSql, [...dataJoinVals, limit, offset]);

      return res.status(200).json({
        total: countRows[0]?.total ?? 0,
        page,
        limit,
        data: rows,
      });
    }

    // ----- admin path (no employee guard) -----
    const countSql = `SELECT COUNT(*) AS total ${baseFromSQL} ${whereSQL}`;
    const [countRows] = await db.query(countSql, countJoinVals);

    const dataSql = `
      SELECT
        m.MID, m.Fname, m.Lname,
        m.birth_date,
        TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) AS age,
        m.role_id, m.is_active,
        mk.Mname AS market_name,
        (SELECT SUM(l.total) FROM tbloans l WHERE l.member_id = m.MID AND l.status = 1) AS total_loan_amount
      ${baseFromSQL}
      ${whereSQL}
      ORDER BY m.Fname ASC
      LIMIT ? OFFSET ?;
    `;
    const [rows] = await db.query(dataSql, [...dataJoinVals, limit, offset]);

    return res.status(200).json({
      total: countRows[0]?.total ?? 0,
      page,
      limit,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});



// --- GET A SINGLE CUSTOMER (Employee or Admin) ---
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;
    const customerId = req.params.id;
    let sql, values;

    if (roleId === 1) { 
      sql = `
   SELECT m.MID, m.Fname, m.Lname, m.market_id, m.role_id, m.is_active,
          m.birth_date, TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) AS age
   FROM tbmember m
   WHERE m.MID = ?
 `;
      values = [customerId];
    } else { 
      sql = `SELECT m.MID, m.Fname, m.Lname, m.market_id, m.role_id, m.is_active,
               m.birth_date, TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) AS age
        FROM tbmember AS m
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
    next(error);
  }
});



// --- UPDATE A CUSTOMER (Employee or Admin) ---
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;
    const customerId = req.params.id;
    const { Fname, Lname, market_id, is_active, birth_date, edit_reason } = req.body;
    
    if (!edit_reason) return res.status(400).send('An edit reason is required.');
    
    const [customers] = await db.query(`SELECT market_id FROM tbmember WHERE MID = ?`, [customerId]);
    if (customers.length === 0) return res.status(404).send('Customer not found.');
    
    if (roleId !== 1) { 
      const customerMarketId = customers[0].market_id;
      const [assignments] = await db.query(`SELECT * FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`, [userId, customerMarketId]);
      if (assignments.length === 0) return res.status(403).send('Forbidden: You can only edit customers in your assigned markets.');
    }

    const sql = `UPDATE tbmember SET Fname = ?, Lname = ?, market_id = ?, is_active = ?, birth_date = ? WHERE MID = ?`;
    await db.query(sql, [Fname, Lname, market_id, is_active, (birth_date || null), customerId]);

    try {
      const logDetails = JSON.stringify({ reason: edit_reason });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_CUSTOMER', 'tbmember', customerId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log customer update:', logError); }
    
    res.status(200).send('Customer updated successfully.');
  } catch (error) {
    next(error);
  }
});



// --- DELETE A CUSTOMER (Employee or Admin) ---
router.post('/:id/delete', authMiddleware, async (req, res, next) => {
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
    next(error);
  }
});



// --- GET ALL LOANS FOR A SPECIFIC CUSTOMER (Now includes customer's name) ---
router.get('/:id/loans', authMiddleware, async (req, res, next) => {
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
        l.LID, l.total, l.paid_total,
        DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS start_date,
        CASE
            WHEN l.end_date IS NOT NULL THEN DATE_FORMAT(CONVERT_TZ(l.end_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ')
            ELSE NULL
        END AS end_date,
        l.status,
        u.Fname AS created_by_fname, u.Lname AS created_by_lname
      FROM tbloans AS l
      JOIN tbuser AS u ON l.created_by = u.UID
      WHERE l.member_id = ?
    `;
    const queryValues = [customerId];

    if (startDate && endDate) {
      loansSql += ` AND ${getLaosDateFilterSql('l.start_date')} BETWEEN ? AND ?`;
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
    next(error);
  }
});



// --- GET A CUSTOMER'S TOTAL OUTSTANDING LOAN BALANCE ---
router.get('/:id/outstanding-balance', authMiddleware, async (req, res, next) => {
  try {
      const customerId = req.params.id;

      // This query sums the total and paid_total for all ACTIVE loans for one customer.
      const sql = `
          SELECT
              SUM(total) as total_principal,
              SUM(paid_total) as total_repaid
          FROM tbloans
          WHERE member_id = ? AND status = 1;
      `;

      const [results] = await db.query(sql, [customerId]);
      const balanceData = results[0];

      // Handle cases where the customer has no active loans.
      const totalPrincipal = Number(balanceData.total_principal) || 0;
      const totalRepaid = Number(balanceData.total_repaid) || 0;
      const outstandingBalance = totalPrincipal - totalRepaid;

      // Send the calculated data back as a JSON object.
      res.status(200).json({
          total_principal: totalPrincipal,
          total_repaid: totalRepaid,
          outstanding_balance: outstandingBalance
      });

  } catch (error) {
    next(error);
  }
});




// --- GET THE LATEST ACTIVE LOAN FOR A CUSTOMER (WITH WARNING COUNT) ---
router.get('/:id/active-loan', authMiddleware, async (req, res, next) => {
  try {
      const customerId = req.params.id;

      // This query finds the single latest active loan and ALSO counts
      // the total number of active loans for that customer.
      const sql = `
    SELECT
        l.LID, l.member_id, l.total, l.status, l.notes, l.created_by,
        l.paid_total,
        (l.total - l.paid_total) AS outstanding_total,
        DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS start_date,
        CASE
            WHEN l.end_date IS NOT NULL THEN DATE_FORMAT(CONVERT_TZ(l.end_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ')
            ELSE NULL
        END AS end_date,
        m.Fname AS customer_fname, m.Lname AS customer_lname,
        mk.Mname AS market_name,
        u.Fname AS created_by_fname, u.Lname AS created_by_lname,
        (SELECT COUNT(LID) FROM tbloans WHERE member_id = ? AND status = 1) AS active_loan_count
    FROM tbloans AS l
    JOIN tbmember AS m ON l.member_id = m.MID
    JOIN tbmarkets AS mk ON m.market_id = mk.MkID
    JOIN tbuser AS u ON l.created_by = u.UID
    WHERE l.member_id = ? AND l.status = 1
    ORDER BY l.start_date DESC
    LIMIT 1;
`;

      const [results] = await db.query(sql, [customerId, customerId]);

      // If an active loan is found, send its details.
      // The active_loan_count will be included in the object.
      if (results.length > 0) {
          res.status(200).json(results[0]);
      } else {
          // If no active loan is found, send a null response.
          res.status(200).json({ loan: null, active_loan_count: 0 });
      }

  } catch (error) {
    next(error);
  }
});



module.exports = router;