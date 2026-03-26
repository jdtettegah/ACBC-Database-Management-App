const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");


/**
 * POST /api/attendance
 * Mark attendance
 */
exports.markAttendance = async (req, res) => {
  const {
    member_id,
    service_date,
    service_type,
    status,
    recorded_by
  } = req.body;

  if (!member_id || !service_date || !service_type || !status) {
    return res.status(400).json({
      message: 'member_id, service_date, service_type and status are required'
    });
  }

  try {
    const pool = await poolPromise;

    // 1️⃣ Check member exists
    const memberCheck = await pool.request()
      .input('member_id', sql.Int, member_id)
      .query(`
        SELECT id, member_code
        FROM Members
        WHERE id = @member_id AND is_deleted = 0
      `);

    if (memberCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // 2️⃣ Prevent duplicates
    const duplicateCheck = await pool.request()
      .input('member_id', sql.Int, member_id)
      .input('service_date', sql.Date, service_date)
      .input('service_type', sql.NVarChar, service_type)
      .query(`
        SELECT id
        FROM Attendance
        WHERE member_id = @member_id
          AND service_date = @service_date
          AND service_type = @service_type
      `);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({
        message: 'Attendance already recorded for this member and service'
      });
    }

    // 3️⃣ Generate attendance code
    const memberCode = memberCheck.recordset[0].member_code;
    const attendance_code = `${service_date}-${memberCode}`;

    // 4️⃣ Insert attendance
    await pool.request()
      .input('attendance_code', sql.NVarChar, attendance_code)
      .input('member_id', sql.Int, member_id)
      .input('service_date', sql.Date, service_date)
      .input('service_type', sql.NVarChar, service_type)
      .input('status', sql.NVarChar, status)
      .input('recorded_by', sql.Int, recorded_by || null)
      .query(`
        INSERT INTO Attendance
        (attendance_code, member_id, service_date, service_type, status, recorded_by)
        VALUES
        (@attendance_code, @member_id, @service_date, @service_type, @status, @recorded_by)
      `);

    // ✅ LOG (single clean entry per request)
   

    // ✅ RESPONSE
    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance_code
    });

    await logActivity(
      "attendance",
      `Attendance recorded for ${service_type} on ${service_date}`
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to record attendance' });
  }
};


/**
 * GET /api/attendance
 */
exports.getAllAttendance = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        a.id,
        a.member_id,
        a.attendance_code,
        a.service_date,
        a.service_type,
        a.status,
        a.created_at,
        m.member_code,
        m.first_name,
        m.last_name
      FROM Attendance a
      JOIN Members m ON a.member_id = m.id
      ORDER BY a.service_date DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};


/**
 * GET /api/attendance/member/:memberId
 */
exports.getAttendanceByMember = async (req, res) => {
  const { memberId } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('member_id', sql.Int, memberId)
      .query(`
        SELECT
          a.id,
          a.member_id,
          a.attendance_code,
          a.service_date,
          a.service_type,
          a.status,
          a.created_at,
          m.member_code,
          m.first_name,
          m.last_name
        FROM Attendance a
        JOIN Members m ON a.member_id = m.id
        ORDER BY a.service_date DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};


/**
 * PUT /api/attendance/:attendanceCode
 */
exports.updateAttendance = async (req, res) => {
  try {
    const { attendanceCode } = req.params;
    const { service_date, service_type, status } = req.body;

    if (!service_date || !service_type || !status) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("attendance_code", sql.NVarChar, attendanceCode)
      .input("service_date", sql.Date, service_date)
      .input("service_type", sql.NVarChar, service_type)
      .input("status", sql.NVarChar, status)
      .query(`
        UPDATE Attendance
        SET service_date = @service_date,
            service_type = @service_type,
            status = @status
        WHERE attendance_code = @attendance_code
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        message: "Attendance record not found",
      });
    }

    // ✅ LOG UPDATE
    

    res.json({
      message: "Attendance updated successfully",
    });

    await logActivity(
      "attendance",
      `Attendance updated (${attendanceCode}) - ${status}`
    );

  } catch (error) {
    console.error("Update Attendance Error:", error);

    res.status(500).json({
      message: "Server error while updating attendance",
    });
  }
};

exports.markAttendanceBulk = async (req, res) => {
    const { service_date, service_type, recorded_by, records } = req.body;
  
    if (!service_date || !service_type || !records || records.length === 0) {
      return res.status(400).json({
        message: "Invalid data"
      });
    }
  
    try {
      const pool = await poolPromise;
  
      for (const record of records) {
        const { member_id, status } = record;
  
        // Get member
        const memberCheck = await pool.request()
          .input('member_id', sql.Int, member_id)
          .query(`
            SELECT member_code
            FROM Members
            WHERE id = @member_id AND is_deleted = 0
          `);
  
        if (memberCheck.recordset.length === 0) continue;
  
        const memberCode = memberCheck.recordset[0].member_code;
        const attendance_code = `${service_date}-${memberCode}`;
  
        // Prevent duplicates
        const duplicateCheck = await pool.request()
          .input('member_id', sql.Int, member_id)
          .input('service_date', sql.Date, service_date)
          .input('service_type', sql.NVarChar, service_type)
          .query(`
            SELECT id FROM Attendance
            WHERE member_id = @member_id
            AND service_date = @service_date
            AND service_type = @service_type
          `);
  
        if (duplicateCheck.recordset.length > 0) continue;
  
        // Insert
        await pool.request()
          .input('attendance_code', sql.NVarChar, attendance_code)
          .input('member_id', sql.Int, member_id)
          .input('service_date', sql.Date, service_date)
          .input('service_type', sql.NVarChar, service_type)
          .input('status', sql.NVarChar, status)
          .input('recorded_by', sql.Int, recorded_by || null)
          .query(`
            INSERT INTO Attendance
            (attendance_code, member_id, service_date, service_type, status, recorded_by)
            VALUES
            (@attendance_code, @member_id, @service_date, @service_type, @status, @recorded_by)
          `);
      }

      const presentCount = records.filter(r => r.status === "Present").length;
      const absentCount = records.length - presentCount;
  
      // ✅ ONE LOG ONLY
      
  
      res.json({
        message: "Attendance recorded successfully"
      });

      await logActivity(
        "attendance",
        `Attendance recorded (${service_type}) - Present: ${presentCount}, Absent: ${absentCount}`
      );
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to record attendance"
      });
    }
  };