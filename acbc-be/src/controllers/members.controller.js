import pool from '../services/db.js';
import {logActivity} from "./activity.controller.js";

/**
 * 🔁 Ensure Member is in Dues Events
 */
const ensureMemberInDuesEvents = async (memberId, dateJoined) => {

  const joinDate = new Date(dateJoined);
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1;

  const events = await pool.query(
    `
    SELECT id, default_amount, event_code
    FROM welfare_events
    WHERE event_type = 'DUES'
    AND (
      CAST(SUBSTRING(event_code, 6, 4) AS INT) > $1
      OR (
        CAST(SUBSTRING(event_code, 6, 4) AS INT) = $1
        AND CAST(SUBSTRING(event_code, 11, 2) AS INT) >= $2
      )
    )
    `,
    [joinYear, joinMonth]
  );

  for (const ev of events.rows) {

    await pool.query(
      `
      INSERT INTO welfare_event_members (event_id, member_id, expected_amount)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, member_id) DO NOTHING
      `,
      [ev.id, memberId, ev.default_amount]
    );
  }
};


/**
 * ➕ CREATE MEMBER
 */
const createMember = async (req, res) => {

  const {
    member_code,
    first_name,
    last_name,
    other_names,
    gender,
    date_of_birth,
    phone,
    email,
    address,
    membership_status,
    date_joined,
    baptized,
    auxiliary_group
  } = req.body;

  if (!member_code || !first_name || !last_name || !gender || !date_of_birth || !membership_status) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  try {

    const check = await pool.query(
      `
      SELECT 1 FROM members
      WHERE member_code = $1
      `,
      [member_code]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({
        message: "Member code exists"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO members (
        member_code,
        first_name,
        last_name,
        other_names,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        membership_status,
        date_joined,
        baptized,
        auxiliary_group
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id
      `,
      [
        member_code,
        first_name,
        last_name,
        other_names || null,
        gender,
        date_of_birth,
        phone || null,
        email || null,
        address || null,
        membership_status,
        date_joined || new Date(),
        baptized ?? false,
        auxiliary_group || null
      ]
    );

    const memberId = result.rows[0].id;

    await ensureMemberInDuesEvents(memberId, date_joined);

    res.status(201).json({
      message: "Member created successfully"
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to create member"
    });
  }
};


/**
 * 📥 GET ALL MEMBERS
 */
const getMembers = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM members
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch members"
    });
  }
};


/**
 * 📥 GET MEMBER BY ID
 */
const getMemberById = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM members
      WHERE id = $1
        AND is_deleted = false
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Member not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch member"
    });
  }
};


/**
 * ✏️ UPDATE MEMBER
 */
const updateMember = async (req, res) => {

  const { id } = req.params;

  const {
    first_name,
    last_name,
    other_names,
    gender,
    date_of_birth,
    phone,
    email,
    address,
    membership_status,
    date_joined,
    baptized,
    auxiliary_group
  } = req.body;

  if (!first_name || !last_name || !gender || !date_of_birth || !membership_status) {
    return res.status(400).json({
      message: "Required fields missing"
    });
  }

  try {

    await pool.query(
      `
      UPDATE members
      SET
        first_name = $1,
        last_name = $2,
        other_names = $3,
        gender = $4,
        date_of_birth = $5,
        phone = $6,
        email = $7,
        address = $8,
        membership_status = $9,
        date_joined = $10,
        baptized = $11,
        auxiliary_group = $12,
        updated_at = NOW()
      WHERE id = $13
        AND is_deleted = false
      `,
      [
        first_name,
        last_name,
        other_names || null,
        gender,
        date_of_birth,
        phone || null,
        email || null,
        address || null,
        membership_status,
        date_joined || null,
        baptized ?? false,
        auxiliary_group || null,
        id
      ]
    );

    res.json({
      message: "Member updated successfully"
    });

    await logActivity(
      "member",
      `Member updated: ID ${id}`
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to update member"
    });
  }
};


/**
 * 🗑️ SOFT DELETE MEMBER
 */
const deleteMember = async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      `
      UPDATE members
      SET is_deleted = true,
          updated_at = NOW()
      WHERE id = $1
        AND is_deleted = false
      `,
      [id]
    );

    await pool.query(
      `
      DELETE FROM welfare_event_members
      WHERE member_id = $1
        AND total_paid = 0
      `,
      [id]
    );

    await pool.query(
      `
      UPDATE member_departments
      SET is_active = false
      WHERE member_id = $1
      `,
      [id]
    );

    res.json({
      message: "Member deleted successfully"
    });

    await logActivity(
      "member",
      `Member deleted: ID ${id}`
    );

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to delete member"
    });
  }
};

export default {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember
};