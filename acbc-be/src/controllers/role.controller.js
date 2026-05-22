import pool from '../services/db.js';

/**
 * CREATE ROLE
 * POST /api/roles
 */
const createRole = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Role name is required' });
  }

  try {
    await pool.query(
      `
      INSERT INTO roles (name, description, created_at)
      VALUES ($1, $2, NOW())
      `,
      [name, description || null]
    );

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
const getRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        created_at
      FROM roles
      ORDER BY name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Get Roles Error:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

export default { createRole, getRoles };