import pool from '../services/db.js';
import { logActivity } from "./activity.controller.js";

/* ================= ADD ================= */

const addIncome = async (req, res) => {
  const {
    income_type,
    amount,
    source_description,
    member_id,
    recorded_by,
    date_received,
    fund_id
  } = req.body;

  if (income_type === "Tithe") {
    return res.status(403).json({
      message: "Tithe must be created from Tithes module"
    });
  }

  if (!income_type || !amount || !date_received || !recorded_by || !fund_id) {
    return res.status(400).json({
      message: "Income type, amount, date, recorded_by and fund are required"
    });
  }

  try {
    // Verify fund exists and is active
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
      INSERT INTO income (
        income_type,
        amount,
        source_description,
        member_id,
        recorded_by,
        date_received,
        fund_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        income_type,
        amount,
        source_description || null,
        member_id || null,
        recorded_by,
        date_received,
        fund_id
      ]
    );

    await logActivity(
      "finance",
      `Income recorded: ${income_type} - GHS ${amount} (${fundCheck.rows[0].fund_name})`
    );

    res.status(201).json({
      message: "Income added",
      income: result.rows[0]
    });

  } catch (error) {
    console.error("ADD INCOME ERROR:", error);

    res.status(500).json({
      message: "Error adding income"
    });
  }
};


/* ================= GET ================= */

const getAllIncome = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.*,
        f.fund_code,
        f.fund_name
      FROM income i
      JOIN funds f
        ON i.fund_id = f.id
      ORDER BY i.date_received DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("GET INCOME ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch income"
    });
  }
};


/* ================= UPDATE ================= */

const updateIncome = async (req, res) => {
  const { id } = req.params;

  const {
    income_type,
    amount,
    source_description,
    member_id,
    recorded_by,
    date_received,
    fund_id
  } = req.body;

  try {
    const check = await pool.query(
      `
      SELECT income_type
      FROM income
      WHERE id = $1
      `,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({
        message: "Income not found"
      });
    }

    if (check.rows[0].income_type === "Tithe") {
      return res.status(403).json({
        message: "Edit tithe from Tithe module"
      });
    }

    if (!fund_id) {
      return res.status(400).json({
        message: "Fund is required"
      });
    }

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
      UPDATE income
      SET
        income_type = $1,
        amount = $2,
        source_description = $3,
        member_id = $4,
        recorded_by = $5,
        date_received = $6,
        fund_id = $7
      WHERE id = $8
      RETURNING *
      `,
      [
        income_type,
        amount,
        source_description || null,
        member_id || null,
        recorded_by,
        date_received,
        fund_id,
        id
      ]
    );

    await logActivity(
      "finance",
      `Income updated: ${income_type} - GHS ${amount}`
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error("UPDATE INCOME ERROR:", error);

    res.status(500).json({
      message: "Failed to update income"
    });
  }
};


/* ================= DELETE ================= */

const deleteIncome = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await pool.query(
      `
      SELECT income_type, transaction_group_id
      FROM income
      WHERE id = $1
      `,
      [id]
    );

    if (record.rows.length === 0) {
      return res.status(404).json({
        message: "Income not found"
      });
    }

    if (record.rows[0].income_type === "Tithe") {
      return res.status(403).json({
        message: "Cannot delete tithe here"
      });
    }

    if (record.rows[0].income_type === "Day Born Offering") {
      const groupId = record.rows[0].transaction_group_id;

      await pool.query(
        `
        DELETE FROM welfare_direct_income
        WHERE transaction_group_id = $1
        `,
        [groupId]
      );

      await pool.query(
        `
        DELETE FROM expenditure
        WHERE transaction_group_id = $1
        `,
        [groupId]
      );
    }

    await pool.query(
      `DELETE FROM income WHERE id = $1`,
      [id]
    );

    await logActivity(
      "finance",
      `Income deleted (ID: ${id})`
    );

    res.json({
      message: "Deleted"
    });

  } catch (error) {
    console.error("DELETE INCOME ERROR:", error);

    res.status(500).json({
      message: "Failed to delete income"
    });
  }
};


/* ================= DATE RANGE ================= */

const getIncomeByDateRange = async (req, res) => {

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
        i.*,
        f.fund_code,
        f.fund_name
      FROM income i
      JOIN funds f
        ON i.fund_id = f.id
      WHERE i.date_received BETWEEN $1 AND $2
      ORDER BY i.date_received DESC
      `,
      [start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("DATE RANGE INCOME ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch income"
    });
  }
};

const getIncomeByFund = async (req, res) => {
  const { fundCode } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        i.*,
        f.fund_code,
        f.fund_name
      FROM income i
      JOIN funds f
        ON i.fund_id = f.id
      WHERE f.fund_code = $1
      ORDER BY i.date_received DESC
      `,
      [fundCode]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET INCOME BY FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch income for fund"
    });
  }
};

const getIncomeByFundAndDateRange = async (req, res) => {

  const { fundCode } = req.params;
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
        i.*,
        f.fund_code,
        f.fund_name
      FROM income i
      JOIN funds f
        ON i.fund_id = f.id
      WHERE f.fund_code = $1
        AND i.date_received BETWEEN $2 AND $3
      ORDER BY i.date_received DESC
      `,
      [fundCode, start, end]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("FUND DATE RANGE INCOME ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch income"
    });
  }
};


export default {
  addIncome,
  getAllIncome,
  updateIncome,
  deleteIncome,
  getIncomeByDateRange,
  getIncomeByFund,
  getIncomeByFundAndDateRange
};