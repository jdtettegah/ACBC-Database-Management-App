import pool from '../services/db.js';
import {logActivity} from "./activity.controller.js";

/**
 * ➕ CREATE INCOME
 */
const addIncome = async (req, res) => {

  const {
    income_type,
    amount,
    source_description,
    member_id,
    recorded_by,
    date_received
  } = req.body;

  if (!income_type || !amount || !date_received || !recorded_by) {
    return res.status(400).json({
      message: 'income_type, amount, recorded_by, and date_received are required'
    });
  }

  try {

    await pool.query(
      `
      INSERT INTO income (
        income_type,
        amount,
        source_description,
        member_id,
        recorded_by,
        date_received
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        income_type,
        amount,
        source_description || null,
        member_id || null,
        recorded_by,
        date_received
      ]
    );

    res.status(201).json({
      message: 'Income recorded successfully'
    });

    await logActivity(
      "finance",
      `Income recorded: ${income_type} - GHS ${amount}`
    );

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to record income'
    });
  }
};


/**
 * 📊 GET ALL INCOME
 */
const getAllIncome = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT *
      FROM income
      ORDER BY date_received DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch income'
    });
  }
};


/**
 * 📅 GET INCOME BY DATE RANGE
 */
const getIncomeByDateRange = async (req, res) => {

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
      FROM income
      WHERE date_received BETWEEN $1 AND $2
      ORDER BY date_received DESC
      `,
      [start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch income'
    });
  }
};

/* ✏️ UPDATE INCOME */
const updateIncome = async (req, res) => {
  const { id } = req.params;

  const {
    income_type,
    amount,
    source_description,
    member_id,
    recorded_by,
    date_received
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE income
      SET
        income_type = $1,
        amount = $2,
        source_description = $3,
        member_id = $4,
        recorded_by = $5,
        date_received = $6
      WHERE id = $7
      RETURNING *
      `,
      [
        income_type,
        amount,
        source_description || null,
        member_id || null,
        recorded_by,
        date_received,
        id
      ]
    );

    res.json(result.rows[0]);

    await logActivity(
      "finance",
      `Income updated: ${income_type} - GHS ${amount}`
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update income" });
  }
};


/* 🗑 DELETE INCOME */
const deleteIncome = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM income WHERE id = $1`, [id]);

    res.json({ message: "Income deleted successfully" });

    await logActivity("finance", `Income deleted (ID: ${id})`);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete income" });
  }
};

export default {
  addIncome,
  getAllIncome,
  getIncomeByDateRange,
  updateIncome,
  deleteIncome
};