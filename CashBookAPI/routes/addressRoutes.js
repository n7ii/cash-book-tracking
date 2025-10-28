const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// --- ADMIN-ONLY: SEARCH FOR ADDRESSES (Villages) ---
router.get('/search', authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        // 1. Get the optional search terms from the query string
        const { village, district, province } = req.query;

        // 2. Start building the dynamic WHERE clause and the values array
        let whereConditions = [];
        let queryValues = [];

        if (village) {
            whereConditions.push("v.Vname LIKE ?");
            queryValues.push(`%${village}%`);
        }
        if (district) {
            whereConditions.push("d.Dname LIKE ?");
            queryValues.push(`%${district}%`);
        }
        if (province) {
            whereConditions.push("p.Pname LIKE ?");
            queryValues.push(`%${province}%`);
        }

        // Only proceed if at least one search term is provided
        if (whereConditions.length === 0) {
            return res.json([]); // Return an empty array if no search terms
        }

        // 3. Construct the final SQL query
        const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

        const sql = `
            SELECT 
                v.VID as id,
                CONCAT(v.Vname, ', ', d.Dname, ', ', p.Pname) as name
            FROM 
                tbvillages AS v
            JOIN 
                tbdistricts AS d ON v.district_id = d.DID
            JOIN 
                tbprovinces AS p ON d.province_id = p.PID
            ${whereClause}
            ORDER BY v.Vname, d.Dname
            LIMIT 10; 
        `; // Limit to the top 10 results for performance

        // 4. Execute the query and send the results
        const [results] = await db.query(sql, queryValues);
        res.status(200).json(results);

    } catch (error) {
      next(error);
    }
});


//  3 endpoint dropdown 
/** provinces dropdown */
router.get('/provinces', authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT PID AS id, PName AS name FROM tbprovinces ORDER BY PName ASC`
    );
    res.json(rows);
  } catch (e) {
    next(error);
  }
});

/** districts dropdown by province */
router.get('/provinces/:pid/districts', authMiddleware, async (req, res, next) => {
  try {
    const pid = req.params.pid;
    const [rows] = await db.query(
      `SELECT DID AS id, DName AS name
       FROM tbdistricts WHERE province_id = ? ORDER BY DName ASC`,
      [pid]
    );
    res.json(rows);
  } catch (e) {
    next(error);
  }
});

/** villages dropdown by district */
router.get('/districts/:did/villages', authMiddleware, async (req, res, next) => {
  try {
    const did = req.params.did;
    const [rows] = await db.query(
      `SELECT VID AS id, VName AS name
       FROM tbvillages WHERE district_id = ? ORDER BY VName ASC`,
      [did]
    );
    res.json(rows);
  } catch (e) {
    next(error);
  }
});
// --- AUTH-ONLY: RESOLVE SINGLE VILLAGE ID TO FULL ADDRESS NAME ---
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const villageId = req.params.id;
    const sql = `
      SELECT 
        v.VID       AS villageId,
        v.Vname     AS village,
        d.DID       AS districtId,
        d.Dname     AS district,
        p.PID       AS provinceId,
        p.Pname     AS province
      FROM tbvillages v
      JOIN tbdistricts d ON v.district_id  = d.DID
      JOIN tbprovinces p ON d.province_id  = p.PID
      WHERE v.VID = ?
      LIMIT 1
    `;
    const [rows] = await db.query(sql, [villageId]);
    if (!rows.length) return res.status(404).send('Address not found');

    const { village, district, province, villageId: VID, districtId: DID, provinceId: PID } = rows[0];
    const fullName = `${village}, ${district}, ${province}`;
    return res.status(200).json({
      fullName,
      parts: { village, district, province },
      ids:   { villageId: VID, districtId: DID, provinceId: PID }
    });
  } catch (err) {
    next(error);
  }
});


module.exports = router;