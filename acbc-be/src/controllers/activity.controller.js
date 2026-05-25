import pool from "../services/db.js";

/**
 * ➕ Log Activity
 */
const logActivity = async (activity_type, description, reference_id = null) => {
  try {
    await pool.query(
      `
      INSERT INTO activity_log
      (activity_type, description, reference_id)
      VALUES ($1, $2, $3)
      `,
      [activity_type, description, reference_id]
    );
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
    const result = await pool.query(
      `
      SELECT
        id,
        activity_type,
        description,
        created_at
      FROM activity_log
      ORDER BY created_at DESC
      LIMIT 10
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Get Activity Error:", err);

    res.status(500).json({
      message: "Failed to fetch activities"
    });
  }
};

export {
  logActivity,
  getActivities
};