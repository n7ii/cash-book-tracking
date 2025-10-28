// in routes/reportsRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');



router.get('/balance', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const queryValues = (startDate && endDate) ? [startDate, endDate] : [];

    const dateFilterIncome = (startDate && endDate) ? `AND ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?` : '';
    const dateFilterExpense = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?` : '';
    const dateFilterLoan = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('start_date')} BETWEEN ? AND ?` : '';

    // --- Income calculation (remains the same) ---
    const incomeSql = `SELECT SUM(total) AS total_income FROM tbincome WHERE type = 'COLLECTION' ${dateFilterIncome}`;
    const [incomeResult] = await db.query(incomeSql, queryValues);

    // --- UPDATED Expense calculation ---
    const expenseSql = `
        SELECT SUM(total_expenses) as total_expenses FROM (
            -- Get from tbexpenses table
            SELECT SUM(amount) as total_expenses 
            FROM tbexpenses 
            ${dateFilterExpense}
            
            UNION ALL

            -- Get from tbloans table
            SELECT SUM(total) as total_expenses 
            FROM tbloans 
            ${dateFilterLoan}
        ) as combined_expenses;
    `;

    // We need to pass the date values twice for the UNION query
    const expenseQueryValues = (startDate && endDate) ? [startDate, endDate, startDate, endDate] : [];
    const [expenseResult] = await db.query(expenseSql, expenseQueryValues);

    const totalIncome = parseFloat(incomeResult[0].total_income) || 0;
    const totalExpenses = parseFloat(expenseResult[0].total_expenses) || 0;
    
    const netBalance = totalIncome - totalExpenses;

    res.status(200).json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        reportPeriod: startDate && endDate ? { from: startDate, to: endDate } : 'All Time'
      }
    });

  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: GET EXPENSE SUMMARY BY CATEGORY ---
router.get('/category-summary', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
          return res.status(400).send('Start date and end date are required.');
      }

      // THIS IS THE FINAL, CORRECTED QUERY
      const sql = `
          SELECT 
              COALESCE(category, 'Uncategorized') as category, 
              SUM(amount) as total
          FROM (
              -- Select ONLY from the tbexpenses 'category' column
              SELECT category, amount 
              FROM tbexpenses
              WHERE ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?
              
              UNION ALL

              -- Select from tbloans and assign 'Loan' as the category
              SELECT 'Loan' as category, total as amount 
              FROM tbloans
              WHERE ${getLaosDateFilterSql('start_date')} BETWEEN ? AND ?

          ) as combined_expenses
          GROUP BY COALESCE(category, 'Uncategorized')
          ORDER BY total DESC;
      `;

      const [results] = await db.query(sql, [startDate, endDate, startDate, endDate]);
      
      res.status(200).json(results);

  } catch (error) {
    next(error);
  }
});



// --- ADMIN-ONLY: GET MONTHLY TRENDS DATA ---
router.get('/monthly-trends', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      // This query gets the sum of income and expenses for each of the last 12 months
      const sql = `
          SELECT 
              DATE_FORMAT(all_dates.month_date, '%Y-%m') AS month,
              COALESCE(income.total_income, 0) AS totalIncome,
              COALESCE(expenses.total_expenses, 0) AS totalExpenses
          FROM 
          (
              -- Generate a list of the last 12 months
              SELECT DATE_SUB(CURDATE(), INTERVAL (a.a + (10 * b.a)) MONTH) as month_date
              FROM (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS a
              CROSS JOIN (SELECT 0 AS a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS b
              WHERE (a.a + (10 * b.a)) < 6
          ) AS all_dates
          LEFT JOIN 
          (
              -- Sum up income for each month
              SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(total) AS total_income
              FROM tbincome
              WHERE type = 'COLLECTION'
              GROUP BY month
          ) AS income ON DATE_FORMAT(all_dates.month_date, '%Y-%m') = income.month
          LEFT JOIN 
          (
              -- Sum up expenses and loans for each month
              SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS total_expenses
              FROM (
                  SELECT created_at as date, amount FROM tbexpenses
                  UNION ALL
                  SELECT start_date as date, total as amount FROM tbloans
              ) as combined_expenses
              GROUP BY month
          ) AS expenses ON DATE_FORMAT(all_dates.month_date, '%Y-%m') = expenses.month
          ORDER BY month ASC;
      `;

      const [results] = await db.query(sql);
      res.status(200).json(results);

  } catch (error) {
    next(error);
  }
});



// --- ENDPOINT 1: FOR THE DETAILED USER ACTIVITY PAGE (Now with Pagination) ---
router.get('/useractivity', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    // 1. Get all parameters, including new pagination ones
    const { startDate, endDate } = req.query;
    const searchTerm = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // Default to 20 items per page
    const offset = (page - 1) * limit;

    const queryValues = (startDate && endDate) ? [startDate, endDate] : [];

    const dateFilterIncome = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?` : '';
    const dateFilterExpense = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('created_at')} BETWEEN ? AND ?` : '';
    const dateFilterLoan = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('start_date')} BETWEEN ? AND ?` : '';

    const incomeSql = `SELECT SUM(total) AS total_income FROM tbincome ${dateFilterIncome}`;
    const expenseSql = `SELECT SUM(amount) AS total_expenses FROM tbexpenses ${dateFilterExpense}`;
    const loansSql = `SELECT SUM(total) AS total_loans FROM tbloans ${dateFilterLoan}`;

    const [incomeResult] = await db.query(incomeSql, queryValues);
    const [expenseResult] = await db.query(expenseSql, queryValues);
    const [loansResult] = await db.query(loansSql, queryValues);

    const totalIncome = parseFloat(incomeResult[0].total_income) || 0;
    const operationalExpenses = parseFloat(expenseResult[0].total_expenses) || 0;
    const loanDisbursements = parseFloat(loansResult[0].total_loans) || 0;
    const totalExpenses = operationalExpenses + loanDisbursements;
    const netBalance = totalIncome - totalExpenses;
    

    // --- Detailed Transaction List (Logic is now split for counting and fetching) ---
    const baseQuery = `
       FROM (
          SELECT
            i.IID as id,
            DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS date,
            'income' AS type, i.notes AS description, i.total AS amount,
            u.Fname AS employee_name, mk.Mname AS market_name,
            COALESCE(m.Fname, 'SYSTEM') AS collector_name
          FROM tbincome i
          JOIN tbuser u ON i.user_id = u.UID
          LEFT JOIN tbmember m ON i.member_id = m.MID
          LEFT JOIN tbmarkets mk ON i.market_id = mk.MkID

          UNION ALL

          SELECT
            e.EID as id,
            DATE_FORMAT(CONVERT_TZ(e.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS date,
            'expense' AS type, e.expense_type AS description, e.amount,
            u.Fname AS employee_name, mk.Mname AS market_name,
            NULL AS collector_name
          FROM tbexpenses e
          JOIN tbuser u ON e.user_id = u.UID
          LEFT JOIN tbmarkets mk ON e.market_id = mk.MkID

          UNION ALL

          SELECT
            l.LID as id,
            DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') AS date,
            'loan' AS type, CONCAT('Loan to ', m.Fname, ' ', m.Lname) AS description,
            l.total as amount, u.Fname as employee_name, mk.Mname as market_name,
            m.Fname as collector_name
          FROM tbloans l
          JOIN tbuser u ON l.created_by = u.UID
          JOIN tbmember m ON l.member_id = m.MID
          LEFT JOIN tbmarkets mk ON m.market_id = mk.MkID
      ) AS transactions
    `;

    const dateWhereClause = (startDate && endDate) ? `WHERE ${getLaosDateFilterSql('date')} BETWEEN ? AND ?` : '';
    let finalWhereClause = dateWhereClause;
    let finalQueryValues = [...queryValues];

    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      finalWhereClause += (startDate && endDate) ? ` AND` : ` WHERE`;
      finalWhereClause += ` (description LIKE ? OR employee_name LIKE ? OR market_name LIKE ?)`;
      finalQueryValues.push(searchPattern, searchPattern, searchPattern);
    }

    // 2. NEW: Perform a COUNT query to get the total number of matching transactions
    const countSql = `SELECT COUNT(*) as total ${baseQuery} ${finalWhereClause}`;
    const [countResult] = await db.query(countSql, finalQueryValues);
    const totalTransactions = countResult[0].total;

    // 3. UPDATED: Add LIMIT and OFFSET to the data query
    const dataSql = `SELECT * ${baseQuery} ${finalWhereClause} ORDER BY date DESC LIMIT ? OFFSET ?`;
    const [details] = await db.query(dataSql, [...finalQueryValues, limit, offset]);

    // 4. UPDATED: Return pagination info along with the data
    res.status(200).json({
      summary: { totalIncome, totalExpenses, netBalance, reportPeriod: startDate && endDate ? { from: startDate, to: endDate } : 'All Time' },
      pagination: {
        total: totalTransactions,
        page: page,
        limit: limit,
      },
      data: details
    });
  } catch (error) {
    next(error);
  }
});



// --- GET LATEST RECONCILIATION DATE ---
router.get('/reconciliations/latest', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const sql = `SELECT reconciled_at FROM tb_reconciliations ORDER BY reconciled_at DESC LIMIT 1;`;
        const [results] = await db.query(sql);
        let lastReconciledDateISOString = null;
        if (results.length > 0 && results[0].reconciled_at) {
            let dbTimestampStr = results[0].reconciled_at; // Now guaranteed to be a string
            if (typeof dbTimestampStr === 'string' && !dbTimestampStr.endsWith('Z') && dbTimestampStr.includes(' ')) {
                 // Append 'Z' to make it explicitly UTC for the JS Date constructor
                 dbTimestampStr = dbTimestampStr.replace(' ', 'T') + 'Z';
            }
            const jsDate = new Date(dbTimestampStr);
            if (!isNaN(jsDate.getTime())) {
                 lastReconciledDateISOString = jsDate.toISOString(); // Should now be "2025-10-23T02:32:52.000Z"
            } else {
                 console.error("Failed to parse date string from DB:", results[0].reconciled_at);
            }
        }
        res.status(200).json({ lastReconciledDate: lastReconciledDateISOString });
    } catch (error) { 
      next(error);
     }
});



// --- SAVE A NEW RECONCILIATION ---
router.post('/reconciliations', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
      const { statement_date, system_balance, bank_balance } = req.body;
      const userId = req.user.userId;

      // Validate input
      if (!statement_date || system_balance === undefined || bank_balance === undefined) {
          return res.status(400).send('Missing required reconciliation data.');
      }

      const sql = `
          INSERT INTO tb_reconciliations 
          (reconciled_by_user_id, statement_date, system_balance, bank_balance) 
          VALUES (?, ?, ?, ?);
      `;
      const [result] = await db.query(sql, [userId, statement_date, system_balance, bank_balance]);
      const newReconciliationId = result.insertId;

      // Log the action
      try {
          const logDetails = JSON.stringify({ statement_date, balance_difference: system_balance - bank_balance });
          await db.query(
            `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, 'CREATE_RECONCILIATION', 'tb_reconciliations', newReconciliationId, logDetails, req.ip]
          );
      } catch (logError) {
          console.error('Failed to log reconciliation creation:', logError);
      }

      res.status(201).send('Reconciliation saved successfully.');

  } catch (error) {
    next(error);
  }
});



module.exports = router;