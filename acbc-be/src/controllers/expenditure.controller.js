import pool from '../services/db.js';
import { logActivity } from "./activity.controller.js";

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
    date_spent,
    fund_id
  } = req.body;

  if (!category || !amount || !date_spent || !approved_by || !fund_id) {
    return res.status(400).json({
      message: "Category, amount, date_spent, approver and fund are required"
    });
  }

  try {

    const fundCheck = await pool.query(
      `
      SELECT id, fund_name
      FROM funds
      WHERE id = $1
        AND is_active = TRUE
      `,
      [fund_id]
    );

    if (fundCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or inactive fund"
      });
    }

    const result = await pool.query(
      `
      INSERT INTO expenditure (
        category,
        amount,
        description,
        approved_by,
        recorded_by,
        date_spent,
        fund_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        category,
        amount,
        description || null,
        approved_by,
        recorded_by || null,
        date_spent,
        fund_id
      ]
    );

    await logActivity(
      "finance",
      `Expense recorded: ${category} - GHS ${amount} (${fundCheck.rows[0].fund_name})`
    );

    res.status(201).json({
      message: "Expenditure recorded successfully",
      expenditure: result.rows[0]
    });

  } catch (error) {
    console.error("ADD EXPENDITURE ERROR:", error);

    res.status(500).json({
      message: "Failed to record expenditure"
    });
  }
};


/**
 * 📊 GET ALL EXPENDITURE
 */
const getAllExpenditure = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        e.*,
        f.fund_code,
        f.fund_name
      FROM expenditure e
      JOIN funds f
        ON e.fund_id = f.id
      ORDER BY e.date_spent DESC
    `);

    res.json(result.rows);

  } catch (error) {

    console.error("GET EXPENDITURE ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch expenditure"
    });
  }
};


/**
 * 💰 GET EXPENDITURE BY FUND
 *
 * Example:
 * GET /api/expenditure/fund/YOUTH
 */
const getExpenditureByFund = async (req, res) => {

  const { fundCode } = req.params;

  if (!fundCode) {
    return res.status(400).json({
      message: "Fund code is required"
    });
  }

  try {

    const result = await pool.query(
      `
      SELECT
        e.*,
        f.fund_code,
        f.fund_name
      FROM expenditure e
      JOIN funds f
        ON e.fund_id = f.id
      WHERE f.fund_code = $1
      ORDER BY e.date_spent DESC
      `,
      [fundCode]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("GET EXPENDITURE BY FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch expenditure for fund"
    });
  }
};


/**
 * 📅 GET EXPENDITURE BY FUND AND DATE RANGE
 *
 * Example:
 * GET /api/expenditure/fund/YOUTH/range?start=2026-08-01&end=2026-08-31
 */
const getExpenditureByFundAndDateRange = async (req, res) => {

  const { fundCode } = req.params;
  const { start, end } = req.query;

  if (!fundCode) {
    return res.status(400).json({
      message: "Fund code is required"
    });
  }

  if (!start || !end) {
    return res.status(400).json({
      message: "Start and end dates are required"
    });
  }

  try {

    const result = await pool.query(
      `
      SELECT
        e.*,
        f.fund_code,
        f.fund_name
      FROM expenditure e
      JOIN funds f
        ON e.fund_id = f.id
      WHERE f.fund_code = $1
        AND e.date_spent BETWEEN $2 AND $3
      ORDER BY e.date_spent DESC
      `,
      [fundCode, start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(
      "FUND DATE RANGE EXPENDITURE ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch expenditure"
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
      message: "Start and end dates are required"
    });
  }

  try {

    const result = await pool.query(
      `
      SELECT
        e.*,
        f.fund_code,
        f.fund_name
      FROM expenditure e
      JOIN funds f
        ON e.fund_id = f.id
      WHERE e.date_spent BETWEEN $1 AND $2
      ORDER BY e.date_spent DESC
      `,
      [start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("DATE RANGE EXPENDITURE ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch expenditure"
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
    date_spent,
    fund_id
  } = req.body;

  if (!fund_id) {
    return res.status(400).json({
      message: "Fund is required"
    });
  }

  try {

    const fundCheck = await pool.query(
      `
      SELECT id
      FROM funds
      WHERE id = $1
        AND is_active = TRUE
      `,
      [fund_id]
    );

    if (fundCheck.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or inactive fund"
      });
    }

    const result = await pool.query(
      `
      UPDATE expenditure
      SET
        category = $1,
        amount = $2,
        description = $3,
        approved_by = $4,
        recorded_by = $5,
        date_spent = $6,
        fund_id = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        category,
        amount,
        description || null,
        approved_by,
        recorded_by,
        date_spent,
        fund_id,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expenditure not found"
      });
    }

    await logActivity(
      "finance",
      `Expense updated: ${category} - GHS ${amount}`
    );

    res.json(result.rows[0]);

  } catch (error) {

    console.error("UPDATE EXPENDITURE ERROR:", error);

    res.status(500).json({
      message: "Failed to update expenditure"
    });
  }
};


/* 🗑 DELETE EXPENDITURE */

const deleteExpenditure = async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      `
      DELETE FROM expenditure
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Expenditure not found"
      });
    }

    await logActivity(
      "finance",
      `Expense deleted (ID: ${id})`
    );

    res.json({
      message: "Expenditure deleted successfully"
    });

  } catch (error) {

    console.error("DELETE EXPENDITURE ERROR:", error);

    res.status(500).json({
      message: "Failed to delete expenditure"
    });
  }
};


export default {
  addExpenditure,
  getAllExpenditure,
  getExpenditureByFund,
  getExpenditureByFundAndDateRange,
  getExpenditureByDateRange,
  updateExpenditure,
  deleteExpenditure
};