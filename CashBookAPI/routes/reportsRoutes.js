// in routes/reportsRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// --- ADMIN-ONLY: GET TOTAL BALANCE REPORT ---
router.get('/balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // 1. Query to get the sum of all income
    const incomeSql = `SELECT SUM(total) AS total_income FROM tbincome`;
    const [incomeResult] = await db.query(incomeSql);

    // 2. Query to get the sum of all expenses
    const expenseSql = `SELECT SUM(amount) AS total_expenses FROM tbexpenses`;
    const [expenseResult] = await db.query(expenseSql);

    // 3. Extract the numbers, using 0 if a table is empty
    const totalIncome = incomeResult[0].total_income || 0;
    const totalExpenses = expenseResult[0].total_expenses || 0;

    // 4. Calculate the final balance
    const currentBalance = totalIncome - totalExpenses;

    // 5. Send the complete report back as a JSON response
    res.status(200).json({
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      currentBalance: currentBalance
    });

  } catch (error) {
    console.error('Error fetching balance report:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;