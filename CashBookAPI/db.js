// in db.js
const mysql = require('mysql2/promise'); // Import the promise-wrapper directly

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'cbtadmin',
  password: process.env.DB_PASSWORD, // It's best practice to store this in your .env file
  database: 'cashbook_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  timezone: '+00:00'
});

// A quick check to see if the pool is connected
pool.query('SELECT 1')
  .then(() => {
    console.log('Successfully connected to the database pool. ✅');
  })
  .catch(err => {
    console.error('Error connecting to the database pool:', err);
  });

module.exports = pool;