const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// --- ADMIN-ONLY: GET DETAILED FINANCIAL REPORT (Optional Dates) ---
router.get('/balance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const searchTerm = req.query.search || '';

    const whereClause = (startDate && endDate) ? `WHERE DATE(date) BETWEEN ? AND ?` : '';
    const summaryWhereClause = (startDate && endDate) ? `WHERE DATE(created_at) BETWEEN ? AND ?` : '';
    const queryValues = (startDate && endDate) ? [startDate, endDate] : [];

    const incomeSql = `SELECT SUM(total) AS total_income FROM tbincome ${summaryWhereClause}`;
    const expenseSql = `SELECT SUM(amount) AS total_expenses FROM tbexpenses ${summaryWhereClause}`;

    const [incomeResult] = await db.query(incomeSql, queryValues);
    const [expenseResult] = await db.query(expenseSql, queryValues);

    // FIX: Convert results to numbers using parseFloat()
    const totalIncome = parseFloat(incomeResult[0].total_income) || 0;
    const totalExpenses = parseFloat(expenseResult[0].total_expenses) || 0;
    const netBalance = totalIncome - totalExpenses;

    const baseQuery = `
      FROM (
          SELECT
              i.IID as id, i.created_at AS date, 'income' AS type,
              CONCAT('Collection from ', m.Fname, ' ', m.Lname) AS description,
              i.total AS amount, u.Fname AS employee_name
          FROM tbincome i
          JOIN tbuser u ON i.user_id = u.UID
          JOIN tbmember m ON i.member_id = m.MID
          UNION ALL
          SELECT
              e.EID as id, e.created_at AS date, 'expense' AS type,
              e.expense_type AS description,
              e.amount, u.Fname AS employee_name
          FROM tbexpenses e
          JOIN tbuser u ON e.user_id = u.UID
      ) AS transactions
    `;

    let finalWhereClause = whereClause;
    let finalQueryValues = [...queryValues];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      finalWhereClause += (startDate && endDate) ? ` AND` : ` WHERE`;
      finalWhereClause += ` (description LIKE ? OR employee_name LIKE ?)`;
      finalQueryValues.push(searchPattern, searchPattern);
    }

    const dataSql = `
      SELECT * ${baseQuery}
      ${finalWhereClause}
      ORDER BY date DESC
    `;
    const [details] = await db.query(dataSql, finalQueryValues);

    res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        reportPeriod: startDate && endDate ? { from: startDate, to: endDate } : 'All Time'
      },
      data: details
    });

  } catch (error) {
    console.error('Error fetching balance report:', error);
    res.status(500).send('Server error');
  }
});


// --- ADMIN-ONLY: GET CASH FLOW REPORT ---
router.get('/cashflow', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const incomeExpenseWhereClause = (startDate && endDate) ? `WHERE DATE(created_at) BETWEEN ? AND ?` : '';
    const loansWhereClause = (startDate && endDate) ? `WHERE DATE(start_date) BETWEEN ? AND ?` : '';
    const queryValues = (startDate && endDate) ? [startDate, endDate] : [];

    const incomeSql = `SELECT SUM(total) AS total_income FROM tbincome ${incomeExpenseWhereClause}`;
    const [incomeResult] = await db.query(incomeSql, queryValues);

    const expenseSql = `SELECT SUM(amount) AS total_expenses FROM tbexpenses ${incomeExpenseWhereClause}`;
    const [expenseResult] = await db.query(expenseSql, queryValues);

    const loansSql = `SELECT SUM(total) AS total_loans_disbursed FROM tbloans ${loansWhereClause}`;
    const [loansResult] = await db.query(loansSql, queryValues);

    // FIX: Convert all results to numbers using parseFloat()
    const totalIncome = parseFloat(incomeResult[0].total_income) || 0;
    const totalExpenses = parseFloat(expenseResult[0].total_expenses) || 0;
    const totalLoansDisbursed = parseFloat(loansResult[0].total_loans_disbursed) || 0;

    const cashOnHand = totalIncome - (totalExpenses + totalLoansDisbursed);

    res.status(200).json({
      reportPeriod: startDate && endDate ? { from: startDate, to: endDate } : 'All Time',
      totalIncome,
      totalExpenses,
      totalLoansDisbursed,
      cashOnHand
    });

  } catch (error) {
    console.error('Error fetching cash flow report:', error);
    res.status(500).send('Server error');
  }
});


module.exports = router;