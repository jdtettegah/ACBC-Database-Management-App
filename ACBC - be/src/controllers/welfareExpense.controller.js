const { poolPromise, sql } = require('../services/db');

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

    const pool = await poolPromise;

    await pool.request()
      .input("name", sql.VarChar, name)
      .input("desc", sql.Text, description || null)
      .query(`
        INSERT INTO WelfareExpenseTypes (name, description)
        VALUES (@name, @desc)
      `);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Failed to create type" });
  }
};

// GET TYPES
const getExpenseTypes = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT * FROM WelfareExpenseTypes
      ORDER BY name ASC
    `);

    res.json(result.recordset);

  } catch (err) {
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

    const pool = await poolPromise;

    await pool.request()
      .input("code", sql.VarChar, generateExpenseCode())
      .input("title", sql.VarChar, title)
      .input("desc", sql.Text, description || null)
      .input("amount", sql.Decimal(18,2), amount)
      .input("type", sql.Int, expense_type_id)
      .input("beneficiary", sql.Int, beneficiary_member_id || null)
      .input("status", sql.VarChar, "APPROVED")
      .input("approved", sql.Int, approved_by || null)
      .input("user", sql.Int, recorded_by)
      .input("date", sql.Date, date_spent)
      .query(`
        INSERT INTO WelfareExpenses
        (expense_code,title,description,amount,expense_type_id,beneficiary_member_id,status,approved_by,recorded_by,date_spent)
        VALUES (@code,@title,@desc,@amount,@type,@beneficiary,@status,@approved,@user,@date)
      `);

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: "Failed to record expense" });
  }
};


// GET ALL EXPENSES
const getExpenses = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        we.id,
        we.expense_code,
        we.title,
        we.amount,
        we.status,
        we.date_spent,
        et.name AS expense_type,
        m.first_name,
        m.last_name
      FROM WelfareExpenses we
      JOIN WelfareExpenseTypes et ON we.expense_type_id = et.id
      LEFT JOIN Members m ON we.beneficiary_member_id = m.id
      ORDER BY we.date_spent DESC
    `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};


// GET SINGLE EXPENSE
const getSingleExpense = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query(`
        SELECT 
          we.*,
          et.name AS expense_type,
          m.first_name,
          m.last_name
        FROM WelfareExpenses we
        JOIN WelfareExpenseTypes et ON we.expense_type_id = et.id
        LEFT JOIN Members m ON we.beneficiary_member_id = m.id
        WHERE we.id = @id
      `);

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch expense" });
  }
};


/* ================= SUMMARY (UPDATED 🔥) ================= */

const getWelfareSummary = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        (SELECT ISNULL(SUM(amount),0) FROM WelfareFunds) AS total_income,

        (SELECT ISNULL(SUM(amount),0) 
         FROM WelfareExpenses 
         WHERE status = 'APPROVED') AS total_expense,

        (SELECT ISNULL(SUM(amount),0) 
         FROM WelfareExpenses 
         WHERE status = 'APPROVED'
         AND CAST(date_spent AS DATE) = CAST(GETDATE() AS DATE)
        ) AS today_expense
    `);

    const data = result.recordset[0];

    res.json({
      total_income: data.total_income,
      total_expense: data.total_expense,
      today_expense: data.today_expense,
      balance: data.total_income - data.total_expense
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};


module.exports = {
  createExpenseType,
  getExpenseTypes,
  createExpense,
  getExpenses,
  getSingleExpense,
  getWelfareSummary
};