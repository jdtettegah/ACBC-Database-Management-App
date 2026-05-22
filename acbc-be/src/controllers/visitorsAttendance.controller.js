import pool from '../services/db.js';
import logActivity from "./activity.controller.js";

const VALID_SERVICES = ["Sunday Service", "Midweek Service"];

/**
 * POST /api/visitors
 */
const markVisitorAttendance = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      visit_date,
      service_type,
      invited_by,
      remarks,
    } = req.body;

    if (!first_name || !last_name || !visit_date || !service_type) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    if (!VALID_SERVICES.includes(service_type)) {
      return res.status(400).json({
        message: "Invalid service type",
      });
    }

    await pool.query(
      `INSERT INTO visitors
        (first_name, last_name, phone, visit_date, service_type, invited_by, remarks, created_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        first_name,
        last_name,
        phone || null,
        visit_date,
        service_type,
        invited_by || null,
        remarks || null
      ]
    );

    res.status(201).json({
      message: "Visitor recorded successfully",
    });

    await logActivity(
      "visitor",
      `Visitor recorded: ${first_name} ${last_name}`
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/visitors/report
 */
const getVisitorsReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start date and end date are required",
      });
    }

    const visitorsResult = await pool.query(
      `SELECT 
          first_name,
          last_name,
          visit_date,
          service_type
       FROM visitors
       WHERE visit_date BETWEEN $1 AND $2
       ORDER BY visit_date DESC`,
      [start, end]
    );

    const totalVisitors = visitorsResult.rows.length;

    res.json({
      total: totalVisitors,
      visitors: visitorsResult.rows,
    });

  } catch (err) {
    console.error("Visitors Report Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default { markVisitorAttendance, getVisitorsReport };