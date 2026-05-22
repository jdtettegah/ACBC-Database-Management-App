import pool from '../services/db.js';

const getTodaySummary = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT

        -- Income Today
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM income
          WHERE DATE(date_received) = CURRENT_DATE
        ) AS income,

        -- Expenses Today
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM expenditure
          WHERE DATE(date_spent) = CURRENT_DATE
        ) AS expenses,

        -- Tithes Today
        (
          SELECT COALESCE(SUM(amount), 0)
          FROM tithes
          WHERE DATE(date_paid) = CURRENT_DATE
        ) AS tithes,

        -- Attendance Today
        (
          SELECT COUNT(*)
          FROM attendance
          WHERE DATE(service_date) = CURRENT_DATE
          AND status = 'Present'
        ) AS attendance,

        -- Visitors Today
        (
          SELECT COUNT(*)
          FROM visitors
          WHERE DATE(visit_date) = CURRENT_DATE
        ) AS visitors
    `);

    res.json(result.rows[0]);

  } catch (error) {

    console.error("Today Summary Error:", error);

    res.status(500).json({
      message: "Failed to fetch today summary"
    });

  }

};

export default getTodaySummary;