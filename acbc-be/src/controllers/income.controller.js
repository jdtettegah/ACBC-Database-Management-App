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

export default {
  addIncome,
  getAllIncome,
  getIncomeByDateRange
};