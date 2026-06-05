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
/* ================= ADD TITHE ================= */

const addTithe = async (req, res) => {
  const client = await pool.connect();

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
      return res.status(400).json({ message: "Required fields missing" });
    }

    await client.query("BEGIN");

    const titheCode = await generateTitheCode(member_code, date_paid);

    const result = await client.query(
      `
      INSERT INTO tithes (
        tithe_code, member_id, amount,
        payment_method, payment_reference,
        date_paid, recorded_by, created_at, member_code
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)
      RETURNING id
      `,
      [
        titheCode,
        member_id,
        amount,
        payment_method || null,
        payment_reference || null,
        date_paid,
        recorded_by,
        member_code
      ]
    );
    
    const titheId = result.rows[0].id;

    // 🔥 mirror to income
    await client.query(
      `
      INSERT INTO income (
        income_type,
        amount,
        source_description,
        date_received,
        recorded_by,
        tithe_id,
        created_at
      )
      VALUES ('Tithe',$1,$2,$3,$4,$5,NOW())
      `,
      [
        amount,
        `Tithe from member ${member_id}`,
        date_paid,
        recorded_by,
        titheId
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({ message: "Tithe recorded", tithe_code: titheCode });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Error saving tithe" });
  } finally {
    client.release();
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
        t.member_code,
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

/* ================= BULK TITHE ================= */

const addBulkTithes = async (req, res) => {
  const client = await pool.connect();

  try {
    const { date_paid, recorded_by, tithes } = req.body;

    await client.query("BEGIN");

    let inserted = 0;

    for (const t of tithes) {
      if (!t.member_id || !t.amount) continue;

      const code = await generateTitheCode(t.member_code, date_paid);

      const result = await client.query(
        `
        INSERT INTO tithes (
          tithe_code, 
          member_id, 
          amount,
          payment_method,
          payment_reference,
          date_paid, 
          recorded_by, 
          member_code
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
        `,
        [code,
          t.member_id,
          t.amount,
          t.payment_method || "Cash",
          t.payment_reference || null,
          date_paid,
          recorded_by,
          t.member_code
        ]
      );

      const titheId = result.rows[0].id;
      await client.query(
        `
        INSERT INTO income (
          income_type, amount,
          source_description,
          date_received,
          recorded_by,
          tithe_id,
          created_at
        )
        VALUES ('Tithe',$1,$2,$3,$4,$5,NOW())
        `,
        [
          t.amount,
          `Tithe from member ${t.member_id}`,
          date_paid,
          recorded_by,
          titheId
        ]
      );

      inserted++;
    }

    await client.query("COMMIT");

    res.json({ message: "Bulk saved", count: inserted });

  } catch (err) {
    await client.query("ROLLBACK");
  
    console.error("BULK TITHE ERROR:");
    console.error(err);
  
    res.status(500).json({
      message: err.message
    });
  }
};
/* ✏️ UPDATE TITHE */
/* ================= UPDATE ================= */

const updateTithe = async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method, payment_reference, date_paid } = req.body;

  try {
    await pool.query(
      `
      UPDATE tithes
      SET amount=$1, payment_method=$2,
          payment_reference=$3, date_paid=$4
      WHERE id=$5
      `,
      [amount, payment_method, payment_reference, date_paid, id]
    );

    // 🔥 sync income
    await pool.query(
      `
      UPDATE income
      SET amount=$1, date_received=$2
      WHERE tithe_id=$3
      `,
      [amount, date_paid, id]
    );

    res.json({ message: "Updated" });

  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

/* ================= DELETE ================= */

const deleteTithe = async (req, res) => {
  const { id } = req.params;

  try {
    // 🔥 delete mirror first
    await pool.query(
      `DELETE FROM income WHERE tithe_id=$1`,
      [id]
    );

    await pool.query(`DELETE FROM tithes WHERE id=$1`, [id]);

    res.json({ message: "Deleted" });

  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};


export default {
  addTithe,
  getAllTithes,
  getTithesByMember,
  addBulkTithes,
  generateTitheCode,
  updateTithe,
  deleteTithe
};



