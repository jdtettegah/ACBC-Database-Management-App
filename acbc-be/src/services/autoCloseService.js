import { poolPromise }from ("./db");

async function autoCloseServices() {
  try {
    const pool = await poolPromise;

    await pool.request().query(`
      INSERT INTO Attendance (
        attendance_code,
        member_id,
        service_date,
        service_type,
        status,
        recorded_by
      )
      SELECT 
        CONCAT(a.service_date, '-', a.service_type, '-', m.member_code),
        m.id,
        a.service_date,
        a.service_type,
        'Absent',
        1 -- ✅ FIX: hardcoded recorded_by
      FROM (
        SELECT DISTINCT service_date, service_type
        FROM Attendance
        WHERE service_date < CAST(GETDATE() AS DATE)
      ) a
      CROSS JOIN Members m
      WHERE m.is_deleted = 0
      AND NOT EXISTS (
        SELECT 1 FROM Attendance at
        WHERE at.member_id = m.id
        AND at.service_date = a.service_date
        AND at.service_type = a.service_type
      )
    `);

    console.log("✅ Auto-close executed");

  } catch (err) {
    console.error("❌ Auto-close error:", err);
  }
}

module.exports = { autoCloseServices };