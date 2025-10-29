/**
 * Generates an SQL snippet to filter a timestamp column by date,
 * converting the stored UTC/server time to Laos time (+07) first.
 *
 * @param {string} columnName The name of the timestamp column (e.g., 'created_at', 'start_date').
 * @returns {string} The SQL snippet for date filtering in Laos time.
 */
const getLaosDateFilterSql = (columnName) => {
    // Use DATE_ADD to adjust the stored time by +7 hours before extracting the DATE.
    // Make sure the columnName is escaped properly if it comes from user input,
    // but here we assume it's a fixed string like 'created_at'.
    return `DATE(DATE_ADD(${columnName}, INTERVAL 7 HOUR))`;
  };
  
  module.exports = {
    getLaosDateFilterSql,
  };