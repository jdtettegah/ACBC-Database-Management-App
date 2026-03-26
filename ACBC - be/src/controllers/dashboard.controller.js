const { poolPromise, sql } = require("../services/db");

exports.getTodaySummary = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        -- Income Today
        (SELECT ISNULL(SUM(amount), 0)
         FROM Income
         WHERE CAST(date_received AS DATE) = CAST(GETDATE() AS DATE)
        ) AS income,

        -- Expenses Today
        (SELECT ISNULL(SUM(amount), 0)
         FROM Expenditure
         WHERE CAST(date_spent AS DATE) = CAST(GETDATE() AS DATE)
        ) AS expenses,

        -- Tithes Today
        (SELECT ISNULL(SUM(amount), 0)
         FROM Tithes
         WHERE CAST(date_paid AS DATE) = CAST(GETDATE() AS DATE)
        ) AS tithes,

        -- Attendance Today (Present only)
        (SELECT COUNT(*)
         FROM Attendance
         WHERE CAST(service_date AS DATE) = CAST(GETDATE() AS DATE)
         AND status = 'Present'
        ) AS attendance,

        -- Visitors Today
        (SELECT COUNT(*)
         FROM Visitors
         WHERE CAST(visit_date AS DATE) = CAST(GETDATE() AS DATE)
        ) AS visitors
    `);

    res.json(result.recordset[0]);

  } catch (error) {
    console.error("Today Summary Error:", error);
    res.status(500).json({
      message: "Failed to fetch today summary"
    });
  }
};