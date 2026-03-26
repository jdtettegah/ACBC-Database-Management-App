const { poolPromise, sql } = require('../services/db');

/**
 * ASSIGN ROLE TO USER
 */
exports.assignRoleToUser = async (req, res) => {
  const { user_id, role_id } = req.body;

  if (!user_id || !role_id) {
    return res.status(400).json({
      message: 'user_id and role_id are required'
    });
  }

  try {
    const pool = await poolPromise;

    // Check if user exists
    const userCheck = await pool.request()
      .input('user_id', sql.Int, user_id)
      .query(`
        SELECT id
        FROM Users
        WHERE id = @user_id
      `);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if role exists
    const roleCheck = await pool.request()
      .input('role_id', sql.Int, role_id)
      .query(`
        SELECT id
        FROM Roles
        WHERE id = @role_id
      `);

    if (roleCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Prevent duplicate
    const duplicateCheck = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('role_id', sql.Int, role_id)
      .query(`
        SELECT id
        FROM UserRoles
        WHERE user_id = @user_id
          AND role_id = @role_id
      `);

    if (duplicateCheck.recordset.length > 0) {
      return res.status(409).json({
        message: 'Role already assigned to this user'
      });
    }

    // Assign role
    await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('role_id', sql.Int, role_id)
      .query(`
        INSERT INTO UserRoles (user_id, role_id, assigned_at)
        VALUES (@user_id, @role_id, GETDATE())
      `);

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
exports.getRolesByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('user_id', sql.Int, userId)
      .query(`
        SELECT 
          r.id AS role_id,
          r.name AS role_name,
          ur.assigned_at
        FROM UserRoles ur
        JOIN Roles r ON ur.role_id = r.id
        WHERE ur.user_id = @user_id
        ORDER BY ur.assigned_at DESC
      `);

    res.json(result.recordset);

  } catch (error) {

    console.error('Get User Roles Error:', error);

    res.status(500).json({
      message: 'Failed to fetch user roles'
    });
  }
};


/**
 * GET APPROVERS (FROM DB)
 */

exports.getApprovers = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT DISTINCT
        ur.user_id,
        r.id   AS role_id,
        r.name AS role_name
      FROM UserRoles ur
      JOIN Roles r ON ur.role_id = r.id
      WHERE r.name IN (
        'Pastor',
        'Financial Secretary',
        'Admin'
      )
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Get Approvers Error:', error);

    res.status(500).json({
      message: 'Failed to fetch approvers'
    });
  }
};