const { poolPromise, sql } = require("../services/db");

/**
 * ➕ Log Activity (internal use)
 */
const logActivity = async (activity_type, description, reference_id = null) => {
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("activity_type", sql.NVarChar, activity_type)
      .input("description", sql.NVarChar, description)
      .input("reference_id", sql.Int, reference_id)
      .query(`
        INSERT INTO ActivityLog (activity_type, description, reference_id)
        VALUES (@activity_type, @description, @reference_id)
      `);

  } catch (err) {
    console.error("Log Activity Error:", err);
  }
};

/**
 * 📜 Get Recent Activities
 * GET /api/activity
 */
const getActivities = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT TOP 10 
          id,
          activity_type,
          description,
          created_at
        FROM ActivityLog
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error("Get Activity Error:", err);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
};

module.exports = {
  logActivity,
  getActivities
};