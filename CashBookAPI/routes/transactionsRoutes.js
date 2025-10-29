const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { getLaosDateFilterSql } = require('../utils/dbUtils');

// --- GET A UNIFIED LIST OF ALL TRANSACTIONS ---
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // --- Filtering, Sorting, Pagination ---
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Default to 50 records
        const offset = (page - 1) * limit;

        const filterType = req.query.type || ''; // 'income' or 'expense'
        const filterCategory = req.query.category || '';
        const searchTerm = req.query.search || '';
        
        const sortBy = req.query.sortBy === 'amount' ? 'amount' : 'date'; // Default to date
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC'; // Default to desc

        // --- Build the Query ---
        let whereClauses = [];
        let queryParams = [];

        // NEW: Add a role check from the JWT
        const userRole = req.user.roleId; 

        const { startDate, endDate } = req.query;
        if (startDate && endDate && startDate !== '' && endDate !== '') {
            whereClauses.push(`${getLaosDateFilterSql('date')} BETWEEN ? AND ?`);
            queryParams.push(startDate, endDate);
        }


        if (userRole !== 1) {
            whereClauses.push(`user_id = ?`);
            queryParams.push(userId);
        }

        if (filterType) {
            // If the user asks for 'expense', include 'loan' as well.
            if (filterType === 'expense') {
                whereClauses.push(`(type = ? OR type = ?)`);
                queryParams.push('expense', 'loan');
            } else {
                whereClauses.push(`type = ?`);
                queryParams.push(filterType);
            }
        }
        if (filterCategory) {
            whereClauses.push(`category = ?`);
            queryParams.push(filterCategory);
        }
        if (searchTerm) {
            // Check if the search term is a number, which could be an ID
            const isNumeric = !isNaN(searchTerm) && searchTerm.trim() !== '';
            
            // Build the search conditions
            const conditions = [
                `description LIKE ?`,
                `employee LIKE ?`,
                `market LIKE ?`
            ];
            
            const searchPattern = `%${searchTerm}%`;
            const queryValues = [searchPattern, searchPattern, searchPattern];
        
            // If it's a number, add the ID check
            if (isNumeric) {
                conditions.push(`id = ?`);
                queryValues.push(parseInt(searchTerm, 10));
            }
        
            whereClauses.push(`(${conditions.join(' OR ')})`);
            queryParams.push(...queryValues);
        }

        const baseQuery = `
    SELECT * FROM (
        -- Income Records --
        SELECT 
            i.IID as id, 'income' as type, 
            -- Format the date explicitly to ISO 8601 with UTC offset
            DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            i.notes as description, i.category, i.payment_method as paymentMethod, i.total as amount,
            NULL as collector, mk.Mname as market, CONCAT(u.Fname, ' ', u.Lname) as employee, i.user_id
        FROM tbincome i
        LEFT JOIN tbmarkets mk ON i.market_id = mk.MkID
        JOIN tbuser u ON i.user_id = u.UID

        UNION ALL

        -- Expense Records --
        SELECT 
            e.EID as id, 'expense' as type, 
            -- Format the date explicitly
            DATE_FORMAT(CONVERT_TZ(e.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            e.expense_type as description, e.category, e.payment_method as paymentMethod, e.amount,
            NULL as collector, mk.Mname as market, CONCAT(u.Fname, ' ', u.Lname) as employee, e.user_id
        FROM tbexpenses e
        LEFT JOIN tbmarkets mk ON e.market_id = mk.MkID
        JOIN tbuser u ON e.user_id = u.UID

        UNION ALL

        -- Loan Disbursement Records --
        SELECT 
            l.LID as id, 'loan' as type, 
            -- Format the date explicitly
            DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            CONCAT('Loan to ', m.Fname, ' ', m.Lname) as description, 'Loan Disbursement' as category, 
            'system' as paymentMethod, l.total as amount, NULL as collector, mk.Mname as market, 
            CONCAT(u.Fname, ' ', u.Lname) as employee, l.created_by as user_id
        FROM tbloans l
        JOIN tbmember m ON l.member_id = m.MID
        JOIN tbuser u ON l.created_by = u.UID
        LEFT JOIN tbmarkets mk ON m.market_id = mk.MkID

    ) as transactions
`;

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // Get total count for pagination
        const countSql = `SELECT COUNT(*) as total FROM (${baseQuery} ${whereSql}) as subquery`;
        const [countResult] = await db.query(countSql, queryParams);
        const totalTransactions = countResult[0].total;

        // Get the paginated data
        const dataSql = `
            ${baseQuery}
            ${whereSql}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        
        const [transactions] = await db.query(dataSql, [...queryParams, limit, offset]);

        res.status(200).json({
            total: totalTransactions,
            page,
            limit,
            data: transactions
        });

    } catch (error) {
        next(error);
    }
});



// --- DELETE A TRANSACTION (INCOME OR EXPENSE) VIA POST ---
router.post('/:type/:id/delete', authMiddleware, async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const { reason } = req.body;
        // Get both userId and roleId from the token
        const { userId, roleId } = req.user;

        if (!reason) {
            return res.status(400).send('A reason for deletion is required.');
        }

        let tableName, idColumn;
        if (type === 'income') {
            tableName = 'tbincome';
            idColumn = 'IID';
        } else if (type === 'expense') {
            tableName = 'tbexpenses';
            idColumn = 'EID';
        } else if (type === 'loan') {
            tableName = 'tbloans';
            idColumn = 'LID';
        } else {
            return res.status(400).send('Invalid transaction type.');
        }

        // --- MODIFIED LOGIC START ---
        let findRecordSql, findRecordValues;

        // If the user is an Admin (roleId === 1), find the record by ID only.
        if (roleId === 1) {
            findRecordSql = `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`;
            findRecordValues = [id];
        } else {
            // If they are not an admin, they can only find their own records.
            findRecordSql = `SELECT * FROM ${tableName} WHERE ${idColumn} = ? AND user_id = ?`;
            findRecordValues = [id, userId];
        }

        const [records] = await db.query(findRecordSql, findRecordValues);
        // --- MODIFIED LOGIC END ---

        if (records.length === 0) {
            return res.status(404).send('Transaction not found or you do not have permission.');
        }

        const recordToDelete = records[0];
        // The user ID for logging should be the admin who performed the action
        const loggerUserId = userId;
        const logActionType = roleId === 1 ? `ADMIN_DELETE_${type.toUpperCase()}` : `DELETE_${type.toUpperCase()}`;

        await db.query(`DELETE FROM ${tableName} WHERE ${idColumn} = ?`, [id]);

        try {
            const logDetails = JSON.stringify({ reason: reason, deleted_record: recordToDelete });
            await db.query(
              `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
              [loggerUserId, logActionType, tableName, id, logDetails, req.ip]
            );
        } catch (logError) { console.error('Failed to log transaction deletion:', logError); }

        res.status(200).send('Transaction deleted successfully.');

    } catch (error) {
        next(error);
    }
});



// --- UPDATE A TRANSACTION (INCOME OR EXPENSE) ---
router.put('/:type/:id', authMiddleware, async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const { edit_reason, ...data } = req.body;
        const userId = req.user.userId;

        if (!edit_reason) {
            return res.status(400).send('An edit reason is required.');
        }

        let tableName, idColumn, updateSql, values;

        if (type === 'income') {
            tableName = 'tbincome';
            idColumn = 'IID';
            // Note: Define which fields are updatable for income
            updateSql = `UPDATE ${tableName} SET total = ?, notes = ?, category = ?, payment_method = ? WHERE ${idColumn} = ? AND user_id = ?`;
            values = [data.amount, data.description, data.category, data.paymentMethod, id, userId];

        } else if (type === 'expense') {
            tableName = 'tbexpenses';
            idColumn = 'EID';
            // Note: Define which fields are updatable for expense
            updateSql = `UPDATE ${tableName} SET amount = ?, expense_type = ?, notes = ?, category = ?, payment_method = ? WHERE ${idColumn} = ? AND user_id = ?`;
            values = [data.amount, data.description, data.notes, data.category, data.paymentMethod, id, userId];

        } else {
            return res.status(400).send('Invalid transaction type.');
        }

        const [result] = await db.query(updateSql, values);

        if (result.affectedRows === 0) {
            return res.status(404).send('Transaction not found or you do not have permission.');
        }

        // Log the update
        try {
            const logDetails = JSON.stringify({ reason: edit_reason, updated_data: data });
            await db.query(
              `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, `UPDATE_${type.toUpperCase()}`, tableName, id, logDetails, req.ip]
            );
        } catch (logError) { console.error('Failed to log transaction update:', logError); }

        res.status(200).send('Transaction updated successfully.');

    } catch (error) {
        next(error);
    }
});



// --- GET UNIQUE CATEGORIES AND TYPES FOR FILTERS ---
router.get('/filters', authMiddleware, async (req, res, next) => {
    try {
        const [incomeCats] = await db.query("SELECT DISTINCT category FROM tbincome WHERE category IS NOT NULL AND category != ''");
        const [expenseCats] = await db.query("SELECT DISTINCT category FROM tbexpenses WHERE category IS NOT NULL AND category != ''");
        const [expenseTypes] = await db.query("SELECT DISTINCT expense_type FROM tbexpenses WHERE expense_type IS NOT NULL AND expense_type != ''");
        
        // Combine all categories and types into a single list
        const allCategories = [
            ...incomeCats.map(c => c.category),
            ...expenseCats.map(c => c.category),
            'Loan Disbursement' // Manually add the loan category
        ];
        
        // Remove duplicates and sort alphabetically
        const uniqueCategories = [...new Set(allCategories)].sort();
        
        // Define the types you want to be able to filter by
        const types = ['income', 'expense'];

        res.status(200).json({ categories: uniqueCategories, types });

    } catch (error) {
        next(error);
    }
});



// --- EXPORT ALL TRANSACTIONS TO CSV ---
router.get('/export', authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.roleId;

        // Get the filters from the request query
        const { type: filterType, category: filterCategory, search: searchTerm, startDate, endDate } = req.query;

        let whereClauses = [];
        let queryParams = [];

        // Build the WHERE clause based on the provided filters
        if (startDate && endDate && startDate !== '' && endDate !== '') {
            whereClauses.push(`${getLaosDateFilterSql('date')} BETWEEN ? AND ?`);
            queryParams.push(startDate, endDate);
        }
        if (userRole !== 1) {
            whereClauses.push(`user_id = ?`);
            queryParams.push(userId);
        }
        if (filterType) {
            // If the user asks for 'expense', include 'loan' as well.
            if (filterType === 'expense') {
                whereClauses.push(`(type = ? OR type = ?)`);
                queryParams.push('expense', 'loan');
            } else {
                whereClauses.push(`type = ?`);
                queryParams.push(filterType);
            }
        }
        if (filterCategory) {
            whereClauses.push(`category = ?`);
            queryParams.push(filterCategory);
        }
        if (searchTerm) {
            whereClauses.push(`(description LIKE ? OR employee LIKE ? OR market LIKE ?)`);
            const searchPattern = `%${searchTerm}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        // The full, correct base query
        const baseQuery = `
            SELECT * FROM (
        -- Income Records --
        SELECT 
            i.IID as id, 'income' as type, 
            DATE_FORMAT(CONVERT_TZ(i.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            i.notes as description, i.category, i.payment_method as paymentMethod, i.total as amount,
            NULL as collector, mk.Mname as market, CONCAT(u.Fname, ' ', u.Lname) as employee, i.user_id
        FROM tbincome i
        LEFT JOIN tbmarkets mk ON i.market_id = mk.MkID
        JOIN tbuser u ON i.user_id = u.UID

        UNION ALL

        -- Expense Records --
        SELECT 
            e.EID as id, 'expense' as type, 
            DATE_FORMAT(CONVERT_TZ(e.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            e.expense_type as description, e.category, e.payment_method as paymentMethod, e.amount,
            NULL as collector, mk.Mname as market, CONCAT(u.Fname, ' ', u.Lname) as employee, e.user_id
        FROM tbexpenses e
        LEFT JOIN tbmarkets mk ON e.market_id = mk.MkID
        JOIN tbuser u ON e.user_id = u.UID

        UNION ALL

        -- Loan Disbursement Records --
        SELECT 
            l.LID as id, 'loan' as type, 
            DATE_FORMAT(CONVERT_TZ(l.start_date, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as date, 
            CONCAT('Loan to ', m.Fname, ' ', m.Lname) as description, 'Loan Disbursement' as category, 
            'system' as paymentMethod, l.total as amount, NULL as collector, mk.Mname as market, 
            CONCAT(u.Fname, ' ', u.Lname) as employee, l.created_by as user_id
        FROM tbloans l
        JOIN tbmember m ON l.member_id = m.MID
        JOIN tbuser u ON l.created_by = u.UID
        LEFT JOIN tbmarkets mk ON m.market_id = mk.MkID

    ) as transactions
`;

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        // This query fetches ALL matching data, without a page limit
        const dataSql = `
            ${baseQuery}
            ${whereSql}
            ORDER BY date DESC
        `;
        
        const [transactions] = await db.query(dataSql, queryParams);

        // Send the complete list of filtered transactions
        res.status(200).json(transactions);

    } catch (error) {
        next(error);
    }
});



module.exports = router;