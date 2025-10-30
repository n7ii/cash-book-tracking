const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');

// --- CREATE A COLLECTION (WITH STATUS) ---
router.post('/', authMiddleware, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
      // Destructure ALL possible fields, including the optional ones
      const { 
          member_id, total, notes, market_id, details, photo_url = null, 
          type, category, payment_method, loan_id 
      } = req.body;
      const userId = req.user.userId;
  
      // --- VALIDATION ---
      if (typeof total !== 'number' || total <= 0) {
          return res.status(400).send('Total must be a positive number.');
      }
      if (!member_id) {
          return res.status(400).send('A member/customer ID is required.');
      }

      await connection.beginTransaction();

      // 1. Insert the main income record (this is common to all scenarios)
      const incomeSql = `INSERT INTO tbincome (member_id, user_id, total, photo_url, notes, market_id, \`type\`, category, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const incomeValues = [member_id, userId, total, photo_url, notes, market_id, type, category, payment_method];
      const [result] = await connection.query(incomeSql, incomeValues);
      const newIncomeId = result.insertId;

      // --- UPDATED LOGIC FOR BATCH DETAILS WITH AUTO-LOAN PAYMENT ---
      if (details && details.length > 0) {
          const detailsValues = [];

          // We must loop through each detail to handle the custom loan logic
          for (const detail of details) {
              const paymentAmount = detail.amount || 0;
              let loanIdToUpdate = null; // Start fresh for each detail

              // 1. AUTO-FIND LOAN: Always find the latest active loan
              // We query for the latest loan (by start_date) that is still active (status=1)
              const [loans] = await connection.query(
                  "SELECT LID FROM tbloans WHERE member_id = ? AND status = 1 ORDER BY start_date DESC LIMIT 1", 
                  [detail.member_id]
              );
              
              if (loans.length > 0) {
                  loanIdToUpdate = loans[0].LID;
              }

              // 2. UPDATE LOAN: If we found an active loan and a payment is being made
              if (loanIdToUpdate && paymentAmount > 0) {
                  await connection.query(
                      "UPDATE tbloans SET paid_total = paid_total + ? WHERE LID = ?",
                      [paymentAmount, loanIdToUpdate]
                  );
              }

              // 3. PREPARE BATCH: Add this detail to the array for batch insertion
              // (The tbincome_details table does not store the loan_id)
              detailsValues.push([
                  newIncomeId, 
                  detail.member_id, 
                  paymentAmount, 
                  detail.status, 
                  detail.notes
              ]);
          }

          // 4. BATCH INSERT: Insert all details into tbincome_details at once
          if (detailsValues.length > 0) {
              const detailsSql = `INSERT INTO tbincome_details (income_id, member_id, amount, status, notes) VALUES ?`;
              await connection.query(detailsSql, [detailsValues]);
          }

      } else if (loan_id) {
          // --- ORIGINAL LOGIC FOR SINGLE LOAN REPAYMENT ---
          // This runs if no 'details' array was provided, but a top-level loan_id was
          const updateLoanSql = `UPDATE tbloans SET paid_total = paid_total + ? WHERE LID = ?`;
          await connection.query(updateLoanSql, [total, loan_id]);
      }

      await connection.commit();
  
      // Logging logic
      try {
          const logDetails = JSON.stringify({ 
              total: total, 
              detail_count: details ? details.length : 0, 
              is_loan_payment: !!loan_id || (details && details.length > 0) // Assume any batch is a loan payment
          });
          await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'CREATE_INCOME', 'tbincome', newIncomeId, logDetails, req.ip]);
      } catch (logError) {
          console.error('Failed to log income creation:', logError);
      }

      res.status(201).send('Collection created successfully.');

  } catch (error) {
      await connection.rollback();
      next(error);
  } finally {
      if (connection) connection.release();
  }
});

// --- GET ALL COLLECTIONS FOR THE LOGGED-IN USER ---
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const { startDate, endDate } = req.query;

    let whereClause = `WHERE i.user_id = ?`;
    let queryValues = [userId];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      whereClause += ` AND (m.Fname LIKE ? OR m.Lname LIKE ? OR i.notes LIKE ?)`;
      queryValues.push(searchPattern, searchPattern, searchPattern);
    }

    if (startDate && endDate) {
      whereClause += ` AND ${getLaosDateFilterSql('i.created_at')} BETWEEN ? AND ?`;
      queryValues.push(startDate, endDate);
    }
    
    const countSql = `SELECT COUNT(*) AS total FROM tbincome i JOIN tbmember m ON i.member_id = m.MID ${whereClause}`;
    const [countResult] = await db.query(countSql, queryValues);
    const totalCollections = countResult[0].total;

    const dataSql = `
      SELECT i.IID, i.total, i.notes,
             DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at,
             m.Fname AS customer_fname
      FROM tbincome i
      JOIN tbmember m ON i.member_id = m.MID
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?;`;
    
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

// --- GET A SINGLE COLLECTION BY ID (ENHANCED & SECURED FOR ADMINS) ---
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const collectionId = req.params.id;
    const { userId, roleId } = req.user;

    // UPDATED QUERY with LEFT JOINs
    let sql = `
        SELECT
            i.IID, i.member_id, i.user_id, i.total, i.photo_url, i.notes, i.market_id, i.type, i.category, i.payment_method,
            DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS created_at,
            u.Fname AS employee_fname, u.Lname AS employee_lname,
            -- Find Collector based on market_id and role_id = 3
            collector.Fname AS collector_fname, collector.Lname AS collector_lname,
            mk.Mname AS market_name
        FROM tbincome AS i
        JOIN tbuser AS u ON i.user_id = u.UID
        -- REMOVED: LEFT JOIN tbmember AS m ON i.member_id = m.MID
        LEFT JOIN tbmarkets AS mk ON i.market_id = mk.MkID
        -- ADDED: LEFT JOIN to find the collector (member with role_id 3 in the same market)
        LEFT JOIN tbmember AS collector ON i.market_id = collector.market_id AND collector.role_id = 3
        WHERE i.IID = ?`;
    
    const values = [collectionId];

    if (roleId !== 1) {
      sql += ` AND i.user_id = ?`;
      values.push(userId);
    }

    const [collections] = await db.query(sql, values);

    if (collections.length === 0) {
      return res.status(404).send('Collection not found or you do not have permission.');
    }
    
    res.status(200).json(collections[0]);
  } catch (error) {
    next(error);
  }
});

// --- UPDATE A COLLECTION SUMMARY ---
router.put('/:id', authMiddleware, async (req, res, next) => {
    try {
      const collectionId = req.params.id;
      const { total, notes, edit_reason } = req.body;
      const userId = req.user.userId;
  
      const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
      if (ownerCheck.length === 0) return res.status(404).send('Collection not found.');
      if (!edit_reason) return res.status(400).send('An edit reason is required to make an update.');
      if (ownerCheck[0].user_id !== userId) return res.status(403).send('Forbidden: You can only edit your own collections.');
      
      await db.query(`UPDATE tbincome SET total = ?, notes = ? WHERE IID = ?`, [total, notes, collectionId]);
  
      try {
        const logDetails = JSON.stringify({ updated_total: total, updated_notes: notes, reason: edit_reason});
        await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_INCOME', 'tbincome', collectionId, logDetails, req.ip]);
      } catch (logError) { console.error('Failed to log income update:', logError); }
  
      res.status(200).send('Collection updated successfully.');
    } catch (error) {
      next(error);
    }
});

// --- DELETE A COLLECTION ---
router.post('/:id/delete', authMiddleware, async (req, res, next) => {
  try {
    const collectionId = req.params.id;
    const { userId } = req.user;
    const { reason } = req.body;

    if (!reason) return res.status(400).send('A reason for deletion is required.');

    const [collections] = await db.query(`SELECT * FROM tbincome WHERE IID = ? AND user_id = ?`, [collectionId, userId]);

    if (collections.length === 0) return res.status(404).send('Collection not found or you do not have permission.');
    
    const collectionToDelete = collections[0];
    await db.query(`DELETE FROM tbincome WHERE IID = ?`, [collectionId]);
    
    try {
      const logDetails = JSON.stringify({ reason: reason, deleted_record: collectionToDelete });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'DELETE_INCOME', 'tbincome', collectionId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log income deletion:', logError); }

    res.status(200).send('Collection permanently deleted successfully.');
  } catch (error) {
    next(error);
  }
});

// --- GET ALL DETAILS FOR A COLLECTION ---
router.get('/:id/details', authMiddleware, async (req, res, next) => {
  try {
    const collectionId = req.params.id;
    const { userId, roleId } = req.user;

    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) return res.status(403).send('Forbidden: You can only view details for your own collections.');

    const sql = `SELECT id.member_id, id.amount, id.status, id.notes, m.Fname, m.Lname
                 FROM tbincome_details AS id
                 JOIN tbmember AS m ON id.member_id = m.MID
                 WHERE id.income_id = ?`;
    
    const [details] = await db.query(sql, [collectionId]);
    res.status(200).json(details);
  } catch (error) {
    next(error);
  }
});
 
// --- GET UNPAID DETAILS FOR A COLLECTION ---
router.get('/:id/unpaid', authMiddleware, async (req, res, next) => {
  try {
    const collectionId = req.params.id;
    const { userId, roleId } = req.user;

    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) return res.status(403).send('Forbidden: You can only view details for your own collections.');

    const sql = `SELECT id.member_id, id.amount, id.status, id.notes, m.Fname, m.Lname
                 FROM tbincome_details AS id
                 JOIN tbmember AS m ON id.member_id = m.MID
                 WHERE id.income_id = ? AND id.status = 'NOT_PAID'`;
    
    const [unpaidDetails] = await db.query(sql, [collectionId]);
    res.status(200).json(unpaidDetails);
  } catch (error) {
    next(error);
  }
});

// --- UPDATE A SINGLE COLLECTION DETAIL (FOR STATUS CHANGES) ---
router.put('/:id/details/member/:memberId', authMiddleware, async (req, res, next) => {
  try {
    const { id: collectionId, memberId } = req.params;
    const { userId, roleId } = req.user;
    const { status, notes, edit_reason } = req.body;

    if (!edit_reason) return res.status(400).send('An edit reason is required.');
    if (status !== 'PAID' && status !== 'NOT_PAID') return res.status(400).send("Invalid status. Must be 'PAID' or 'NOT_PAID'.");

    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) return res.status(403).send('Forbidden: You can only edit details for your own collections.');

    const sql = `UPDATE tbincome_details SET status = ?, notes = ? WHERE income_id = ? AND member_id = ?`;
    const [result] = await db.query(sql, [status, notes, collectionId, memberId]);

    if (result.affectedRows === 0) return res.status(404).send('Collection detail for that member not found.');

    try {
      const logDetails = JSON.stringify({ reason: edit_reason, updated_status: status, for_member_id: memberId });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_INCOME_DETAIL', 'tbincome_details', collectionId, logDetails, req.ip]);
    } catch (logError) { 
      console.error('Failed to log detail update:', logError); 
    }

    res.status(200).send('Collection detail updated successfully.');
  } catch (error) {
    next(error);
  }
});

// --- DELETE A SINGLE COLLECTION DETAIL ---
router.post('/:id/details/member/:memberId/delete', authMiddleware, async (req, res, next) => {
  try {
    const { id: collectionId, memberId } = req.params;
    const { userId, roleId } = req.user;
    const { reason } = req.body;

    if (!reason) return res.status(400).send('A deletion reason is required.');

    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) return res.status(403).send('Forbidden.');
    
    const [details] = await db.query(`SELECT * FROM tbincome_details WHERE income_id = ? AND member_id = ?`, [collectionId, memberId]);
    if (details.length === 0) return res.status(404).send('Collection detail for that member not found.');
    const detailToDelete = details[0];

    await db.query(`DELETE FROM tbincome_details WHERE income_id = ? AND member_id = ?`, [collectionId, memberId]);

    try {
      const logDetails = JSON.stringify({ reason: reason, deleted_record: detailToDelete });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'DELETE_INCOME_DETAIL', 'tbincome_details', collectionId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log detail deletion:', logError); }

    res.status(200).send('Collection detail deleted successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;