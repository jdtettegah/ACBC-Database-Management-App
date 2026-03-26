// src/controllers/tithe.controller.js

const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");

/**
 * Generate unique tithe code
 * Format: YYYYMMDD-MEMBERID-XXX
 */
const generateTitheCode = async (pool, memberCode, datePaid) => {
  const result = await pool.request()
    .input('member_code', sql.VarChar, memberCode)
    .input('date_paid', sql.Date, datePaid)
    .query(`
      SELECT COUNT(*) AS count
      FROM Tithes
      WHERE member_code = @member_code
        AND date_paid = @date_paid
    `);

  const seq = result.recordset[0].count + 1;
  const datePart = new Date(datePaid).toISOString().slice(0,10).replace(/-/g, '');
  return `${datePart}-${memberCode}-${String(seq).padStart(3,'0')}`;
};


/**
 * POST /api/tithes
 */
const addTithe = async (req, res) => {

  try {

    const {
      member_id,
      amount,
      payment_method,
      payment_reference,
      date_paid,
      recorded_by
    } = req.body;

    if (!member_id || !amount || !date_paid) {
      return res.status(400).json({
        message: 'member_id, amount and date_paid are required'
      });
    }

    const pool = await poolPromise;


    // Check member exists
    const memberCheck = await pool.request()
      .input('member_id', sql.VarChar, member_id)
      .query(`
        SELECT id
        FROM Members
        WHERE member_id = @member_id
      `);

    if (memberCheck.recordset.length === 0) {
      return res.status(404).json({
        message: 'Member not found'
      });
    }


    // Generate code
    const titheCode = await generateTitheCode(
      pool,
      member_id,
      date_paid
    );


    // Insert tithe
    await pool.request()
      .input('tithe_code', sql.VarChar, titheCode)
      .input('member_id', sql.VarChar, member_id)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('payment_method', sql.VarChar, payment_method || null)
      .input('payment_reference', sql.VarChar, payment_reference || null)
      .input('date_paid', sql.Date, date_paid)
      .input('recorded_by', sql.Int, recorded_by || null)
      .query(`
        INSERT INTO Tithes
        (
          tithe_code,
          member_id,
          amount,
          payment_method,
          payment_reference,
          date_paid,
          recorded_by,
          created_at
        )
        VALUES
        (
          @tithe_code,
          @member_id,
          @amount,
          @payment_method,
          @payment_reference,
          @date_paid,
          @recorded_by,
          GETDATE()
        )
      `);

      

    res.status(201).json({
      message: 'Tithe recorded successfully',
      tithe_code: titheCode
    });

    await logActivity(
      "tithe",
      `Tithe recorded: Member ${member_id} - GHS ${amount}`
    );


  } catch (error) {

    console.error('Add Tithe Error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};



/**
 * GET /api/tithes
 */
/**
 * GET /api/tithes
 * Returns all tithes with member names and codes
 */
/**
 * GET /api/tithes
 * Returns all tithes with member info
 */
const getAllTithes = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        t.id,
        t.tithe_code,
        t.member_id,
        t.member_code,
        t.amount,
        t.payment_method,
        t.payment_reference,
        t.date_paid,
        t.recorded_by,
        t.created_at,
        m.first_name,
        m.last_name
      FROM Tithes t
      LEFT JOIN Members m ON t.member_id = m.id
      ORDER BY t.date_paid DESC
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Get Tithes Error:', error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};


/**
 * GET /api/tithes/member/:memberId
 */
const getTithesByMember = async (req, res) => {

  try {

    const { memberId } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input('member_id', sql.VarChar, memberId)
      .query(`
        SELECT *
        FROM Tithes
        WHERE member_id = @member_id
        ORDER BY date_paid DESC
      `);

    res.json(result.recordset);

  } catch (error) {

    console.error('Get Member Tithes Error:', error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};



/**
 * POST /api/tithes/bulk
 */
const addBulkTithes = async (req, res) => {
  try {
    const { date_paid, recorded_by, tithes } = req.body;
    if (!date_paid || !Array.isArray(tithes)) {
      return res.status(400).json({ message: "date_paid and tithes array required" });
    }

    const pool = await poolPromise;
    let inserted = 0;
    let totalAmount = 0;

    for (let t of tithes) {
      if (!t.member_id || !t.amount || t.amount <= 0) continue;

      const memberCode = t.member_code;
      const titheCode = await generateTitheCode(pool, memberCode, date_paid);

      await pool.request()
        .input("tithe_code", sql.VarChar, titheCode)
        .input("member_id", sql.Int, t.member_id)
        .input("member_code", sql.VarChar, memberCode)
        .input("amount", sql.Decimal(18, 2), t.amount)
        .input("date_paid", sql.Date, date_paid)
        .input("recorded_by", sql.Int, recorded_by || null)
        .input("payment_method", sql.VarChar, t.payment_method || "Cash")
        .input("payment_reference", sql.VarChar, t.payment_reference || null)
        .query(`
          INSERT INTO Tithes
          (
            tithe_code,
            member_id,
            member_code,
            amount,
            date_paid,
            recorded_by,
            payment_method,
            payment_reference,
            created_at
          )
          VALUES
          (
            @tithe_code,
            @member_id,
            @member_code,
            @amount,
            @date_paid,
            @recorded_by,
            @payment_method,
            @payment_reference,
            GETDATE()
          )
        `);

      inserted++;
      totalAmount += parseFloat(t.amount);
    }

    // Record total tithe as income for that date
    if (totalAmount > 0) {
      await pool.request()
        .input("income_type", sql.VarChar, "Tithe")
        .input("amount", sql.Decimal(18,2), totalAmount)
        .input("source_description", sql.VarChar, `Tithe collection for ${date_paid}`)
        .input("date_received", sql.Date, date_paid)
        .input("recorded_by", sql.Int, recorded_by)
        .query(`
          INSERT INTO Income
          (
            income_type,
            amount,
            source_description,
            date_received,
            recorded_by,
            created_at
          )
          VALUES
          (
            @income_type,
            @amount,
            @source_description,
            @date_received,
            @recorded_by,
            GETDATE()
          )
        `);
    }

    

    res.json({ message: "Bulk tithe saved", count: inserted, total_amount: totalAmount });

    await logActivity(
      "tithe",
      `Bulk tithe recorded (${inserted} members, Total: GHS ${totalAmount})`
    );

  } catch (error) {
    console.error('Bulk Tithe Error:', error);
    res.status(500).json({ message: "Bulk save failed" });
  }
};

/**
 * GET /api/reports/tithes/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns total tithes and total members for a period
 */


module.exports = {
  addTithe,
  getAllTithes,
  getTithesByMember,
  addBulkTithes, 
  generateTitheCode,
};