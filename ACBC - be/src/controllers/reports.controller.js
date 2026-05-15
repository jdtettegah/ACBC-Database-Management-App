// src/controllers/reports.controller.js

const { poolPromise, sql } = require('../services/db');


/**
 * 📊 Monthly Finance Report
 * /api/reports/finance/monthly?month=3&year=2026
 */
const monthlyFinanceReport = async (req, res) => {
  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const pool = await poolPromise;

    // OPENING BALANCE
    const openingIncome = await pool.request()
      .input("start", sql.Date, start)
      .query(`
        SELECT ISNULL(SUM(amount),0) as total
        FROM Income
        WHERE date_received < @start
      `);

    const openingExpense = await pool.request()
      .input("start", sql.Date, start)
      .query(`
        SELECT ISNULL(SUM(amount),0) as total
        FROM Expenditure
        WHERE date_spent < @start
      `);

    const openingBalance =
      openingIncome.recordset[0].total -
      openingExpense.recordset[0].total;


    // INCOME WITHIN PERIOD
    const incomeResult = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT income_type, SUM(amount) as total
        FROM Income
        WHERE date_received BETWEEN @start AND @end
        GROUP BY income_type
      `);


    // EXPENSES WITHIN PERIOD
    const expenseResult = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT category, SUM(amount) as total
        FROM Expenditure
        WHERE date_spent BETWEEN @start AND @end
        GROUP BY category
      `);


    const income = incomeResult.recordset;
    const expenses = expenseResult.recordset;

    const totalIncome = income.reduce((sum, i) => sum + Number(i.total), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.total), 0);

    const closingBalance =
      openingBalance +
      totalIncome -
      totalExpense;

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
 * 💰 Tithe Summary
 * /api/reports/tithes/summary?start=2026-01-01&end=2026-03-01
 */
const titheSummary = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const pool = await poolPromise;

    // Summary
    const summary = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT
          COUNT(DISTINCT member_id) AS totalMembers,
          ISNULL(SUM(amount),0) AS totalTithes
        FROM Tithes
        WHERE date_paid BETWEEN @start AND @end
      `);

    // Member details
    const members = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT
          t.member_id,
          m.first_name,
          m.last_name,
          t.amount AS amount_paid,
          t.date_paid
        FROM Tithes t
        JOIN Members m ON t.member_id = m.id
        WHERE t.date_paid BETWEEN @start AND @end
        ORDER BY t.date_paid ASC
      `);

    res.json({
      totalMembers: summary.recordset[0].totalMembers,
      totalTithes: summary.recordset[0].totalTithes,
      members: members.recordset
    });

  } catch (err) {
    console.error("Tithe Report Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * 👥 Attendance Summary
 * /api/reports/attendance/summary?date=2026-03-09
 */
const attendanceSummary = async (req, res) => {
  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end date required" });
    }

    const pool = await poolPromise;

    // --------------------------------
    // Unique members in the period
    // --------------------------------
    const uniqueMembersQuery = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT COUNT(DISTINCT member_id) AS totalMembers
        FROM Attendance
        WHERE service_date BETWEEN @start AND @end
        AND status = 'Present'
      `);

    const uniqueMembers = uniqueMembersQuery.recordset[0].totalMembers;

    // --------------------------------
    // Member attendance per service
    // --------------------------------
    const members = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          service_date,
          service_type,
          COUNT(*) AS members
        FROM Attendance
        WHERE service_date BETWEEN @start AND @end
        AND status = 'Present'
        GROUP BY service_date, service_type
        ORDER BY service_date ASC
      `);

    // --------------------------------
    // Visitor attendance
    // --------------------------------
    const visitors = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          visit_date AS service_date,
          service_type,
          COUNT(*) AS visitors
        FROM Visitors
        WHERE visit_date BETWEEN @start AND @end
        GROUP BY visit_date, service_type
      `);

    const memberData = members.recordset;
    const visitorData = visitors.recordset;

    // --------------------------------
    // Merge results
    // --------------------------------
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
      total: s.members + s.visitors
    }));

    // --------------------------------
    // Totals
    // --------------------------------
    const totalMemberAttendance = results.reduce((sum, r) => sum + r.members, 0);
    const totalVisitors = results.reduce((sum, r) => sum + r.visitors, 0);

    res.json({
      start,
      end,

      // Unique members
      totalMembers: uniqueMembers,

      // Attendance counts
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
 * 📋 All Reports (Dashboard Preview)
 * /api/reports
 */
const getAllReports = async (req, res) => {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
        SELECT
          id,
          title,
          category,
          period,
          status,
          created_at
        FROM Reports
        ORDER BY created_at DESC
    `);

    res.json(result.recordset);

  } catch (err) {

    console.error("Get Reports Error:", err);

    res.status(500).json({
      message: "Server error"
    });

  }
};


const saveReport = async (req, res) => {
  try {

    const { title, category, period } = req.body;

    if (!title || !category || !period) {
      return res.status(400).json({
        message: "title, category and period are required"
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("title", sql.NVarChar, title)
      .input("category", sql.NVarChar, category)
      .input("period", sql.NVarChar, period)
      .query(`
        INSERT INTO Reports (title, category, period)
        VALUES (@title, @category, @period)
      `);

    res.json({
      message: "Report saved successfully"
    });

  } catch (err) {

    console.error("Save Report Error:", err);

    res.status(500).json({
      message: "Failed to save report"
    });

  }
};


// reports.controller.js

const weeklyAttendanceChart = async (req, res) => {
  try {
    const { start, end } = req.query;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          week,

          SUM(sunday) as sunday,
          SUM(midweek) as midweek,

          MIN(startDate) as startDate,
          MAX(endDate) as endDate

        FROM (

          -- MEMBERS (Attendance Table)
          SELECT 
            CASE 
              WHEN DAY(service_date) BETWEEN 1 AND 7 THEN 'Week 1'
              WHEN DAY(service_date) BETWEEN 8 AND 14 THEN 'Week 2'
              WHEN DAY(service_date) BETWEEN 15 AND 21 THEN 'Week 3'
              WHEN DAY(service_date) BETWEEN 22 AND 28 THEN 'Week 4'
              ELSE 'Week 5'
            END as week,

            CASE 
              WHEN service_type LIKE '%Sunday%' AND status = 'Present' 
              THEN 1 ELSE 0 
            END as sunday,

            CASE 
              WHEN service_type LIKE '%Midweek%' AND status = 'Present' 
              THEN 1 ELSE 0 
            END as midweek,

            CONVERT(VARCHAR, service_date, 23) as startDate,
            CONVERT(VARCHAR, service_date, 23) as endDate

          FROM Attendance
          WHERE service_date BETWEEN @start AND @end

          UNION ALL

          -- VISITORS (Visitors Table)
          SELECT 
            CASE 
              WHEN DAY(visit_date) BETWEEN 1 AND 7 THEN 'Week 1'
              WHEN DAY(visit_date) BETWEEN 8 AND 14 THEN 'Week 2'
              WHEN DAY(visit_date) BETWEEN 15 AND 21 THEN 'Week 3'
              WHEN DAY(visit_date) BETWEEN 22 AND 28 THEN 'Week 4'
              ELSE 'Week 5'
            END as week,

            CASE 
              WHEN service_type LIKE '%Sunday%' 
              THEN 1 ELSE 0 
            END as sunday,

            CASE 
              WHEN service_type LIKE '%Midweek%' 
              THEN 1 ELSE 0 
            END as midweek,

            CONVERT(VARCHAR, visit_date, 23) as startDate,
            CONVERT(VARCHAR, visit_date, 23) as endDate

          FROM Visitors
          WHERE visit_date BETWEEN @start AND @end

        ) as combined

        GROUP BY week
        ORDER BY week
      `);

    res.json({ weeks: result.recordset });

  } catch (err) {
    console.error("Weekly Attendance Chart Error:", err);
    res.status(500).json({ error: err.message });
  }
};
const weeklyFinanceChart = async (req, res) => {
  try {
    const { start, end } = req.query;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          week,

          SUM(income) as income,
          SUM(expense) as expense,

          MIN(startDate) as startDate,
          MAX(endDate) as endDate

        FROM (
          -- Income
          SELECT 
            CASE 
              WHEN DAY(date_received) BETWEEN 1 AND 7 THEN 'Week 1'
              WHEN DAY(date_received) BETWEEN 8 AND 14 THEN 'Week 2'
              WHEN DAY(date_received) BETWEEN 15 AND 21 THEN 'Week 3'
              WHEN DAY(date_received) BETWEEN 22 AND 28 THEN 'Week 4'
              ELSE 'Week 5'
            END as week,

            amount as income,
            0 as expense,

            date_received as startDate,
            date_received as endDate

          FROM Income
          WHERE date_received BETWEEN @start AND @end

          UNION ALL

          -- Expenditure
          SELECT 
            CASE 
              WHEN DAY(date_spent) BETWEEN 1 AND 7 THEN 'Week 1'
              WHEN DAY(date_spent) BETWEEN 8 AND 14 THEN 'Week 2'
              WHEN DAY(date_spent) BETWEEN 15 AND 21 THEN 'Week 3'
              WHEN DAY(date_spent) BETWEEN 22 AND 28 THEN 'Week 4'
              ELSE 'Week 5'
            END as week,

            0 as income,
            amount as expense,

            date_spent as startDate,
            date_spent as endDate

          FROM Expenditure
          WHERE date_spent BETWEEN @start AND @end

        ) as combined

        GROUP BY week
        ORDER BY week
      `);

    res.json({ weeks: result.recordset });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


/**
 * 🏥 Welfare Financial Report
 * /api/reports/welfare?start=2026-01-01&end=2026-01-31
 */
const welfareReport = async (req, res) => {
  try {

    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required"
      });
    }

    const pool = await poolPromise;

    /* ===============================
       OPENING BALANCE
    =============================== */

    // EVENT INCOME BEFORE PERIOD
    const openingEventIncome = await pool.request()
      .input("start", sql.Date, start)
      .query(`
        SELECT ISNULL(SUM(amount),0) as total
        FROM WelfareFunds
        WHERE date_paid < @start
      `);

    // DIRECT INCOME BEFORE PERIOD
    const openingDirectIncome = await pool.request()
      .input("start", sql.Date, start)
      .query(`
        SELECT ISNULL(SUM(amount),0) as total
        FROM WelfareDirectIncome
        WHERE date_received < @start
      `);

    // EXPENSE BEFORE PERIOD
    const openingExpense = await pool.request()
      .input("start", sql.Date, start)
      .query(`
        SELECT ISNULL(SUM(amount),0) as total
        FROM WelfareExpenses
        WHERE date_spent < @start
        AND status = 'APPROVED'
      `);

    const openingIncome =
      Number(openingEventIncome.recordset[0].total) +
      Number(openingDirectIncome.recordset[0].total);

    const openingBalance =
      openingIncome -
      Number(openingExpense.recordset[0].total);

    /* ===============================
       EVENT INCOME
    =============================== */

    const eventIncomeResult = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          we.event_type AS source,
          SUM(wf.amount) as total
        FROM WelfareFunds wf
        JOIN WelfareEventMembers wem 
          ON wf.event_member_id = wem.id
        JOIN WelfareEvents we 
          ON wem.event_id = we.id
        WHERE wf.date_paid BETWEEN @start AND @end
        GROUP BY we.event_type
      `);

    /* ===============================
       DIRECT INCOME
    =============================== */

    const directIncomeResult = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          source,
          SUM(amount) as total
        FROM WelfareDirectIncome
        WHERE date_received BETWEEN @start AND @end
        GROUP BY source
      `);

    /* ===============================
       MERGE INCOME
    =============================== */

    const income = [
      ...eventIncomeResult.recordset,
      ...directIncomeResult.recordset
    ];

    /* ===============================
       EXPENSES
    =============================== */

    const expenseResult = await pool.request()
      .input("start", sql.Date, start)
      .input("end", sql.Date, end)
      .query(`
        SELECT 
          et.name as category,
          SUM(we.amount) as total
        FROM WelfareExpenses we
        JOIN WelfareExpenseTypes et 
          ON we.expense_type_id = et.id
        WHERE we.date_spent BETWEEN @start AND @end
        AND we.status = 'APPROVED'
        GROUP BY et.name
      `);

    const expenses = expenseResult.recordset;

    /* ===============================
       TOTALS
    =============================== */

    const totalIncome = income.reduce(
      (sum, i) => sum + Number(i.total),
      0
    );

    const totalExpense = expenses.reduce(
      (sum, e) => sum + Number(e.total),
      0
    );

    const closingBalance =
      openingBalance +
      totalIncome -
      totalExpense;

    /* ===============================
       RESPONSE
    =============================== */

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

    console.error("Welfare Report Error:", err);

    res.status(500).json({
      message: "Failed to generate welfare report"
    });

  }
};

module.exports = {
  monthlyFinanceReport,
  titheSummary,
  attendanceSummary,
  getAllReports,
  saveReport,
  weeklyAttendanceChart,
  weeklyFinanceChart,
  welfareReport
};