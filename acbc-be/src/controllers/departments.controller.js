import pool from '../services/db.js';
import logActivity from "./activity.controller.js";

/**
 * CREATE DEPARTMENT
 */
const createDepartment = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {

    await pool.query(
      `
      INSERT INTO departments (name, description, is_active)
      VALUES ($1, $2, true)
      `,
      [name, description || null]
    );

    res.status(201).json({
      message: 'Department created successfully'
    });

    await logActivity(
      "department",
      `Department created: ${name}`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create department'
    });
  }
};


/**
 * GET ALL DEPARTMENTS
 */
const getAllDepartments = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.is_active,
        d.created_at,
        COUNT(md.id) AS member_count
      FROM departments d
      LEFT JOIN member_departments md
        ON d.id = md.department_id
        AND md.is_active = true
      WHERE d.is_active = true
      GROUP BY 
        d.id,
        d.name,
        d.description,
        d.is_active,
        d.created_at
      ORDER BY d.name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch departments'
    });
  }
};


/**
 * GET DEPARTMENT BY ID
 */
const getDepartmentById = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT id, name, description, is_active, created_at
      FROM departments
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to fetch department'
    });
  }
};


/**
 * UPDATE DEPARTMENT
 */
const updateDepartment = async (req, res) => {

  const { id } = req.params;
  const { name, description, is_active } = req.body;

  try {

    const result = await pool.query(
      `
      UPDATE departments
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        is_active = COALESCE($3, is_active)
      WHERE id = $4
      `,
      [
        name || null,
        description || null,
        is_active,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }

    res.json({
      message: 'Department updated successfully'
    });

    await logActivity(
      "department",
      `Department updated (ID: ${id})`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to update department'
    });
  }
};


/**
 * SOFT DELETE DEPARTMENT
 */
const deleteDepartment = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      UPDATE departments
      SET is_active = false
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Department not found'
      });
    }

    res.json({
      message: 'Department deactivated successfully'
    });

    await logActivity(
      "department",
      `Department deactivated (ID: ${id})`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to delete department'
    });
  }
};

export default {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment
};