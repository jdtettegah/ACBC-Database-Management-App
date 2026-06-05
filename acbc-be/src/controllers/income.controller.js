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
    date_received
  } = req.body;

  if (income_type === "Tithe") {
    return res.status(403).json({
      message: "Tithe must be created from Tithes module"
    });
  }

  try {
    await pool.query(
      `
      INSERT INTO income (
        income_type, amount, source_description,
        member_id, recorded_by, date_received
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        income_type,
        amount,
        source_description,
        member_id,
        recorded_by,
        date_received
      ]
    );

    res.json({ message: "Income added" });

  } catch {
    res.status(500).json({ message: "Error" });
  }
};

/* ================= GET ================= */

const getAllIncome = async (req, res) => {
  const result = await pool.query(`SELECT * FROM income ORDER BY date_received DESC`);
  res.json(result.rows);
};

/* ================= UPDATE ================= */

const updateIncome = async (req, res) => {
  const { id } = req.params;

  const check = await pool.query(
    `SELECT income_type FROM income WHERE id=$1`,
    [id]
  );

  if (check.rows[0]?.income_type === "Tithe") {
    return res.status(403).json({
      message: "Edit tithe from Tithe module"
    });
  }

  // normal update...
};

/* ================= DELETE ================= */

const deleteIncome = async (req, res) => {
  const { id } = req.params;

  const record = await pool.query(
    `
    SELECT income_type, transaction_group_id
    FROM income
    WHERE id = $1
    `,
    [id]
  );

  const check = await pool.query(
    `SELECT income_type FROM income WHERE id=$1`,
    [id]
  );

  if (check.rows[0]?.income_type === "Tithe") {
    return res.status(403).json({
      message: "Cannot delete tithe here"
    });
  }

  if (
    record.rows[0]?.income_type === "Day Born Offering"
  ) {
    const groupId =
      record.rows[0].transaction_group_id;
  
    await pool.query(
      `DELETE FROM welfare_direct_income
       WHERE transaction_group_id = $1`,
      [groupId]
    );
  
    await pool.query(
      `DELETE FROM expenditure
       WHERE transaction_group_id = $1`,
      [groupId]
    );
  }

  await pool.query(`DELETE FROM income WHERE id=$1`, [id]);

  res.json({ message: "Deleted" });
};



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
  updateIncome,
  deleteIncome,
  getIncomeByDateRange
};