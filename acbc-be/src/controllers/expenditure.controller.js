import pool from '../services/db.js';
import {logActivity} from "./activity.controller.js";

/**
 * ➕ CREATE EXPENDITURE
 */
const addExpenditure = async (req, res) => {

  const {
    category,
    amount,
    description,
    approved_by,
    recorded_by,
    date_spent
  } = req.body;

  if (!category || !amount || !date_spent || !approved_by) {
    return res.status(400).json({
      message: 'Category, amount, date_spent and approver are required'
    });
  }

  try {

    await pool.query(
      `
      INSERT INTO expenditure (
        category,
        amount,
        description,
        approved_by,
        recorded_by,
        date_spent
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        category,
        amount,
        description || null,
        approved_by,
        recorded_by || null,
        date_spent
      ]
    );

    await logActivity(
      "finance",
      `Expense recorded: ${category} - GHS ${amount}`
    );

    res.status(201).json({
      message: 'Expenditure recorded successfully'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to record expenditure'
    });
  }
};


/**
 * 📊 GET ALL EXPENDITURE
 */
const getAllExpenditure = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM expenditure
      ORDER BY date_spent DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch expenditure'
    });
  }
};


/**
 * 📅 GET EXPENDITURE BY DATE RANGE
 */
const getExpenditureByDateRange = async (req, res) => {

  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({
      message: 'Start and end dates are required'
    });
  }

  try {

    const result = await pool.query(
      `
      SELECT *
      FROM expenditure
      WHERE date_spent BETWEEN $1 AND $2
      ORDER BY date_spent DESC
      `,
      [start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch expenditure'
    });
  }
};

/* ✏️ UPDATE EXPENDITURE */
const updateExpenditure = async (req, res) => {
  const { id } = req.params;

  const {
    category,
    amount,
    description,
    approved_by,
    recorded_by,
    date_spent
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE expenditure
      SET
        category = $1,
        amount = $2,
        description = $3,
        approved_by = $4,
        recorded_by = $5,
        date_spent = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        category,
        amount,
        description || null,
        approved_by,
        recorded_by || null,
        date_spent,
        id
      ]
    );

    res.json(result.rows[0]);

    await logActivity(
      "finance",
      `Expense updated: ${category} - GHS ${amount}`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update expenditure" });
  }
};


/* 🗑 DELETE EXPENDITURE */
const deleteExpenditure = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM expenditure WHERE id = $1`, [id]);

    res.json({ message: "Expenditure deleted successfully" });

    await logActivity("finance", `Expense deleted (ID: ${id})`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete expenditure" });
  }
};



export default {
  addExpenditure,
  getAllExpenditure,
  getExpenditureByDateRange,
  updateExpenditure,
  deleteExpenditure
};