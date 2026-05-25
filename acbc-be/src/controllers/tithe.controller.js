import pool from '../services/db.js';
import { logActivity } from "./activity.controller.js";

/**
 * Generate unique tithe code
 */
const generateTitheCode = async (memberCode, datePaid) => {
  const result = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM tithes
    WHERE member_code = $1
      AND date_paid = $2
    `,
    [memberCode, datePaid]
  );

  const seq = Number(result.rows[0].count) + 1;

  const datePart = new Date(datePaid)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  return `${datePart}-${memberCode}-${String(seq).padStart(3, "0")}`;
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
      recorded_by,
      member_code
    } = req.body;

    if (!member_id || !amount || !date_paid) {
      return res.status(400).json({
        message: "member_id, amount and date_paid are required"
      });
    }

    // Check member exists
    const memberCheck = await pool.query(
      `
      SELECT id
      FROM members
      WHERE id = $1
      `,
      [member_id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Generate code
    const titheCode = await generateTitheCode(member_code, date_paid);

    await pool.query(
      `
      INSERT INTO tithes (
        tithe_code,
        member_id,
        amount,
        payment_method,
        payment_reference,
        date_paid,
        recorded_by,
        created_at,
        member_code
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)
      `,
      [
        titheCode,
        member_id,
        amount,
        payment_method || null,
        payment_reference || null,
        date_paid,
        recorded_by || null,
        member_code
      ]
    );

    res.status(201).json({
      message: "Tithe recorded successfully",
      tithe_code: titheCode
    });

    await logActivity(
      "tithe",
      `Tithe recorded: Member ${member_id} - GHS ${amount}`
    );

  } catch (error) {
    console.error("Add Tithe Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllTithes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.tithe_code,
        t.member_id,
        t.amount,
        t.payment_method,
        t.payment_reference,
        t.date_paid,
        t.recorded_by,
        t.created_at,
        m.first_name,
        m.last_name
      FROM tithes t
      LEFT JOIN members m ON t.member_id = m.id
      ORDER BY t.date_paid DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Get Tithes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getTithesByMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM tithes
      WHERE member_id = $1
      ORDER BY date_paid DESC
      `,
      [memberId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Get Member Tithes Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addBulkTithes = async (req, res) => {
  try {
    const { date_paid, recorded_by, tithes } = req.body;

    if (!date_paid || !Array.isArray(tithes)) {
      return res.status(400).json({
        message: "date_paid and tithes array required"
      });
    }

    let inserted = 0;
    let totalAmount = 0;

    for (const t of tithes) {
      if (!t.member_id || !t.amount || t.amount <= 0) continue;

      const titheCode = await generateTitheCode(t.member_code, date_paid);

      await pool.query(
        `
        INSERT INTO tithes (
          tithe_code,
          member_id,
          amount,
          date_paid,
          recorded_by,
          payment_method,
          payment_reference,
          created_at,
          member_code
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)
        `,
        [
          titheCode,
          t.member_id,
          t.amount,
          date_paid,
          recorded_by || null,
          t.payment_method || "Cash",
          t.payment_reference || null,
          t.member_code
        ]
      );

      inserted++;
      totalAmount += Number(t.amount);
    }

    // record income
    if (totalAmount > 0) {
      await pool.query(
        `
        INSERT INTO income (
          income_type,
          amount,
          source_description,
          date_received,
          recorded_by,
          created_at
        )
        VALUES ('Tithe', $1, $2, $3, $4, NOW())
        `,
        [
          totalAmount,
          `Tithe collection for ${date_paid}`,
          date_paid,
          recorded_by
        ]
      );
    }

    res.json({
      message: "Bulk tithe saved",
      count: inserted,
      total_amount: totalAmount
    });

    logActivity(
      "tithe",
      `Bulk tithe recorded (${inserted} members, Total: GHS ${totalAmount})`
    );

  } catch (error) {
    console.error("Bulk Tithe Error:", error);
    res.status(500).json({ message: "Bulk save failed" });
  }
};

export default {
  addTithe,
  getAllTithes,
  getTithesByMember,
  addBulkTithes,
  generateTitheCode
};



