// routes/marketsRoutes.js
const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

/* =========================
 * MARKETS: LIST (Admin/Employee)  GET /api/markets
 * ========================= */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, roleId } = req.user; // 1 = Admin, 4 = Employee
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';

    let baseQuery;
    let queryValues = [];

    const selectClause = `
      SELECT mk.*,
             (SELECT ema.employee_id
              FROM employee_market_assignments ema
              WHERE ema.market_id = mk.MkID
              LIMIT 1) AS responsible_by
    `;

    if (roleId === 1) {
      baseQuery = `FROM tbmarkets AS mk`;
    } else {
      baseQuery = `
        FROM tbmarkets AS mk
        JOIN employee_market_assignments AS ema ON mk.MkID = ema.market_id
        WHERE ema.employee_id = ?
      `;
      queryValues.push(userId);
    }

    let searchClause = '';
    if (searchTerm) {
      const pattern = `%${searchTerm}%`;
      searchClause = roleId === 1 ? `WHERE mk.Mname LIKE ?` : `AND mk.Mname LIKE ?`;
      queryValues.push(pattern);
    }

    const countSql = `SELECT COUNT(*) AS total ${baseQuery} ${searchClause}`;
    const [countRows] = await db.query(countSql, queryValues);
    const total = countRows[0].total;

    const dataSql = `
      ${selectClause}
      ${baseQuery}
      ${searchClause}
      ORDER BY mk.Mname ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataSql, [...queryValues, limit, offset]);

    res.status(200).json({ total, page, limit, data: rows });
  } catch (err) {
    next(error);
  }
});
 
/* =========================
 * CREATE MARKET  POST /api/markets
 * ========================= */

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;
    const { Mname, Address } = req.body;

    if (!Mname || !Address) {
      return res.status(400).send('Mname and Address are required.');
    }

    // 1) create market
    const [result] = await db.query(
      `INSERT INTO tbmarkets (Mname, Address) VALUES (?, ?)`,
      [Mname, Address]
    );
    const marketId = result.insertId;

    // 2) If employee, assign market to creator
    if (roleId !== 1) {
      await db.query(
        `INSERT IGNORE INTO employee_market_assignments (employee_id, market_id) VALUES (?, ?)`,
        [userId, marketId]
      );
    }

    // 3) Return the created market
    const [rows] = await db.query(`SELECT * FROM tbmarkets WHERE MkID = ?`, [marketId]);

    // 4) Log the action (don't fail if this fails)
    try {
      await db.query(
        `INSERT INTO activity_log 
         (user_id, action_type, target_table, target_id, details, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'CREATE_MARKET',
          'tbmarkets',
          marketId,
          JSON.stringify({ Mname, Address }),
          req.ip
        ]
      );
    } catch (logErr) {
      console.error('Failed to log market create:', logErr);
    }

    return res.status(201).json(rows[0]);
  } catch (err) {
    next(error);
  }
});


/* =========================
 * GET SINGLE MARKET  GET /api/markets/:id
 * ========================= */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const marketId = req.params.id;
    const { userId, roleId } = req.user;

    let sql, values;
    if (roleId === 1) {
      sql = `SELECT * FROM tbmarkets WHERE MkID = ?`;
      values = [marketId];
    } else {
      sql = `SELECT mk.* FROM tbmarkets mk
             JOIN employee_market_assignments ema ON mk.MkID = ema.market_id
             WHERE mk.MkID = ? AND ema.employee_id = ?`;
      values = [marketId, userId];
    }

    const [rows] = await db.query(sql, values);
    if (rows.length === 0) return res.status(404).send('Market not found or permission denied.');
    res.status(200).json(rows[0]);
  } catch (err) {
    next(error);
  }
});

/* =========================
 * UPDATE MARKET  PUT /api/markets/:id
 * ========================= */
router.put('/:id', authMiddleware, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const { userId, roleId } = req.user;
    const marketId = req.params.id;
    const { Mname, Address, edit_reason } = req.body;

    if (!edit_reason) return res.status(400).send('An edit reason is required.');

    if (roleId !== 1) {
      const [assign] = await db.query(
        `SELECT 1 FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`,
        [userId, marketId]
      );
      if (assign.length === 0) return res.status(403).send('Forbidden');
    }

    let sql, values;
    if (roleId === 1) {
      sql = `UPDATE tbmarkets SET Mname = ?, Address = ? WHERE MkID = ?`;
      values = [Mname, Address, marketId];
    } else {
      sql = `UPDATE tbmarkets SET Mname = ?, Address = ? WHERE MkID = ?`;
      values = [Mname, Address, marketId];
    }

    const [r] = await db.query(sql, values);
    if (r.affectedRows === 0) return res.status(404).send('Market not found.');

    try {
      const details = JSON.stringify({ reason: edit_reason });
      await db.query(
        `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address)
         VALUES (?, 'UPDATE_MARKET', 'tbmarkets', ?, ?, ?)`,
        [userId, marketId, details, req.ip]
      );
    } catch (logErr) {
      console.error('Failed to log market update:', logErr);
    }

    res.status(200).send('Market updated successfully.');
  } catch (err) {
    next(error);
  }
});

/* =========================
 * DELETE MARKET (Admin)  POST /api/markets/:id/delete
 * ========================= */
router.post('/:id/delete', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const marketId = req.params.id;
    const adminUserId = req.user.userId;
    const { reason } = req.body;
    if (!reason) return res.status(400).send('A reason for deletion is required.');

    const [mk] = await db.query(`SELECT * FROM tbmarkets WHERE MkID = ?`, [marketId]);
    if (mk.length === 0) return res.status(404).send('Market not found.');

    await db.query(`DELETE FROM tbmarkets WHERE MkID = ?`, [marketId]);

    try {
      const details = JSON.stringify({ reason, deleted_record: mk[0] });
      await db.query(
        `INSERT INTO activity_log (user_id, action_type, target_table, target_id, details, ip_address)
         VALUES (?, 'ADMIN_DELETE_MARKET', 'tbmarkets', ?, ?, ?)`,
        [adminUserId, marketId, details, req.ip]
      );
    } catch (logErr) {
      console.error('Failed to log admin market deletion:', logErr);
    }

    res.status(200).send('Market permanently deleted by admin.');
  } catch (err) {
    next(error);
  }
});
/* =========================
 * CUSTOMERS OF MARKET  GET /api/markets/:id/customers
 * ========================= */
router.get('/:id/customers', authMiddleware, async (req, res, next) => {
  try {
    const marketId = req.params.id;
    const { userId, roleId } = req.user;

    // employee ต้องมีสิทธิ์ในตลาดนั้นก่อน
    if (roleId !== 1) {
      const [assign] = await db.query(
        `SELECT 1 FROM employee_market_assignments WHERE employee_id = ? AND market_id = ?`,
        [userId, marketId]
      );
      if (assign.length === 0) return res.status(403).send('Forbidden');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    // ✅ สร้าง where อย่างถูกต้อง
    const whereParts = ['m.market_id = ?'];
    const vals = [marketId];

    if (search) {
      whereParts.push('(m.Fname LIKE ? OR m.Lname LIKE ?)');
      vals.push(`%${search}%`, `%${search}%`);
    }
    const whereSQL = `WHERE ${whereParts.join(' AND ')}`;

    // ✅ นับจำนวนทั้งหมด
    const [cnt] = await db.query(
      `SELECT COUNT(*) AS total
         FROM tbmember m
         ${whereSQL}`,
      vals
    );
    const total = cnt[0]?.total ?? 0;

    // ✅ ดึงข้อมูล (มี birth_date, age, และยอดกู้รวม)
    const [rows] = await db.query(
      `SELECT
         m.MID,
         m.Fname,
         m.Lname,
         m.market_id,
         m.role_id,
         m.is_active,
         m.birth_date,
         TIMESTAMPDIFF(YEAR, m.birth_date, CURDATE()) AS age,
         (
           SELECT COALESCE(SUM(l.total), 0)
           FROM tbloans l
           WHERE l.member_id = m.MID AND l.status = 1
         ) AS total_loan_amount
       FROM tbmember m
       ${whereSQL}
       ORDER BY m.Fname ASC
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return res.status(200).json({ total, page, limit, data: rows });
  } catch (err) {
    next(error);
  }
});


/* =========================
 * SUMMARY  GET /api/markets/:id/summary
 * ========================= */
router.get('/:id/summary', authMiddleware, async (req, res, next) => {
  try {
    const marketId = req.params.id;
    const days = parseInt(req.query.days || '7', 10);

    const sql = `
      SELECT
        COALESCE((
          SELECT SUM(total) FROM tbincome
          WHERE market_id = ? AND type = 'COLLECTION'
            AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ), 0) AS totalIncome,
        (
          COALESCE((
            SELECT SUM(amount) FROM tbexpenses
            WHERE market_id = ?
              AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          ), 0)
          +
          COALESCE((
            SELECT SUM(l.total)
            FROM tbloans l
            JOIN tbmember m ON l.member_id = m.MID
            WHERE m.market_id = ?
              AND DATE(l.start_date) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
          ), 0)
        ) AS totalExpense
    `;
    const params = [marketId, days, marketId, days, marketId, days];
    const [rows] = await db.query(sql, params);
    const { totalIncome, totalExpense } = rows[0] || { totalIncome: 0, totalExpense: 0 };

    res.status(200).json({ totalIncome: Number(totalIncome) || 0, totalExpense: Number(totalExpense) || 0 });
  } catch (err) {
    next(error);
  }
});

/* =========================
 * TRANSACTIONS OF MARKET  GET /api/markets/:id/transactions
 * ========================= */
router.get('/:id/transactions', authMiddleware, async (req, res, next) => {
  try {
    const marketId = req.params.id;
    const sql = `
      SELECT * FROM (
        SELECT i.IID AS id,'income' AS type,i.created_at AS date,i.notes AS description,i.category,
               i.payment_method AS paymentMethod,i.total AS amount
        FROM tbincome i WHERE i.market_id = ?
        UNION ALL
        SELECT e.EID AS id,'expense' AS type,e.created_at AS date,e.expense_type AS description,e.category,
               e.payment_method AS paymentMethod,e.amount AS amount
        FROM tbexpenses e WHERE e.market_id = ?
        UNION ALL
        SELECT l.LID AS id,'loan' AS type,l.start_date AS date,
               CONCAT('Loan to ', m.Fname, ' ', m.Lname) AS description,
               'Loan Disbursement' AS category,'system' AS paymentMethod,l.total AS amount
        FROM tbloans l JOIN tbmember m ON l.member_id = m.MID
        WHERE m.market_id = ?
      ) t ORDER BY t.date DESC
    `;
    const [rows] = await db.query(sql, [marketId, marketId, marketId]);
    res.status(200).json(rows);
  } catch (err) {
    next(error);
  }
});

/* =========================
 * RESPONSIBLE CANDIDATES  GET /api/markets/:id/responsible-candidates
 * ========================= */
router.get('/:id/responsible-candidates', authMiddleware, async (_req, res, next) => {
  try {
    const sql = `
      SELECT u.UID AS id, u.Fname AS firstName, u.Lname AS lastName, u.role_id AS roleId
      FROM tbuser u
      WHERE u.role_id IN (1, 4) AND u.is_active = 1
      ORDER BY u.Fname ASC, u.Lname ASC
    `;
    const [rows] = await db.query(sql);
    res.status(200).json(rows);
  } catch (err) {
    next(error);
  }
});

module.exports = router;
