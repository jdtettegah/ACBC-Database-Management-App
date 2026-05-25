import pool from '../services/db.js';
import { logActivity } from "./activity.controller.js";

/**
 * ➕ ASSIGN MEMBER TO DEPARTMENT
 */
const assignMemberToDepartment = async (req, res) => {
  const {
    member_id,
    department_id,
    date_joined,
    is_active,
    created_at,
    member_code
  } = req.body;

  if (!member_id || !department_id) {
    return res.status(400).json({
      message: "member_id and department_id are required"
    });
  }

  try {
    // Prevent duplicates
    const check = await pool.query(
      `
      SELECT id
      FROM member_departments
      WHERE member_id = $1
        AND member_code = $2
        AND department_id = $3
        AND is_active = true
      `,
      [member_id, member_code, department_id]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({
        message: "Member already assigned"
      });
    }

    await pool.query(
      `
      INSERT INTO member_departments (
        member_id,
        department_id,
        date_joined,
        is_active,
        created_at,
        member_code
      )
      VALUES ($1, $2, $3, true, $4, $5)
      `,
      [
        member_id,
        department_id,
        date_joined || new Date(),
        created_at || new Date(), // ✅ FIXED
        member_code               // ✅ FIXED
      ]
    );

    res.status(201).json({
      message: "Assigned successfully"
    });

    await logActivity(
      "department",
      `Member assigned to department (Member ID: ${member_id}, Dept ID: ${department_id})`
    );

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to assign"
    });
  }
};

/**
 * 📥 GET MEMBERS BY DEPARTMENT
 */
const getMembersByDepartment = async (req, res) => {

  const { deptId } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        md.id AS member_department_id,
        m.id AS member_id,
        m.member_code,
        m.first_name,
        m.last_name,
        m.other_names,
        m.phone
      FROM member_departments md
      JOIN members m ON md.member_id = m.id
      WHERE md.department_id = $1
        AND md.is_active = true
      ORDER BY m.first_name
      `,
      [deptId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch members"
    });
  }
};


/**
 * ❌ REMOVE MEMBER FROM DEPARTMENT
 */
const removeMemberFromDepartment = async (req, res) => {

  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "id is required"
    });
  }

  try {

    const result = await pool.query(
      `
      DELETE FROM member_departments
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Assignment not found or already removed"
      });
    }

    res.json({
      message: "Removed successfully"
    });

    await logActivity(
      "department",
      `Member removed from department (Assignment ID: ${id})`
    );

  } catch (err) {
    console.error("Remove error:", err);

    res.status(500).json({
      message: "Failed to remove"
    });
  }
};


/**
 * 📥 GET DEPARTMENTS BY MEMBER
 */
const getDepartmentsByMember = async (req, res) => {

  const { member_id } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        md.id,
        m.member_code,
        m.first_name,
        m.last_name,
        m.phone,
        d.id AS department_id,
        d.name AS department,
        d.description
      FROM member_departments md
      JOIN departments d ON md.department_id = d.id
      JOIN members m ON md.member_id = m.id
      WHERE md.member_id = $1
        AND md.is_active = true
      `,
      [member_id]
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to fetch member departments"
    });
  }
};


/**
 * 🔄 REASSIGN MEMBER (TRANSACTION)
 */
const reassignMember = async (req, res) => {

  const {
    member_id,
    member_code,
    old_department_id,
    new_department_id,
    date_joined
  } = req.body;

  if (!member_id || !old_department_id || !new_department_id) {
    return res.status(400).json({
      message: "member_id, old_department_id, new_department_id are required"
    });
  }

  if (old_department_id === new_department_id) {
    return res.status(400).json({
      message: "Cannot reassign to same department"
    });
  }

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    // 1️⃣ deactivate old
    await client.query(
      `
      UPDATE member_departments
      SET is_active = false
      WHERE member_id = $1
        AND department_id = $2
        AND is_active = true
      `,
      [member_id, old_department_id]
    );

    // 2️⃣ check duplicate in new dept
    const check = await client.query(
      `
      SELECT id
      FROM member_departments
      WHERE member_id = $1
        AND department_id = $2
        AND is_active = true
      `,
      [member_id, new_department_id]
    );

    if (check.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Member already in this department"
      });
    }

    // 3️⃣ insert new
    await client.query(
      `
      INSERT INTO member_departments (
        member_id,
        member_code,
        department_id,
        date_joined,
        is_active
      )
      VALUES ($1, $2, $3, $4, true)
      `,
      [
        member_id,
        member_code,
        new_department_id,
        date_joined || new Date()
      ]
    );

    await client.query("COMMIT");

    res.json({
      message: "Reassigned successfully"
    });

    await logActivity(
      "department",
      `Member reassigned (Member ID: ${member_id} from ${old_department_id} to ${new_department_id})`
    );

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("Reassign error:", err);

    res.status(500).json({
      message: "Failed to reassign"
    });

  } finally {
    client.release();
  }
};

export default {
  assignMemberToDepartment,
  getMembersByDepartment,
  removeMemberFromDepartment,
  getDepartmentsByMember,
  reassignMember
};