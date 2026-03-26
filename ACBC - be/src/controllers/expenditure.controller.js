const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");

/**
 * CREATE EXPENDITURE
 * POST /api/expenditure
 */
exports.addExpenditure = async (req, res) => {
    const {
        category,
        amount,
        description,
        approved_by,
        recorded_by,
        date_spent
    } = req.body;

    if (!category || !amount || !date_spent) {
        return res.status(400).json({
            message: 'Category, amount, and date_spent are required'
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('category', sql.NVarChar, category)
            .input('amount', sql.Decimal(10, 2), amount)
            .input('description', sql.NVarChar, description || null)
            .input('approved_by', sql.Int, approved_by)
            .input('recorded_by', sql.Int, recorded_by )
            .input('date_spent', sql.Date, date_spent)
            .query(`
                INSERT INTO Expenditure
                (category, amount, description, approved_by, recorded_by, date_spent)
                VALUES
                (@category, @amount, @description, @approved_by, @recorded_by, @date_spent)
            `);

            await logActivity(
                "finance",
                `Expense recorded: ${category} - GHS ${amount}`
              );

        res.status(201).json({
            message: 'Expenditure recorded successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to record expenditure' });
    }
};


/**
 * GET ALL EXPENDITURE
 * GET /api/expenditure
 */
exports.getAllExpenditure = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request().query(`
            SELECT *
            FROM Expenditure
            ORDER BY date_spent DESC
        `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch expenditure' });
    }
};


/**
 * GET EXPENDITURE BY DATE RANGE
 * GET /api/expenditure/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
exports.getExpenditureByDateRange = async (req, res) => {
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
                FROM Expenditure
                WHERE date_spent BETWEEN @start AND @end
                ORDER BY date_spent DESC
            `);

        res.json(result.recordset);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch expenditure' });
    }
};
