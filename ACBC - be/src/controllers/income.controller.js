const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");

/**
 * CREATE INCOME
 * POST /api/income
 */
exports.addIncome = async (req, res) => {
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
            message: 'income_type, amount, and date_received are required'
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('income_type', sql.NVarChar, income_type)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('source_description', sql.NVarChar, source_description || null)
            .input('member_id', sql.Int, member_id || null)
            .input('recorded_by', sql.Int, recorded_by ) 
            .input('date_received', sql.Date, date_received)
            .query(`
                INSERT INTO Income
                (income_type, amount, source_description, member_id, recorded_by, date_received)
                VALUES
                (@income_type, @amount, @source_description, @member_id, @recorded_by, @date_received)
            `);

        res.status(201).json({
            message: 'Income recorded successfully'
        });

        await logActivity(
            "finance",
            `Income recorded: ${income_type} - GHS ${amount}`
          );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to record income' });
    }
};


/**
 * GET ALL INCOME
 * GET /api/income
 */
exports.getAllIncome = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT *
            FROM Income
            ORDER BY date_received DESC
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch income' });
    }
};


/**
 * GET INCOME BY DATE RANGE
 * GET /api/income/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
exports.getIncomeByDateRange = async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({
            message: 'Start and end dates are required'
        });
    }

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('start', sql.Date, start)
            .input('end', sql.Date, end)
            .query(`
                SELECT *
                FROM Income
                WHERE date_received BETWEEN @start AND @end
                ORDER BY date_received DESC
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch income' });
    }
};
