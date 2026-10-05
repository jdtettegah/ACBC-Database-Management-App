import pool from "../services/db.js";

/**
 * MONTHLY FINANCE REPORT
 *
 * Returns:
 * - Opening balance
 * - Income grouped by income type
 * - Expenses grouped by category
 * - Total income and total expense
 * - Closing balance
 * - Total tithe for the selected period
 * - Fund breakdown
 *
 * Tithe is already recorded in the income table.
 * Therefore, totalTithe is informational and must NOT
 * be added to totalIncome a second time.
 */
const monthlyFinanceReport = async (req, res) => {
  try {
    const { start, end, fund_code } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and End date required",
      });
    }

    if (start > end) {
      return res.status(400).json({
        message: "Start date cannot be after end date",
      });
    }

    const hasFundFilter = Boolean(
      fund_code && fund_code !== "ALL"
    );

    const fundCondition = hasFundFilter
      ? "AND f.fund_code = $3"
      : "";

    const params = hasFundFilter
      ? [start, end, fund_code]
      : [start, end];

    const openingFundCondition = hasFundFilter
      ? "AND f.fund_code = $2"
      : "";

    const openingParams = hasFundFilter
      ? [start, fund_code]
      : [start];

    // ==========================================
    // OPENING BALANCE
    // ==========================================

    const openingIncomeResult = await pool.query(
      `
      SELECT COALESCE(SUM(i.amount), 0) AS total
      FROM income i
      JOIN funds f ON i.fund_id = f.id
      WHERE i.date_received < $1
      ${openingFundCondition}
      `,
      openingParams
    );

    const openingExpenseResult = await pool.query(
      `
      SELECT COALESCE(SUM(e.amount), 0) AS total
      FROM expenditure e
      JOIN funds f ON e.fund_id = f.id
      WHERE e.date_spent < $1
      ${openingFundCondition}
      `,
      openingParams
    );

    const openingBalance =
      Number(openingIncomeResult.rows[0].total) -
      Number(openingExpenseResult.rows[0].total);

    // ==========================================
    // INCOME GROUPED BY CATEGORY
    // ==========================================
    // Tithe is included here because each tithe
    // already has a corresponding income record.
    // Individual transactions are not returned.

    const incomeCategoryResult = await pool.query(
      `
      SELECT
        COALESCE(
          NULLIF(TRIM(i.income_type), ''),
          'Uncategorized'
        ) AS category,
        COALESCE(SUM(i.amount), 0) AS total
      FROM income i
      JOIN funds f ON i.fund_id = f.id
      WHERE i.date_received BETWEEN $1 AND $2
      ${fundCondition}
      GROUP BY
        COALESCE(
          NULLIF(TRIM(i.income_type), ''),
          'Uncategorized'
        )
      ORDER BY category ASC
      `,
      params
    );

    const incomeByCategory = incomeCategoryResult.rows.map(
      (row) => ({
        category: row.category,
        total: Number(row.total),
      })
    );

    const totalIncome = incomeByCategory.reduce(
      (sum, item) => sum + item.total,
      0
    );

    // ==========================================
    // EXPENSES GROUPED BY CATEGORY
    // ==========================================

    const expenseCategoryResult = await pool.query(
      `
      SELECT
        COALESCE(
          NULLIF(TRIM(e.category), ''),
          'Uncategorized'
        ) AS category,
        COALESCE(SUM(e.amount), 0) AS total
      FROM expenditure e
      JOIN funds f ON e.fund_id = f.id
      WHERE e.date_spent BETWEEN $1 AND $2
      ${fundCondition}
      GROUP BY
        COALESCE(
          NULLIF(TRIM(e.category), ''),
          'Uncategorized'
        )
      ORDER BY category ASC
      `,
      params
    );

    const expensesByCategory = expenseCategoryResult.rows.map(
      (row) => ({
        category: row.category,
        total: Number(row.total),
      })
    );

    const totalExpense = expensesByCategory.reduce(
      (sum, item) => sum + item.total,
      0
    );

    // ==========================================
    // CLOSING BALANCE
    // ==========================================

    const closingBalance =
      openingBalance + totalIncome - totalExpense;

    // ==========================================
    // TOTAL TITHE
    // ==========================================
    // This is a separate informational figure.
    // Do not add it to totalIncome again.
    //
    // Existing design: tithes are not assigned to
    // funds, so the selected fund does not filter
    // this separate tithe total.

    const titheTotalResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM tithes
      WHERE date_paid BETWEEN $1 AND $2
      `,
      [start, end]
    );

    const totalTithe = Number(
      titheTotalResult.rows[0].total
    );

    // ==========================================
    // FUND BREAKDOWN
    // ==========================================

    const fundBreakdownResult = await pool.query(
      `
      SELECT
        f.fund_code,
        f.fund_name,

        COALESCE(income_totals.total_income, 0)
          AS total_income,

        COALESCE(expense_totals.total_expense, 0)
          AS total_expense,

        COALESCE(income_totals.total_income, 0)
        - COALESCE(expense_totals.total_expense, 0)
          AS balance

      FROM funds f

      LEFT JOIN (
        SELECT
          i.fund_id,
          SUM(i.amount) AS total_income
        FROM income i
        WHERE i.date_received BETWEEN $1 AND $2
        GROUP BY i.fund_id
      ) income_totals
        ON f.id = income_totals.fund_id

      LEFT JOIN (
        SELECT
          e.fund_id,
          SUM(e.amount) AS total_expense
        FROM expenditure e
        WHERE e.date_spent BETWEEN $1 AND $2
        GROUP BY e.fund_id
      ) expense_totals
        ON f.id = expense_totals.fund_id

      WHERE f.is_active = TRUE
      ${hasFundFilter ? "AND f.fund_code = $3" : ""}

      ORDER BY f.fund_name ASC
      `,
      params
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.json({
      start,
      end,
      fund_code: hasFundFilter ? fund_code : "ALL",

      openingBalance,

      // Category summaries; no individual
      // income or expense transaction records.
      incomeByCategory,
      expensesByCategory,

      totalIncome,
      totalExpense,
      closingBalance,

      // Informational only; already included
      // in totalIncome through the income table.
      totalTithe,

      fundBreakdown: fundBreakdownResult.rows,
    });
  } catch (err) {
    console.error("Finance Report Error:", err);

    return res.status(500).json({
      message: "Failed to generate report",
    });
  }
};


/**
 * 💰 TITHE SUMMARY
 *
 * Standalone Tithe Report
 *
 * Returns:
 * - Total unique members who paid
 * - Total amount of tithes
 * - Individual tithe payments
 */
const titheSummary = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        message: "Start and end date required",
      });
    }

    // ==========================================
    // TITHE SUMMARY
    // ==========================================

    const summary = await pool.query(
      `
      SELECT
        COUNT(DISTINCT member_id) AS totalmembers,
        COALESCE(SUM(amount), 0) AS totaltithes
      FROM tithes
      WHERE date_paid BETWEEN $1 AND $2
      `,
      [start, end]
    );

    // ==========================================
    // INDIVIDUAL TITHE PAYMENTS
    //
    // IMPORTANT:
    // This assumes tithes.member_id references
    // members.id.
    // ==========================================

    const members = await pool.query(
      `
      SELECT
        t.member_id,
        m.first_name,
        m.last_name,
        t.amount AS amount_paid,
        t.date_paid
      FROM tithes t
      LEFT JOIN members m
        ON t.member_id = m.id
      WHERE t.date_paid BETWEEN $1 AND $2
      ORDER BY t.date_paid ASC, t.id ASC
      `,
      [start, end]
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      start,
      end,

      totalMembers: Number(
        summary.rows[0].totalmembers
      ),

      totalTithes: Number(
        summary.rows[0].totaltithes
      ),

      members: members.rows,
    });

  } catch (err) {
    console.error("Tithe Report Error:", err);

    res.status(500).json({
      message: "Server error",
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
        message: "Start and end date required",
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

    memberData.forEach((m) => {
      const key = `${m.service_date}-${m.service_type}`;

      services[key] = {
        service_date: m.service_date,
        service_type: m.service_type,
        members: m.members,
        visitors: 0,
      };
    });

    visitorData.forEach((v) => {
      const key = `${v.service_date}-${v.service_type}`;

      if (!services[key]) {
        services[key] = {
          service_date: v.service_date,
          service_type: v.service_type,
          members: 0,
          visitors: v.visitors,
        };
      } else {
        services[key].visitors = v.visitors;
      }
    });

    const results = Object.values(services).map((s) => ({
      ...s,
      total:
        Number(s.members) +
        Number(s.visitors),
    }));

    const totalMemberAttendance =
      results.reduce(
        (s, r) => s + Number(r.members),
        0
      );

    const totalVisitors =
      results.reduce(
        (s, r) => s + Number(r.visitors),
        0
      );

    res.json({
      start,
      end,

      totalMembers:
        Number(uniqueMembers.rows[0].totalmembers),

      totalMemberAttendance,

      totalVisitors,

      totalAttendance:
        totalMemberAttendance +
        totalVisitors,

      services: results,
    });

  } catch (err) {
    console.error(
      "Attendance Report Error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


/**
 * 📋 ALL REPORTS
 */
const getAllReports = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        category,
        period,
        status,
        created_at
      FROM reports
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};


/**
 * 💾 SAVE REPORT
 */
const saveReport = async (req, res) => {
  try {
    const {
      title,
      category,
      period,
    } = req.body;

    if (!title || !category || !period) {
      return res.status(400).json({
        message:
          "title, category and period are required",
      });
    }

    await pool.query(
      `
      INSERT INTO reports
        (title, category, period)
      VALUES
        ($1, $2, $3)
      `,
      [title, category, period]
    );

    res.json({
      message: "Report saved successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to save report",
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
      SELECT
        week,
        SUM(sunday) AS sunday,
        SUM(midweek) AS midweek,
        MIN(startdate) AS startdate,
        MAX(enddate) AS enddate
      FROM (
        SELECT
          CASE
            WHEN EXTRACT(DAY FROM service_date)
              BETWEEN 1 AND 7
              THEN 'Week 1'

            WHEN EXTRACT(DAY FROM service_date)
              BETWEEN 8 AND 14
              THEN 'Week 2'

            WHEN EXTRACT(DAY FROM service_date)
              BETWEEN 15 AND 21
              THEN 'Week 3'

            WHEN EXTRACT(DAY FROM service_date)
              BETWEEN 22 AND 28
              THEN 'Week 4'

            ELSE 'Week 5'
          END AS week,

          CASE
            WHEN service_type ILIKE '%Sunday%'
              AND status = 'Present'
              THEN 1
            ELSE 0
          END AS sunday,

          CASE
            WHEN service_type ILIKE '%Midweek%'
              AND status = 'Present'
              THEN 1
            ELSE 0
          END AS midweek,

          service_date AS startdate,
          service_date AS enddate

        FROM attendance

        WHERE service_date
          BETWEEN $1 AND $2

        UNION ALL

        SELECT
          CASE
            WHEN EXTRACT(DAY FROM visit_date)
              BETWEEN 1 AND 7
              THEN 'Week 1'

            WHEN EXTRACT(DAY FROM visit_date)
              BETWEEN 8 AND 14
              THEN 'Week 2'

            WHEN EXTRACT(DAY FROM visit_date)
              BETWEEN 15 AND 21
              THEN 'Week 3'

            WHEN EXTRACT(DAY FROM visit_date)
              BETWEEN 22 AND 28
              THEN 'Week 4'

            ELSE 'Week 5'
          END AS week,

          CASE
            WHEN service_type ILIKE '%Sunday%'
              THEN 1
            ELSE 0
          END,

          CASE
            WHEN service_type ILIKE '%Midweek%'
              THEN 1
            ELSE 0
          END,

          visit_date,
          visit_date

        FROM visitors

        WHERE visit_date
          BETWEEN $1 AND $2
      ) combined

      GROUP BY week
      ORDER BY week
      `,
      [start, end]
    );

    res.json({
      weeks: result.rows,
    });

  } catch (err) {
    console.error(
      "Weekly Attendance Chart Error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
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
      SELECT
        week,
        SUM(income) AS income,
        SUM(expense) AS expense

      FROM (
        SELECT
          CASE
            WHEN EXTRACT(DAY FROM date_received)
              BETWEEN 1 AND 7
              THEN 'Week 1'

            WHEN EXTRACT(DAY FROM date_received)
              BETWEEN 8 AND 14
              THEN 'Week 2'

            WHEN EXTRACT(DAY FROM date_received)
              BETWEEN 15 AND 21
              THEN 'Week 3'

            WHEN EXTRACT(DAY FROM date_received)
              BETWEEN 22 AND 28
              THEN 'Week 4'

            ELSE 'Week 5'
          END AS week,

          amount AS income,
          0 AS expense

        FROM income

        WHERE date_received
          BETWEEN $1 AND $2

        UNION ALL

        SELECT
          CASE
            WHEN EXTRACT(DAY FROM date_spent)
              BETWEEN 1 AND 7
              THEN 'Week 1'

            WHEN EXTRACT(DAY FROM date_spent)
              BETWEEN 8 AND 14
              THEN 'Week 2'

            WHEN EXTRACT(DAY FROM date_spent)
              BETWEEN 15 AND 21
              THEN 'Week 3'

            WHEN EXTRACT(DAY FROM date_spent)
              BETWEEN 22 AND 28
              THEN 'Week 4'

            ELSE 'Week 5'
          END AS week,

          0,
          amount

        FROM expenditure

        WHERE date_spent
          BETWEEN $1 AND $2
      ) combined

      GROUP BY week
      ORDER BY week
      `,
      [start, end]
    );

    res.json({
      weeks: result.rows,
    });

  } catch (err) {
    console.error(
      "Weekly Finance Chart Error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
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
        message: "Start and end date required",
      });
    }

    // ==========================================
    // OPENING WELFARE INCOME
    // ==========================================

    const openingIncome = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM welfare_funds
      WHERE date_paid < $1
      `,
      [start]
    );

    // ==========================================
    // OPENING DIRECT INCOME
    // ==========================================

    const directIncome = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total
      FROM welfare_direct_income
      WHERE date_received < $1
      `,
      [start]
    );

    // ==========================================
    // OPENING EXPENSE
    // ==========================================

    const expense = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total
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

    // ==========================================
    // EVENT INCOME
    // ==========================================

    const eventIncome = await pool.query(
      `
      SELECT
        we.event_type AS source,
        SUM(wf.amount) AS total
      FROM welfare_funds wf

      JOIN welfare_event_members wem
        ON wf.event_member_id = wem.id

      JOIN welfare_events we
        ON wem.event_id = we.id

      WHERE wf.date_paid
        BETWEEN $1 AND $2

      GROUP BY we.event_type
      `,
      [start, end]
    );

    // ==========================================
    // DIRECT WELFARE INCOME
    // ==========================================

    const directIncomePeriod = await pool.query(
      `
      SELECT
        source,
        SUM(amount) AS total
      FROM welfare_direct_income
      WHERE date_received
        BETWEEN $1 AND $2
      GROUP BY source
      `,
      [start, end]
    );

    const income = [
      ...eventIncome.rows,
      ...directIncomePeriod.rows,
    ];

    // ==========================================
    // WELFARE EXPENSES
    // ==========================================

    const expensePeriod = await pool.query(
      `
      SELECT
        et.name AS category,
        SUM(we.amount) AS total
      FROM welfare_expenses we

      JOIN welfare_expense_types et
        ON we.expense_type_id = et.id

      WHERE we.date_spent
        BETWEEN $1 AND $2

      AND we.status = 'APPROVED'

      GROUP BY et.name
      `,
      [start, end]
    );

    const expenses = expensePeriod.rows;

    // ==========================================
    // TOTALS
    // ==========================================

    const totalIncome = income.reduce(
      (s, i) => s + Number(i.total),
      0
    );

    const totalExpense = expenses.reduce(
      (s, e) => s + Number(e.total),
      0
    );

    const closingBalance =
      openingBalance +
      totalIncome -
      totalExpense;

    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      start,
      end,

      openingBalance,

      income,
      expenses,

      totalIncome,
      totalExpense,
      closingBalance,
    });

  } catch (err) {
    console.error(
      "Welfare Report Error:",
      err
    );

    res.status(500).json({
      message: "Failed to generate welfare report",
    });
  }
};


/**
 * ❌ DELETE SINGLE REPORT
 */
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM reports
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Report not found",
      });
    }

    res.json({
      message: "Report deleted successfully",
    });

  } catch (err) {
    console.error(
      "Delete Report Error:",
      err
    );

    res.status(500).json({
      message: "Failed to delete report",
    });
  }
};


/**
 * 🧹 CLEAR ALL REPORT HISTORY
 */
const clearReports = async (req, res) => {
  try {
    await pool.query(`
      DELETE FROM reports
    `);

    res.json({
      message: "All reports cleared successfully",
    });

  } catch (err) {
    console.error(
      "Clear Reports Error:",
      err
    );

    res.status(500).json({
      message: "Failed to clear reports",
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
  welfareReport,
  deleteReport,
  clearReports,
};