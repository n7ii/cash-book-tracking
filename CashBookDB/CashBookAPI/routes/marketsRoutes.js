// in routes/marketsRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// --- CREATE A MARKET (Handles Employees and Admins) ---
router.post('/', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { Mname, Address, responsible_by } = req.body; // Address is the village_id
    const { userId, roleId } = req.user;

    if (!Mname || !Address) {
      return res.status(400).send('Market name and address (village_id) are required.');
    }

    let responsibleUserId = userId; // Default to the creator
    if (roleId === 1 && responsible_by) { // If admin and they provide a user, override
      responsibleUserId = responsible_by;
    }

    await connection.beginTransaction();

    // 1. Create the market
    const marketSql = `INSERT INTO tbmarkets (Mname, Address, responsible_by) VALUES (?, ?, ?)`;
    const [marketResult] = await connection.query(marketSql, [Mname, Address, responsibleUserId]);
    const newMarketId = marketResult.insertId;

    // 2. Assign the responsible employee in the junction table
    const assignmentSql = `INSERT INTO employee_market_assignments (employee_id, market_id) VALUES (?, ?)`;
    await connection.query(assignmentSql, [responsibleUserId, newMarketId]);

    await connection.commit();
    
    // Log the action
    try {
      const logDetails = JSON.stringify({ market_name: Mname, responsible_user: responsibleUserId });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'CREATE_MARKET', 'tbmarkets', newMarketId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log market creation:', logError); }

    res.status(201).send('Market created and assigned successfully.');
  } catch (error) {
    await connection.rollback();
    console.error('Error creating market:', error);
    res.status(500).send('Server error');
  } finally {
    if (connection) connection.release();
  }
});



// --- GET MARKETS (For Employees, with Pagination & Search) ---
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    // Base WHERE clause to get markets assigned to the employee
    let whereClause = `WHERE ema.employee_id = ?`;
    let queryValues = [userId];

    // Add search condition if a search term is provided
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND mk.Mname LIKE ?`;
      queryValues.push(searchPattern);
    }

    // Get the total count of filtered records
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM tbmarkets AS mk
      JOIN employee_market_assignments AS ema ON mk.MkID = ema.market_id
      ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalMarkets = countResult[0].total;

    // Get the paginated and filtered data
    const dataSql = `
      SELECT mk.* FROM tbmarkets AS mk
      JOIN employee_market_assignments AS ema ON mk.MkID = ema.market_id
      ${whereClause} 
      ORDER BY mk.Mname ASC
      LIMIT ? OFFSET ?;
    `;
    
    const [markets] = await db.query(dataSql, [...queryValues, limit, offset]);
    
    res.status(200).json({
      total: totalMarkets,
      page,
      limit,
      data: markets
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).send('Server error');
  }
});



// --- UPDATE A MARKET (Handles Employees and Admins) ---
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId, roleId } = req.user;
    const marketId = req.params.id;
    const { Mname, Address, responsible_by, edit_reason } = req.body;
    
    if (!edit_reason) return res.status(400).send('An edit reason is required.');
    
    // Security Check for Employees
    if (roleId !== 1) {
      const [assignments] = await db.query(`SELECT * FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`, [userId, marketId]);
      if (assignments.length === 0) return res.status(403).send('Forbidden: You can only edit your assigned markets.');
    }
    
    let sql, values;
    if (roleId === 1) { // Admin can change the responsible person
      sql = `UPDATE tbmarkets SET Mname = ?, Address = ?, responsible_by = ? WHERE MkID = ?`;
      values = [Mname, Address, responsible_by, marketId];
    } else { // Employee cannot change the responsible person
      sql = `UPDATE tbmarkets SET Mname = ?, Address = ? WHERE MkID = ?`;
      values = [Mname, Address, marketId];
    }

    const [result] = await db.query(sql, values);
    if (result.affectedRows === 0) return res.status(404).send('Market not found.');
    
    try {
      const logDetails = JSON.stringify({ reason: edit_reason });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_MARKET', 'tbmarkets', marketId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log market update:', logError); }
    
    res.status(200).send('Market updated successfully.');
  } catch (error) {
    console.error('Error updating market:', error);
    res.status(500).send('Server error');
  }
});



// --- GET A SINGLE MARKET (Handles Employees and Admins) ---
router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const marketId = req.params.id;
      const { userId, roleId } = req.user;
      let sql, values;
  
      if (roleId === 1) { // Admin can get any market
        sql = `SELECT * FROM tbmarkets WHERE MkID = ?`;
        values = [marketId];
      } else { // Employee must be assigned to the market
        sql = `SELECT mk.* FROM tbmarkets AS mk
               JOIN employee_market_assignments AS ema ON mk.MkID = ema.market_id
               WHERE mk.MkID = ? AND ema.employee_id = ?`;
        values = [marketId, userId];
      }
  
      const [markets] = await db.query(sql, values);
      if (markets.length === 0) {
        return res.status(404).send('Market not found or you do not have permission.');
      }
      res.status(200).json(markets[0]);
    } catch (error) {
      console.error('Error fetching single market:', error);
      res.status(500).send('Server error');
    }
  });

  
  
  // --- DELETE A MARKET (Admin Only) ---
  router.post('/:id/delete', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const marketId = req.params.id;
      const adminUserId = req.user.userId;
      const { reason } = req.body;
  
      if (!reason) {
        return res.status(400).send('A reason for deletion is required.');
      }
  
      // Get a backup of the market before deleting
      const [markets] = await db.query(`SELECT * FROM tbmarkets WHERE MkID = ?`, [marketId]);
      if (markets.length === 0) {
        return res.status(404).send('Market not found.');
      }
      const marketToDelete = markets[0];
  
      // Permanently delete the market
      await db.query(`DELETE FROM tbmarkets WHERE MkID = ?`, [marketId]);
      
      // Log the action
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ reason: reason, deleted_record: marketToDelete });
        await db.query(logSql, [adminUserId, 'ADMIN_DELETE_MARKET', 'tbmarkets', marketId, logDetails, req.ip]);
      } catch (logError) { 
        console.error('Failed to log admin market deletion:', logError); 
      }
  
      res.status(200).send('Market permanently deleted by admin.');
    } catch (error) {
      // This will catch errors if, for example, a customer is still linked to this market.
      console.error('Error deleting market:', error);
      res.status(500).send('Server error. Ensure no customers are still assigned to this market.');
    }
  });



module.exports = router;