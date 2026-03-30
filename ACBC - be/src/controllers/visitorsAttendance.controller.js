const sql = require("mssql");
const { poolPromise } = require("../services/db");
const { logActivity } = require("./activity.controller");

const VALID_SERVICES = ["Sunday Service", "Midweek Service"];

/**
 * POST /api/visitors
 */
exports.markVisitorAttendance = async (req, res) => {
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

    const pool = await poolPromise;

    await pool.request()
      .input("first_name", sql.NVarChar, first_name)
      .input("last_name", sql.NVarChar, last_name)
      .input("phone", sql.NVarChar, phone || null)
      .input("visit_date", sql.Date, visit_date)
      .input("service_type", sql.NVarChar, service_type)
      .input("invited_by", sql.NVarChar, invited_by || null)
      .input("remarks", sql.NVarChar, remarks || null)
      .query(`
        INSERT INTO Visitors
        (first_name, last_name, phone, visit_date, service_type, invited_by, remarks, created_at)
        VALUES
        (@first_name, @last_name, @phone, @visit_date, @service_type, @invited_by, @remarks, GETDATE())
      `);

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

exports.getVisitorsReport = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start date and end date are required",
      });
    }

    const pool = await poolPromise;

    const visitorsResult = await pool
      .request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          first_name,
          last_name,
          visit_date,
          service_type
        FROM Visitors
        WHERE visit_date BETWEEN @start AND @end
        ORDER BY visit_date DESC
      `);

    const totalVisitors = visitorsResult.recordset.length;

    res.json({
      total: totalVisitors,
      visitors: visitorsResult.recordset,
    });
  } catch (err) {
    console.error("Visitors Report Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};