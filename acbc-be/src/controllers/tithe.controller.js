import pool from "../services/db.js";
import { logActivity } from "./activity.controller.js";

/**
 * Generate unique tithe code
 */
const generateTitheCode = async (memberCode, datePaid, client = pool) => {
  const result = await client.query(
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
    .replace(/-/g, "");

  return `${datePart}-${memberCode}-${String(seq).padStart(3, "0")}`;
};


/**
 * Get Main Church fund
 *
 * Tithes always belong to Main Church.
 */
const getMainChurchFund = async (client = pool) => {
  const result = await client.query(
    `
    SELECT id
    FROM funds
    WHERE fund_code = 'MAIN'
      AND is_active = TRUE
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error("Main Church fund not found");
  }

  return result.rows[0].id;
};


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

    if (!member_id || !amount || !date_paid || !recorded_by || !member_code) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    await client.query("BEGIN");

    // Tithes always belong to Main Church
    const mainFundId = await getMainChurchFund(client);

    // Generate tithe code
    const titheCode = await generateTitheCode(
      member_code,
      date_paid,
      client
    );

    // Create tithe
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
        created_at,
        member_code
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

    // Get member name
    const memberResult = await client.query(
      `
      SELECT first_name, last_name
      FROM members
      WHERE id = $1
      `,
      [member_id]
    );

    const memberName = memberResult.rows.length
      ? `${memberResult.rows[0].first_name} ${memberResult.rows[0].last_name}`
      : `Member ${member_id}`;

    // Mirror tithe into income
    await client.query(
      `
      INSERT INTO income (
        income_type,
        amount,
        source_description,
        date_received,
        recorded_by,
        tithe_id,
        created_at,
        fund_id
      )
      VALUES (
        'Tithe',
        $1,
        $2,
        $3,
        $4,
        $5,
        NOW(),
        $6
      )
      `,
      [
        amount,
        `Tithe from member ${memberName}`,
        date_paid,
        recorded_by,
        titheId,
        mainFundId
      ]
    );

    await client.query("COMMIT");

    await logActivity(
      "finance",
      `Tithe recorded: GHS ${amount} - ${memberName}`
    );

    res.status(201).json({
      message: "Tithe recorded",
      tithe_code: titheCode
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("ADD TITHE ERROR:", err);

    res.status(500).json({
      message: "Error saving tithe"
    });

  } finally {
    client.release();
  }
};


/* ================= GET ALL TITHES ================= */

const getAllTithes = async (req, res) => {
  try {
    const result = await pool.query(
      `
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
      LEFT JOIN members m
        ON t.member_id = m.id
      ORDER BY t.date_paid DESC
      `
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET TITHES ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= GET TITHES BY MEMBER ================= */

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
    console.error("GET MEMBER TITHES ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


/* ================= BULK TITHE ================= */

const addBulkTithes = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      date_paid,
      recorded_by,
      tithes
    } = req.body;

    if (!date_paid || !recorded_by || !Array.isArray(tithes)) {
      return res.status(400).json({
        message: "Invalid bulk tithe data"
      });
    }

    await client.query("BEGIN");

    // All bulk tithes belong to Main Church
    const mainFundId = await getMainChurchFund(client);

    let inserted = 0;

    for (const t of tithes) {

      if (!t.member_id || !t.amount || !t.member_code) {
        continue;
      }

      // Generate unique code
      const code = await generateTitheCode(
        t.member_code,
        date_paid,
        client
      );

      // Insert tithe
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
        [
          code,
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

      // Get member name
      const memberResult = await client.query(
        `
        SELECT first_name, last_name
        FROM members
        WHERE id = $1
        `,
        [t.member_id]
      );

      const memberName = memberResult.rows.length
        ? `${memberResult.rows[0].first_name} ${memberResult.rows[0].last_name}`
        : `Member ${t.member_id}`;

      // Mirror into income
      await client.query(
        `
        INSERT INTO income (
          income_type,
          amount,
          source_description,
          date_received,
          recorded_by,
          tithe_id,
          created_at,
          fund_id
        )
        VALUES (
          'Tithe',
          $1,
          $2,
          $3,
          $4,
          $5,
          NOW(),
          $6
        )
        `,
        [
          t.amount,
          `Tithe from member ${memberName}`,
          date_paid,
          recorded_by,
          titheId,
          mainFundId
        ]
      );

      inserted++;
    }

    await client.query("COMMIT");

    await logActivity(
      "finance",
      `Bulk tithe recorded: ${inserted} tithe(s)`
    );

    res.status(201).json({
      message: "Bulk saved",
      count: inserted
    });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("BULK TITHE ERROR:", err);

    res.status(500).json({
      message: err.message
    });

  } finally {
    client.release();
  }
};


/* ================= UPDATE TITHE ================= */

const updateTithe = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    const {
      amount,
      payment_method,
      payment_reference,
      date_paid
    } = req.body;

    if (!amount || !date_paid) {
      return res.status(400).json({
        message: "Amount and date are required"
      });
    }

    await client.query("BEGIN");

    // Make sure tithe exists
    const titheCheck = await client.query(
      `
      SELECT id
      FROM tithes
      WHERE id = $1
      `,
      [id]
    );

    if (titheCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Tithe not found"
      });
    }

    // Update tithe
    await client.query(
      `
      UPDATE tithes
      SET
        amount = $1,
        payment_method = $2,
        payment_reference = $3,
        date_paid = $4
      WHERE id = $5
      `,
      [
        amount,
        payment_method || null,
        payment_reference || null,
        date_paid,
        id
      ]
    );

    // Get Main Church fund
    const mainFundId = await getMainChurchFund(client);

    // Update mirrored income
    await client.query(
      `
      UPDATE income
      SET
        amount = $1,
        date_received = $2,
        fund_id = $3
      WHERE tithe_id = $4
      `,
      [
        amount,
        date_paid,
        mainFundId,
        id
      ]
    );

    await client.query("COMMIT");

    await logActivity(
      "finance",
      `Tithe updated: ID ${id} - GHS ${amount}`
    );

    res.json({
      message: "Updated"
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("UPDATE TITHE ERROR:", error);

    res.status(500).json({
      message: "Update failed"
    });

  } finally {
    client.release();
  }
};


/* ================= DELETE TITHE ================= */

const deleteTithe = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Make sure tithe exists
    const titheCheck = await client.query(
      `
      SELECT id
      FROM tithes
      WHERE id = $1
      `,
      [id]
    );

    if (titheCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Tithe not found"
      });
    }

    // Delete mirrored income first
    await client.query(
      `
      DELETE FROM income
      WHERE tithe_id = $1
      `,
      [id]
    );

    // Delete actual tithe
    await client.query(
      `
      DELETE FROM tithes
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    await logActivity(
      "finance",
      `Tithe deleted: ID ${id}`
    );

    res.json({
      message: "Deleted"
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error("DELETE TITHE ERROR:", error);

    res.status(500).json({
      message: "Delete failed"
    });

  } finally {
    client.release();
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