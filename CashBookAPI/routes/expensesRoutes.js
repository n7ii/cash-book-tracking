const express = require('express');
const db = require('../db')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router();

router.post('/', authMiddleware, async (req, res) =>{
    try{
        const { expense_type, amount, photo_url, notes} = req.body;
        const userId = req.user.userId;
        if (typeof amount !== 'number') {
          return res.status(400).send('Amount must be a number.');
        }
        if (!expense_type || !amount) {
            return res.status(400).send('expense type and amount are required.');
        }

        const sql = 'insert into tbexpenses (user_id, expense_type, amount, photo_url, notes) VALUES (?, ?, ?, ?, ?)';
        const values = [userId, expense_type, amount, photo_url, notes];

        const [result] = await db.query(sql, values);
        const newExpenseId = result.insertId;

        try{
            const logSql = 'insert into activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)';
            const logDetails = JSON.stringify({total: amount});
            const ip = req.ip;
            await db.query(logSql, [userId, 'CREATE_EXPENSE', 'tbexpenses', newExpenseId, logDetails, ip]);

        }catch (logError){
            console.error('Failed to log expenses creation:', logError);
        }

        res.status(201).send('Expense created successfully.')
    }catch(err){
        console.error('Error creating expense:', err);
        res.status(500).send('Server error')
    };
});



router.get('/', authMiddleware, async (req, res) => {
    try{
        const userId = req.user.userId;

        const sql = 'select * from tbexpenses where user_id = ? order by created_at desc';

        const [expense] = await db.query(sql, [userId]);

        res.status(200).json(expense);
    }catch(err){
        console.error('Error fetching expenses: ', err)
        return res.status(500).send("Server error")
    }
})



// --- READ: GET A SINGLE EXPENSE BY ID (PROTECTED) ---
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.userId;

    // The WHERE clause ensures the user can only get their own records
    const sql = `SELECT * FROM tbexpenses WHERE EID = ? AND user_id = ?`;
    const [expenses] = await db.query(sql, [expenseId, userId]);

    if (expenses.length === 0) {
      return res.status(404).send('Expense not found or you do not have permission.');
    }
    
    res.status(200).json(expenses[0]);
  } catch (error) {
    console.error('Error fetching single expense:', error);
    res.status(500).send('Server error');
  }
});



router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const expenseId = req.params.id;
      const { amount, notes, edit_reason } = req.body;
      const userId = req.user.userId;
  
      const [ownerCheck] = await db.query(`SELECT user_id FROM tbexpenses WHERE EID = ?`, [expenseId]);
      if (amount !== undefined && typeof amount !== 'number') {
        return res.status(400).send('If provided, amount must be a number.');
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
      
      const sql = `UPDATE tbexpenses SET amount = ?, notes = ? WHERE EID = ?`;
      await db.query(sql, [amount, notes, expenseId]);
  
      try {
        const logSql = `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`;
        const logDetails = JSON.stringify({ updated_total: amount, updated_notes: notes, reason: edit_reason});
        const ip = req.ip;
        await db.query(logSql, [userId, 'UPDATE_EXPENSE', 'tbexpenses', expenseId, logDetails, ip]);
      } catch (logError) {
        console.error('Failed to log expense update:', logError);
      }
  
      res.status(200).send('Expense updated successfully.');
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).send('Server error');
    }
  });

  

  router.post('/:id/delete', authMiddleware, async (req, res) => {
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
      console.error('Error deleting expense:', error);
      res.status(500).send('Server error');
    }
  });  



module.exports = router;