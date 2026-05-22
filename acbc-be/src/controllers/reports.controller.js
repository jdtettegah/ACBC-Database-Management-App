import pool from '../services/db.js';

/**
 * 📊 MONTHLY FINANCE REPORT
 */
const monthlyFinanceReport = async (req, res) => {

  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and End date required"
      });
    }

    // OPENING BALANCE - INCOME
    const openingIncomeResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM income
      WHERE date_received < $1
      `,
      [start]
    );

    // OPENING BALANCE - EXPENSE
    const openingExpenseResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenditure
      WHERE date_spent < $1
      `,
      [start]
    );

    const openingBalance =
      Number(openingIncomeResult.rows[0].total) -
      Number(openingExpenseResult.rows[0].total);

    // INCOME PERIOD
    const incomeResult = await pool.query(
      `
      SELECT income_type, SUM(amount) AS total
      FROM income
      WHERE date_received BETWEEN $1 AND $2
      GROUP BY income_type
      `,
      [start, end]
    );

    // EXPENSE PERIOD
    const expenseResult = await pool.query(
      `
      SELECT category, SUM(amount) AS total
      FROM expenditure
      WHERE date_spent BETWEEN $1 AND $2
      GROUP BY category
      `,
      [start, end]
    );

    const income = incomeResult.rows;
    const expenses = expenseResult.rows;

    const totalIncome = income.reduce((s, i) => s + Number(i.total), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.total), 0);

    const closingBalance =
      openingBalance + totalIncome - totalExpense;

    res.json({
      start,
      end,
      openingBalance,
      income,
      expenses,
      totalIncome,
      totalExpense,
      closingBalance
    });

  } catch (err) {
    console.error("Finance Report Error:", err);

    res.status(500).json({
      message: "Failed to generate report"
    });
  }
};


/**
 * 💰 TITHE SUMMARY
 */
const titheSummary = async (req, res) => {

  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required"
      });
    }

    const summary = await pool.query(
      `
      SELECT
        COUNT(DISTINCT member_id) AS totalmembers,
        COALESCE(SUM(amount),0) AS totaltithes
      FROM tithes
      WHERE date_paid BETWEEN $1 AND $2
      `,
      [start, end]
    );

    const members = await pool.query(
      `
      SELECT
        t.member_id,
        m.first_name,
        m.last_name,
        t.amount AS amount_paid,
        t.date_paid
      FROM tithes t
      JOIN members m ON t.member_id = m.id
      WHERE t.date_paid BETWEEN $1 AND $2
      ORDER BY t.date_paid ASC
      `,
      [start, end]
    );

    res.json({
      totalMembers: summary.rows[0].totalmembers,
      totalTithes: summary.rows[0].totaltithes,
      members: members.rows
    });

  } catch (err) {
    console.error("Tithe Report Error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};


/**
 * 👥 ATTENDANCE SUMMARY
 */
const attendanceSummary = async (req, res) => {

  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required"
      });
    }

    const uniqueMembers = await pool.query(
      `
      SELECT COUNT(DISTINCT member_id) AS totalmembers
      FROM attendance
      WHERE service_date BETWEEN $1 AND $2
      AND status = 'Present'
      `,
      [start, end]
    );

    const members = await pool.query(
      `
      SELECT 
        service_date,
        service_type,
        COUNT(*) AS members
      FROM attendance
      WHERE service_date BETWEEN $1 AND $2
      AND status = 'Present'
      GROUP BY service_date, service_type
      ORDER BY service_date ASC
      `,
      [start, end]
    );

    const visitors = await pool.query(
      `
      SELECT 
        visit_date AS service_date,
        service_type,
        COUNT(*) AS visitors
      FROM visitors
      WHERE visit_date BETWEEN $1 AND $2
      GROUP BY visit_date, service_type
      `,
      [start, end]
    );

    const memberData = members.rows;
    const visitorData = visitors.rows;

    const services = {};

    memberData.forEach(m => {
      const key = `${m.service_date}-${m.service_type}`;
      services[key] = {
        service_date: m.service_date,
        service_type: m.service_type,
        members: m.members,
        visitors: 0
      };
    });

    visitorData.forEach(v => {
      const key = `${v.service_date}-${v.service_type}`;

      if (!services[key]) {
        services[key] = {
          service_date: v.service_date,
          service_type: v.service_type,
          members: 0,
          visitors: v.visitors
        };
      } else {
        services[key].visitors = v.visitors;
      }
    });

    const results = Object.values(services).map(s => ({
      ...s,
      total: Number(s.members) + Number(s.visitors)
    }));

    const totalMemberAttendance =
      results.reduce((s, r) => s + Number(r.members), 0);

    const totalVisitors =
      results.reduce((s, r) => s + Number(r.visitors), 0);

    res.json({
      start,
      end,
      totalMembers: uniqueMembers.rows[0].totalmembers,
      totalMemberAttendance,
      totalVisitors,
      totalAttendance: totalMemberAttendance + totalVisitors,
      services: results
    });

  } catch (err) {

    console.error("Attendance Report Error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};


/**
 * 📋 ALL REPORTS
 */
const getAllReports = async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT id, title, category, period, status, created_at
      FROM reports
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error"
    });
  }
};


/**
 * 💾 SAVE REPORT
 */
const saveReport = async (req, res) => {

  try {

    const { title, category, period } = req.body;

    if (!title || !category || !period) {
      return res.status(400).json({
        message: "title, category and period are required"
      });
    }

    await pool.query(
      `
      INSERT INTO reports (title, category, period)
      VALUES ($1, $2, $3)
      `,
      [title, category, period]
    );

    res.json({
      message: "Report saved successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to save report"
    });
  }
};


/**
 * 📊 WEEKLY ATTENDANCE CHART
 */
const weeklyAttendanceChart = async (req, res) => {

  try {

    const { start, end } = req.query;

    const result = await pool.query(
      `
      SELECT week,
        SUM(sunday) AS sunday,
        SUM(midweek) AS midweek,
        MIN(startdate) AS startdate,
        MAX(enddate) AS enddate
      FROM (
        SELECT
          CASE
            WHEN EXTRACT(DAY FROM service_date) BETWEEN 1 AND 7 THEN 'Week 1'
            WHEN EXTRACT(DAY FROM service_date) BETWEEN 8 AND 14 THEN 'Week 2'
            WHEN EXTRACT(DAY FROM service_date) BETWEEN 15 AND 21 THEN 'Week 3'
            WHEN EXTRACT(DAY FROM service_date) BETWEEN 22 AND 28 THEN 'Week 4'
            ELSE 'Week 5'
          END AS week,
          CASE WHEN service_type ILIKE '%Sunday%' AND status = 'Present' THEN 1 ELSE 0 END AS sunday,
          CASE WHEN service_type ILIKE '%Midweek%' AND status = 'Present' THEN 1 ELSE 0 END AS midweek,
          service_date AS startdate,
          service_date AS enddate
        FROM attendance
        WHERE service_date BETWEEN $1 AND $2

        UNION ALL

        SELECT
          CASE
            WHEN EXTRACT(DAY FROM visit_date) BETWEEN 1 AND 7 THEN 'Week 1'
            WHEN EXTRACT(DAY FROM visit_date) BETWEEN 8 AND 14 THEN 'Week 2'
            WHEN EXTRACT(DAY FROM visit_date) BETWEEN 15 AND 21 THEN 'Week 3'
            WHEN EXTRACT(DAY FROM visit_date) BETWEEN 22 AND 28 THEN 'Week 4'
            ELSE 'Week 5'
          END AS week,
          CASE WHEN service_type ILIKE '%Sunday%' THEN 1 ELSE 0 END,
          CASE WHEN service_type ILIKE '%Midweek%' THEN 1 ELSE 0 END,
          visit_date,
          visit_date
        FROM visitors
        WHERE visit_date BETWEEN $1 AND $2
      ) combined
      GROUP BY week
      ORDER BY week
      `,
      [start, end]
    );

    res.json({ weeks: result.rows });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * 📊 WEEKLY FINANCE CHART
 */
const weeklyFinanceChart = async (req, res) => {

  try {

    const { start, end } = req.query;

    const result = await pool.query(
      `
      SELECT week,
        SUM(income) AS income,
        SUM(expense) AS expense
      FROM (
        SELECT
          CASE
            WHEN EXTRACT(DAY FROM date_received) BETWEEN 1 AND 7 THEN 'Week 1'
            WHEN EXTRACT(DAY FROM date_received) BETWEEN 8 AND 14 THEN 'Week 2'
            WHEN EXTRACT(DAY FROM date_received) BETWEEN 15 AND 21 THEN 'Week 3'
            WHEN EXTRACT(DAY FROM date_received) BETWEEN 22 AND 28 THEN 'Week 4'
            ELSE 'Week 5'
          END AS week,
          amount AS income,
          0 AS expense
        FROM income
        WHERE date_received BETWEEN $1 AND $2

        UNION ALL

        SELECT
          CASE
            WHEN EXTRACT(DAY FROM date_spent) BETWEEN 1 AND 7 THEN 'Week 1'
            WHEN EXTRACT(DAY FROM date_spent) BETWEEN 8 AND 14 THEN 'Week 2'
            WHEN EXTRACT(DAY FROM date_spent) BETWEEN 15 AND 21 THEN 'Week 3'
            WHEN EXTRACT(DAY FROM date_spent) BETWEEN 22 AND 28 THEN 'Week 4'
            ELSE 'Week 5'
          END AS week,
          0,
          amount
        FROM expenditure
        WHERE date_spent BETWEEN $1 AND $2
      ) combined
      GROUP BY week
      ORDER BY week
      `,
      [start, end]
    );

    res.json({ weeks: result.rows });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * 🏥 WELFARE REPORT
 */
const welfareReport = async (req, res) => {

  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required"
      });
    }

    const openingIncome = await pool.query(
      `
      SELECT COALESCE(SUM(amount),0) AS total
      FROM welfare_funds
      WHERE date_paid < $1
      `,
      [start]
    );

    const directIncome = await pool.query(
      `
      SELECT COALESCE(SUM(amount),0) AS total
      FROM welfare_direct_income
      WHERE date_received < $1
      `,
      [start]
    );

    const expense = await pool.query(
      `
      SELECT COALESCE(SUM(amount),0) AS total
      FROM welfare_expenses
      WHERE date_spent < $1
      AND status = 'APPROVED'
      `,
      [start]
    );

    const openingBalance =
      Number(openingIncome.rows[0].total) +
      Number(directIncome.rows[0].total) -
      Number(expense.rows[0].total);

    const eventIncome = await pool.query(
      `
      SELECT we.event_type AS source, SUM(wf.amount) AS total
      FROM welfare_funds wf
      JOIN welfare_event_members wem ON wf.event_member_id = wem.id
      JOIN welfare_events we ON wem.event_id = we.id
      WHERE wf.date_paid BETWEEN $1 AND $2
      GROUP BY we.event_type
      `,
      [start, end]
    );

    const directIncomePeriod = await pool.query(
      `
      SELECT source, SUM(amount) AS total
      FROM welfare_direct_income
      WHERE date_received BETWEEN $1 AND $2
      GROUP BY source
      `,
      [start, end]
    );

    const income = [
      ...eventIncome.rows,
      ...directIncomePeriod.rows
    ];

    const expensePeriod = await pool.query(
      `
      SELECT et.name AS category, SUM(we.amount) AS total
      FROM welfare_expenses we
      JOIN welfare_expense_types et ON we.expense_type_id = et.id
      WHERE we.date_spent BETWEEN $1 AND $2
      AND we.status = 'APPROVED'
      GROUP BY et.name
      `,
      [start, end]
    );

    const expenses = expensePeriod.rows;

    const totalIncome = income.reduce((s, i) => s + Number(i.total), 0);
    const totalExpense = expenses.reduce((s, e) => s + Number(e.total), 0);

    const closingBalance =
      openingBalance + totalIncome - totalExpense;

    res.json({
      start,
      end,
      openingBalance,
      income,
      expenses,
      totalIncome,
      totalExpense,
      closingBalance
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Failed to generate welfare report"
    });
  }
};

export default {
  monthlyFinanceReport,
  titheSummary,
  attendanceSummary,
  getAllReports,
  saveReport,
  weeklyAttendanceChart,
  weeklyFinanceChart,
  welfareReport
};