import pool from '../services/db.js';

/**
 * ASSIGN ROLE TO USER
 */
const assignRoleToUser = async (req, res) => {
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({ message: 'user_id and role_id are required' });
  }

  try {
    const userCheck = await pool.query(
      `SELECT id FROM users WHERE id = $1`,
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleCheck = await pool.query(
      `SELECT id FROM roles WHERE id = $1`,
      [role_id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const duplicateCheck = await pool.query(
      `SELECT id FROM user_roles WHERE user_id = $1 AND role_id = $2`,
      [user_id, role_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: 'Role already assigned to this user'
      });
    }

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at)
       VALUES ($1, $2, NOW())`,
      [user_id, role_id]
    );

    res.status(201).json({
      message: 'Role assigned to user successfully'
    });

  } catch (error) {
    console.error('Assign Role Error:', error);
    res.status(500).json({
      message: 'Failed to assign role to user'
    });
  }
};

/**
 * GET ROLES BY USER
 */
const getRolesByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
         r.id AS role_id,
         r.name AS role_name,
         ur.assigned_at
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1
       ORDER BY ur.assigned_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get User Roles Error:', error);
    res.status(500).json({
      message: 'Failed to fetch user roles'
    });
  }
};

/**
 * GET APPROVERS
 */
const getApprovers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        ur.user_id,
        r.id AS role_id,
        r.name AS role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('Pastor', 'Financial Secretary', 'Admin')
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Get Approvers Error:', error);
    res.status(500).json({
      message: 'Failed to fetch approvers'
    });
  }
};

export default { assignRoleToUser, getRolesByUser, getApprovers };