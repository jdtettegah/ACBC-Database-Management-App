const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");

// ✅ Allowed service types
const VALID_SERVICES = ["Sunday Service", "Midweek Service"];

/**
 * POST /api/attendance
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

  // ✅ Validate service type
  if (!VALID_SERVICES.includes(service_type)) {
    return res.status(400).json({
      message: "Invalid service type"
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

    // 3️⃣ Generate safer attendance code
    const memberCode = memberCheck.recordset[0].member_code;
    const attendance_code = `${service_date}-${service_type}-${memberCode}`;

    // 4️⃣ Insert
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

    res.status(201).json({
      message: 'Attendance recorded successfully',
      data: {
        attendance_code,
        member_id,
        service_date,
        service_type,
        status
      }
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
    const {
      page = 1,
      limit = 50,
      search = "",
      type = "All",
      service = "All",
      date = "",
      status = "All",        // ✅ NEW
      export: isExport       // ✅ NEW
    } = req.query;

    const offset = (page - 1) * limit;
    const pool = await poolPromise;

    // ⚠️ IMPORTANT: separate request objects (fixes hidden bugs)
    const dataRequest = pool.request();
    const countRequest = pool.request();

    let filters = "";

    // 🔍 SEARCH
    if (search) {
      filters += `
        AND (
          first_name LIKE @search OR last_name LIKE @search
        )
      `;
      dataRequest.input("search", sql.NVarChar, `%${search}%`);
      countRequest.input("search", sql.NVarChar, `%${search}%`);
    }

    // 📅 DATE
    if (date) {
      filters += ` AND CAST(service_date AS DATE) = @date`;
      dataRequest.input("date", sql.Date, date);
      countRequest.input("date", sql.Date, date);
    }

    // ⛪ SERVICE
    if (service !== "All") {
      filters += ` AND service_type = @service`;
      dataRequest.input("service", sql.NVarChar, service);
      countRequest.input("service", sql.NVarChar, service);
    }

    // ✅ STATUS FILTER (Members only)
    if (status !== "All") {
      filters += ` AND status = @status AND type = 'Member'`;
      dataRequest.input("status", sql.NVarChar, status);
      countRequest.input("status", sql.NVarChar, status);
    }

    // 👥 TYPE FILTER
    let typeFilter = "";
    if (type === "Member") typeFilter = `WHERE type = 'Member'`;
    if (type === "Visitor") typeFilter = `WHERE type = 'Visitor'`;

    // =========================
    // 🔥 MAIN DATA QUERY
    // =========================
    let mainQuery = `
      SELECT *
      FROM (
        -- MEMBERS
        SELECT
          a.id,
          a.attendance_code,
          m.first_name,
          m.last_name,
          m.member_code,
          a.service_date,
          a.service_type,
          a.status,
          'Member' AS type
        FROM Attendance a
        JOIN Members m ON a.member_id = m.id

        UNION ALL

        -- VISITORS
        SELECT
          v.id,
          'VISITOR' AS attendance_code,
          v.first_name,
          v.last_name,
          'Visitor' AS member_code,
          v.visit_date AS service_date,
          v.service_type,
          'Visitor' AS status,
          'Visitor' AS type
        FROM Visitors v
      ) AS combined
      ${typeFilter || "WHERE 1=1"}
      ${filters}
      ORDER BY service_date DESC
    `;

    // ✅ ONLY paginate if NOT export
    if (!isExport) {
      mainQuery += `
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;

      dataRequest.input("offset", sql.Int, offset);
      dataRequest.input("limit", sql.Int, limit);
    }

    const result = await dataRequest.query(mainQuery);

    // =========================
    // 📤 EXPORT MODE (NO PAGINATION RESPONSE)
    // =========================
    if (isExport === "true") {
      return res.json({
        data: result.recordset
      });
    }

    // =========================
    // 🔢 COUNT QUERY
    // =========================
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total
      FROM (
        SELECT m.first_name, m.last_name, a.service_date, a.service_type, a.status, 'Member' AS type
        FROM Attendance a
        JOIN Members m ON a.member_id = m.id

        UNION ALL

        SELECT v.first_name, v.last_name, v.visit_date, v.service_type, 'Visitor' AS status, 'Visitor' AS type
        FROM Visitors v
      ) AS combined
      ${typeFilter || "WHERE 1=1"}
      ${filters}
    `);

    const total = countResult.recordset[0].total;

    res.json({
      data: result.recordset,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch attendance",
    });
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
        WHERE a.member_id = @member_id   -- ✅ FIXED
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

    // ✅ Validate service type
    if (!VALID_SERVICES.includes(service_type)) {
      return res.status(400).json({
        message: "Invalid service type"
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

    res.json({
      message: "Attendance updated successfully",
      attendance_code: attendanceCode
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

/**
 * POST /api/attendance/bulk
 */
exports.markAttendanceBulk = async (req, res) => {
  const { service_date, service_type, recorded_by, records } = req.body;

  if (!service_date || !service_type || !records || records.length === 0) {
    return res.status(400).json({
      message: "Invalid data"
    });
  }

  // ✅ Validate service type
  if (!VALID_SERVICES.includes(service_type)) {
    return res.status(400).json({
      message: "Invalid service type"
    });
  }

  try {
    const pool = await poolPromise;

    for (const record of records) {
      const { member_id, status } = record;

      const memberCheck = await pool.request()
        .input('member_id', sql.Int, member_id)
        .query(`
          SELECT member_code
          FROM Members
          WHERE id = @member_id AND is_deleted = 0
        `);

      if (memberCheck.recordset.length === 0) continue;

      const memberCode = memberCheck.recordset[0].member_code;
      const attendance_code = `${service_date}-${service_type}-${memberCode}`;

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