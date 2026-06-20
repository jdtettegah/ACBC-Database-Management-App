import pool from "../services/db.js";
import {logActivity} from "./activity.controller.js";

const VALID_SERVICES = ["Sunday Service", "Midweek Service"];

/* ================= MARK ATTENDANCE ================= */
const markAttendance = async (req, res) => {
  const {
    member_id,
    service_date,
    service_type,
    status,
    recorded_by
  } = req.body;

  if (!member_id || !service_date || !service_type || !status) {
    return res.status(400).json({
      message: "member_id, service_date, service_type and status are required"
    });
  }

  if (!VALID_SERVICES.includes(service_type)) {
    return res.status(400).json({
      message: "Invalid service type"
    });
  }

  try {
    const memberCheck = await pool.query(
      `
      SELECT id, member_code
      FROM "Members"
      WHERE id = $1 AND is_deleted = false
      `,
      [member_id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const duplicateCheck = await pool.query(
      `
      SELECT id
      FROM "attendance"
      WHERE member_id = $1
        AND service_date = $2::date
        AND service_type = $3
      `,
      [member_id, service_date, service_type]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "Attendance already recorded"
      });
    }

    const memberCode = memberCheck.rows[0].member_code;

    const attendance_code = `${service_date}-${service_type}-${memberCode}`;

    await pool.query(
      `
      INSERT INTO "attendance"
      (
        attendance_code,
        member_id,
        service_date,
        service_type,
        status,
        recorded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        attendance_code,
        member_id,
        service_date,
        service_type,
        status,
        recorded_by || null
      ]
    );

    await logActivity(
      "attendance",
      `Attendance recorded for ${service_type} on ${service_date}`
    );

    return res.status(201).json({
      message: "Attendance recorded successfully",
      attendance_code
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to record attendance"
    });
  }
};


/* ================= GET ALL ================= */
/* ================= GET ALL ================= */
const getAllAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const {
      page = 1,
      limit = 50,
      search = "",
      service = "All",
      status = "All",
      type = "All",
      date = today,
      export: isExport
    } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const offset = (pageNumber - 1) * pageLimit;

    let filters = [];
    let values = [];
    let i = 1;

    if (search) {
      filters.push(`
        (
          first_name ILIKE $${i}
          OR last_name ILIKE $${i}
          OR member_code ILIKE $${i}
        )
      `);
      values.push(`%${search}%`);
      i++;
    }

    if (date) {
      filters.push(`service_date::date = $${i}::date`);
      values.push(date);
      i++;
    }

    if (service !== "All") {
      filters.push(`service_type = $${i}`);
      values.push(service);
      i++;
    }

    if (status !== "All") {
      filters.push(`status = $${i}`);
      values.push(status);
      i++;
    }

    if (type !== "All") {
      filters.push(`type ILIKE $${i}`);
      values.push(type);
      i++;
    }

    const whereClause =
      filters.length > 0
        ? `WHERE ${filters.join(" AND ")}`
        : "";

    const baseQuery = `
      SELECT *
      FROM (

        SELECT
          a.id,
          a.attendance_code,
          m.first_name,
          m.last_name,
          m.member_code,
          a.service_date,
          a.service_type,
          a.status,
          'members' AS type
        FROM "attendance" a
        JOIN "members" m
          ON a.member_id = m.id

        UNION ALL

        SELECT
          v.id,
          'visitor' AS attendance_code,
          v.first_name,
          v.last_name,
          'Visitor' AS member_code,
          v.visit_date AS service_date,
          v.service_type,
          'Visitor' AS status,
          'visitors' AS type
        FROM "visitors" v

      ) combined
      ${whereClause}
    `;

    /* ================= COUNT ================= */

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM (
        ${baseQuery}
      ) count_query
      `,
      values
    );

    const total = countResult.rows[0].total;

    /* ================= DATA ================= */

    let dataQuery = `
      ${baseQuery}
      ORDER BY service_date DESC
    `;

    let dataValues = [...values];

    if (!isExport) {
      dataQuery += `
        LIMIT $${i}
        OFFSET $${i + 1}
      `;

      dataValues.push(pageLimit, offset);
    }

    const result = await pool.query(
      dataQuery,
      dataValues
    );

    return res.status(200).json({
      data: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit)
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Failed to fetch attendance"
    });
  }
};

/* ================= GET BY MEMBER ================= */
const getAttendanceByMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM "attendance"
      WHERE member_id = $1
      ORDER BY service_date DESC
      `,
      [memberId]
    );

    return res.json(result.rows);

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Failed to fetch attendance"
    });
  }
};


/* ================= UPDATE ================= */
const updateAttendance = async (req, res) => {
  try {
    const { attendanceCode } = req.params;
    const { service_date, service_type, status } = req.body;

    if (!service_date || !service_type || !status) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!VALID_SERVICES.includes(service_type)) {
      return res.status(400).json({
        message: "Invalid service type"
      });
    }

    const result = await pool.query(
      `
      UPDATE "attendance"
      SET service_date = $1,
          service_type = $2,
          status = $3
      WHERE attendance_code = $4
      `,
      [service_date, service_type, status, attendanceCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Attendance not found"
      });
    }

    await logActivity(
      "attendance",
      `Attendance updated (${attendanceCode})`
    );

    return res.json({
      message: "Updated successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Update failed"
    });
  }
};


/* ================= BULK ================= */
const markAttendanceBulk = async (req, res) => {
  const {
    service_date,
    service_type,
    recorded_by,
    records = []
  } = req.body;

  try {
    const membersResult = await pool.query(`
      SELECT id, member_code
      FROM "members"
      WHERE is_deleted = false
    `);

    const presentMap = new Map(records.map(r => [r.member_id, true]));

    let presentCount = 0;
    let absentCount = 0;

    for (const member of membersResult.rows) {
      const isPresent = presentMap.has(member.id);
      const status = isPresent ? "Present" : "Absent";

      const attendance_code =
        `${service_date}-${service_type}-${member.member_code}`;

      const exists = await pool.query(
        `
        SELECT id FROM "attendance"
        WHERE member_id = $1
          AND service_date = $2::date
          AND service_type = $3
        `,
        [member.id, service_date, service_type]
      );

      if (exists.rows.length > 0) continue;

      await pool.query(
        `
        INSERT INTO "attendance"
        (
          attendance_code,
          member_id,
          service_date,
          service_type,
          status,
          recorded_by
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          attendance_code,
          member.id,
          service_date,
          service_type,
          status,
          recorded_by || null
        ]
      );

      isPresent ? presentCount++ : absentCount++;
    }

    return res.json({
      message: "Bulk attendance completed",
      presentCount,
      absentCount
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Bulk attendance failed"
    });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    // =========================
    // TODAY + MONTH RANGE
    // =========================
    const todayQuery = `
      SELECT CURRENT_DATE as today,
             DATE_TRUNC('month', CURRENT_DATE) as start_month,
             (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day') as end_month
    `;

    const dateRes = await pool.query(todayQuery);
    const { today, start_month, end_month } = dateRes.rows[0];

    // =========================
    // 🔥 PRESENT TODAY
    // =========================
    const presentTodayQuery = `
      SELECT COUNT(*)::int AS count
      FROM "attendance"
      WHERE service_date = $1
      AND status = 'Present'
    `;

    const presentTodayRes = await pool.query(presentTodayQuery, [today]);

    // =========================
    // 🔥 VISITORS TODAY
    // =========================
    const visitorsTodayQuery = `
      SELECT COUNT(*)::int AS count
      FROM "visitors"
      WHERE visit_date = $1
    `;

    const visitorsTodayRes = await pool.query(visitorsTodayQuery, [today]);

    // =========================
    // 🔥 VISITORS THIS MONTH
    // =========================
    const visitorsMonthQuery = `
      SELECT COUNT(*)::int AS count
      FROM "visitors"
      WHERE visit_date BETWEEN $1 AND $2
    `;

    const visitorsMonthRes = await pool.query(
      visitorsMonthQuery,
      [start_month, end_month]
    );

    // =========================
    // 🔥 AVG ATTENDANCE (PER DAY)
    // =========================
    const avgQuery = `
      SELECT
        ROUND(AVG(daily_count))::int AS avg_attendance
      FROM (
        SELECT service_date, COUNT(*) as daily_count
        FROM "attendance"
        WHERE service_date BETWEEN $1 AND $2 AND status = 'Present'
        GROUP BY service_date
      ) sub
    `;

    const avgRes = await pool.query(avgQuery, [start_month, end_month]);

    // =========================
    // RESPONSE
    // =========================
    res.json({
      presentToday: presentTodayRes.rows[0].count,
      visitorsToday: visitorsTodayRes.rows[0].count,
      visitorsThisMonth: visitorsMonthRes.rows[0].count,
      averageAttendance: avgRes.rows[0].avg_attendance || 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch stats"
    });
  }
};


/* ================= EXPORT ================= */
export default {
  markAttendance,
  getAllAttendance,
  getAttendanceByMember,
  updateAttendance,
  markAttendanceBulk,
  getAttendanceStats
};