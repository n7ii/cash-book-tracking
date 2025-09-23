const express = require('express');
const db = require('../db')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router();

// in routes/collectionsRoutes.js

router.post('/', authMiddleware, async (req, res) => {
  // Get a single connection from the pool to manage the transaction
  const connection = await db.getConnection();
  try {
    const { member_id, total, photo_url, notes, market_id, details } = req.body;
    const userId = req.user.userId;
    
    if (typeof total !== 'number') {
      return res.status(400).send('Total must be a number.');
    }
    if (!member_id || !total || !details) {
      return res.status(400).send('Main collection info and details are required.');
    }

    // --- Start the Transaction ---
    await connection.beginTransaction();

    // 1. Insert the main summary record into tbincome
    const incomeSql = `INSERT INTO tbincome (member_id, user_id, total, photo_url, notes, market_id) VALUES (?, ?, ?, ?, ?, ?)`;
    const incomeValues = [member_id, userId, total, photo_url, notes, market_id];
    const [result] = await connection.query(incomeSql, incomeValues);
    const newIncomeId = result.insertId;

    // 2. If details exist, prepare and insert them into tbincome_details
    if (details && details.length > 0) {
      const detailsSql = `INSERT INTO tbincome_details (income_id, member_id, amount, notes) VALUES ?`;
      // Map the array of objects into an array of arrays for bulk insertion
      const detailsValues = details.map(d => [newIncomeId, d.member_id, d.amount, d.notes]);
      await connection.query(detailsSql, [detailsValues]);
    }

    // --- If everything was successful, commit the changes to the database ---
    await connection.commit();
    
    // 3. Log the action (after the commit is successful)
    try {
      const logDetails = JSON.stringify({ total: total, detail_count: details.length });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'CREATE_INCOME', 'tbincome', newIncomeId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log income creation:', logError); }

    res.status(201).send('Collection and details created successfully.');

  } catch (error) {
    // --- If any error occurred, roll back all changes ---
    await connection.rollback();
    console.error('Error creating collection with details:', error);
    res.status(500).send('Server error');
  } finally {
    // --- Always release the connection back to the pool in the end ---
    if (connection) connection.release();
  }
});



router.get('/', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.userId;

        const sql = 'select * from tbincome where user_id = ? order by created_at desc';

        const [collections] = await db.query(sql, [userId]);

        res.status(200).json(collections);
    }catch(err){
        console.error('Error fetching collections: ', err)
        return res.status(500).send("Server error")
    }
})



router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user.userId;

    // The WHERE clause ensures the user can only get their own records
    const sql = `SELECT * FROM tbincome WHERE IID = ? AND user_id = ?`;
    const [collections] = await db.query(sql, [collectionId, userId]);

    if (collections.length === 0) {
      return res.status(404).send('Collection not found or you do not have permission.');
    }
    
    res.status(200).json(collections[0]);
  } catch (error) {
    console.error('Error fetching single collection:', error);
    res.status(500).send('Server error');
  }
});



router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const collectionId = req.params.id;
      const { total, notes, edit_reason } = req.body;
      const userId = req.user.userId;
  
      const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
      if (total !== undefined && typeof total !== 'number') {
        return res.status(400).send('If provided, total must be a number.');
      }
      if (ownerCheck.length === 0) {
        return res.status(404).send('Collection not found.');
      }
      if (!edit_reason) {
        return res.status(400).send('An edit reason is required to make an update.');
      }
      if (ownerCheck[0].user_id !== userId) { 
        return res.status(403).send('Forbidden: You can only edit your own collections.');
      }
      
      const sql = `UPDATE tbincome SET total = ?, notes = ? WHERE IID = ?`;
      await db.query(sql, [total, notes, collectionId]);
  
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ updated_total: total, updated_notes: notes, reason: edit_reason});
        const ip = req.ip;
        await db.query(logSql, [userId, 'UPDATE_INCOME', 'tbincome', collectionId, logDetails, ip]);
      } catch (logError) {
        console.error('Failed to log income update:', logError);
      }
  
      res.status(200).send('Collection updated successfully.');
    } catch (error) {
      console.error('Error updating collection:', error);
      res.status(500).send('Server error');
    }
  });

  

router.post('/:id/delete', authMiddleware, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const userId = req.user.userId;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).send('A reason for deletion is required.');
    }

    const [collections] = await db.query(`SELECT * FROM tbincome WHERE IID = ? AND user_id = ?`, [collectionId, userId]);

    if (collections.length === 0) {
      return res.status(404).send('Collection not found or you do not have permission.');
    }
    const collectionToDelete = collections[0];

    await db.query(`DELETE FROM tbincome WHERE IID = ?`, [collectionId]);
    
    try {
      const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
      
      const logDetails = JSON.stringify({
        reason: reason,
        deleted_record: collectionToDelete
      });
      const ip = req.ip;
      await db.query(logSql, [userId, 'DELETE_INCOME', 'tbincome', collectionId, logDetails, ip]);
    } catch (logError) {
      console.error('Failed to log income deletion:', logError);
    }

    res.status(200).send('Collection permanently deleted successfully.');

  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).send('Server error');
  }
});



router.get('/:id/details', authMiddleware, async (req, res) => {
  try {
    const collectionId = req.params.id;
    const { userId, roleId } = req.user;

    // 1. Security Check: Verify the user has permission to see this collection
    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);

    if (ownerCheck.length === 0) {
      return res.status(404).send('Main collection not found.');
    }
    // Block if the user is not an admin AND not the owner of the collection
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) {
      return res.status(403).send('Forbidden: You can only view details for your own collections.');
    }

    // 2. If the check passes, get the details and join with the customer's name
    const sql = `
      SELECT 
        id.amount,
        id.photo_url,
        id.notes,
        m.Fname AS customer_fname,
        m.Lname AS customer_lname
      FROM 
        tbincome_details AS id
      JOIN
        tbmember AS m ON id.member_id = m.MID
      WHERE 
        id.income_id = ?`;
    
    const [details] = await db.query(sql, [collectionId]);

    res.status(200).json(details);

  } catch (error) {
    console.error('Error fetching collection details:', error);
    res.status(500).send('Server error');
  }
});



// --- UPDATE A SINGLE COLLECTION DETAIL (Your Way) ---
router.put('/:id/details/member/:memberId', authMiddleware, async (req, res) => {
  try {
    const { id: collectionId, memberId } = req.params;
    const { userId, roleId } = req.user;
    const { amount, notes, edit_reason } = req.body;

    if (!edit_reason) return res.status(400).send('An edit reason is required.');

    // Security Check: Verify user has permission to edit this collection
    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) {
      return res.status(403).send('Forbidden: You can only edit details for your own collections.');
    }

    // Update the detail record using BOTH IDs to find the correct row
    const sql = `UPDATE tbincome_details SET amount = ?, notes = ? WHERE income_id = ? AND member_id = ?`;
    const [result] = await db.query(sql, [amount, notes, collectionId, memberId]);

    if (result.affectedRows === 0) {
      return res.status(404).send('Collection detail for that member not found.');
    }

    // Log the action
    try {
      const logDetails = JSON.stringify({ reason: edit_reason, updated_amount: amount, for_member_id: memberId });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'UPDATE_INCOME_DETAIL', 'tbincome_details', collectionId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log detail update:', logError); }

    res.status(200).send('Collection detail updated successfully.');
  } catch (error) {
    console.error('Error updating collection detail:', error);
    res.status(500).send('Server error');
  }
});



// --- DELETE A SINGLE COLLECTION DETAIL (Your Way) ---
router.post('/:id/details/member/:memberId/delete', authMiddleware, async (req, res) => {
  try {
    const { id: collectionId, memberId } = req.params;
    const { userId, roleId } = req.user;
    const { reason } = req.body;

    if (!reason) return res.status(400).send('A deletion reason is required.');

    // Security Check (same as update)
    const [ownerCheck] = await db.query(`SELECT user_id FROM tbincome WHERE IID = ?`, [collectionId]);
    if (ownerCheck.length === 0) return res.status(404).send('Main collection not found.');
    if (roleId !== 1 && ownerCheck[0].user_id !== userId) {
      return res.status(403).send('Forbidden: You can only delete details from your own collections.');
    }

    // Get a backup before deleting
    const [details] = await db.query(`SELECT * FROM tbincome_details WHERE income_id = ? AND member_id = ?`, [collectionId, memberId]);
    if (details.length === 0) return res.status(404).send('Collection detail for that member not found.');
    const detailToDelete = details[0];

    // Delete the record using BOTH IDs
    await db.query(`DELETE FROM tbincome_details WHERE income_id = ? AND member_id = ?`, [collectionId, memberId]);

    // Log the action
    try {
      const logDetails = JSON.stringify({ reason: reason, deleted_record: detailToDelete });
      await db.query(`INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`, [userId, 'DELETE_INCOME_DETAIL', 'tbincome_details', collectionId, logDetails, req.ip]);
    } catch (logError) { console.error('Failed to log detail deletion:', logError); }

    res.status(200).send('Collection detail deleted successfully.');
  } catch (error) {
    console.error('Error deleting collection detail:', error);
    res.status(500).send('Server error');
  }
});



module.exports = router;