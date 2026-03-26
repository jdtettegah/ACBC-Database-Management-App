const sql = require('mssql');
const db = require('../services/db');

/**
 * CREATE ROLE
 * POST /api/roles
 */
exports.createRole = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Role name is required' });
  }

  try {
    const pool = await db.getConnection();

    await pool.request()
      .input('name', sql.VarChar, name)
      .input('description', sql.VarChar, description || null)
      .query(`
        INSERT INTO Roles (name, description, created_at)
        VALUES (@name, @description, GETDATE())
      `);

    res.status(201).json({ message: 'Role created successfully' });

  } catch (error) {
    console.error('Create Role Error:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

/**
 * GET ALL ROLES
 * GET /api/roles
 */
exports.getRoles = async (req, res) => {
  try {
    const pool = await db.getConnection();

    const result = await pool.request().query(`
      SELECT 
        id,
        name,
        description,
        created_at
      FROM Roles
      ORDER BY name
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};
