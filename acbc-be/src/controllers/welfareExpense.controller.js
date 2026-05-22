import pool from '../services/db.js';

/* ================= HELPERS ================= */

const generateExpenseCode = () => {
  return `EXP-${Date.now()}`;
};

/* ================= EXPENSE TYPES ================= */

// CREATE TYPE
const createExpenseType = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    await pool.query(
      `INSERT INTO welfare_expense_types (name, description)
       VALUES ($1, $2)`,
      [name, description || null]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create type" });
  }
};

// GET TYPES
const getExpenseTypes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM welfare_expense_types ORDER BY name ASC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch types" });
  }
};


/* ================= EXPENSE ================= */

// CREATE EXPENSE
const createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      expense_type_id,
      beneficiary_member_id,
      recorded_by,
      approved_by,
      date_spent
    } = req.body;

    if (!title || !amount || !expense_type_id || !recorded_by || !date_spent) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await pool.query(
      `INSERT INTO welfare_expenses
      (expense_code, title, description, amount, expense_type_id,
       beneficiary_member_id, status, approved_by, recorded_by, date_spent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,

      [
        generateExpenseCode(),
        title,
        description || null,
        amount,
        expense_type_id,
        beneficiary_member_id || null,
        "APPROVED",
        approved_by || null,
        recorded_by,
        date_spent
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to record expense" });
  }
};


// GET ALL EXPENSES
const getExpenses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        we.id,
        we.expense_code,
        we.title,
        we.amount,
        we.status,
        we.date_spent,
        et.name AS expense_type,
        m.first_name,
        m.last_name
      FROM welfare_expenses we
      JOIN welfare_expense_types et ON we.expense_type_id = et.id
      LEFT JOIN members m ON we.beneficiary_member_id = m.id
      ORDER BY we.date_spent DESC`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};


// GET SINGLE EXPENSE
const getSingleExpense = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        we.*,
        et.name AS expense_type,
        m.first_name,
        m.last_name
      FROM welfare_expenses we
      JOIN welfare_expense_types et ON we.expense_type_id = et.id
      LEFT JOIN members m ON we.beneficiary_member_id = m.id
      WHERE we.id = $1`,
      [req.params.id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch expense" });
  }
};


/* ================= SUMMARY ================= */

const getWelfareSummary = async (req, res) => {
  try {

    // EVENT INCOME
    const welfareFundsResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM welfare_funds`
    );

    const welfareFunds = welfareFundsResult.rows[0].total;

    // DIRECT INCOME
    const directIncomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM welfare_direct_income`
    );

    const directIncome = directIncomeResult.rows[0].total;

    const totalIncome = Number(welfareFunds) + Number(directIncome);

    // EXPENSES
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM welfare_expenses`
    );

    const totalExpense = expenseResult.rows[0].total;

    // TODAY EXPENSE
    const todayExpenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM welfare_expenses
       WHERE created_at::date = CURRENT_DATE`
    );

    const todayExpense = todayExpenseResult.rows[0].total;

    const balance = totalIncome - totalExpense;

    res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      today_expense: todayExpense,
      balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch welfare summary"
    });
  }
};


export default {
  createExpenseType,
  getExpenseTypes,
  createExpense,
  getExpenses,
  getSingleExpense,
  getWelfareSummary
};