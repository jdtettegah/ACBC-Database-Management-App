import pool from '../services/db.js';
import { randomUUID } from "crypto";

/* ================= HELPERS ================= */

const generateEventCode = (type, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (type === "DUES") return `DUES-${year}-${month}`;
  return `SPC-${Date.now()}`;
};

const generateWelfareCode = async (client, datePaid) => {
  const result = await client.query(
    `SELECT COUNT(*) AS count
     FROM welfare_funds
     WHERE date_paid = $1`,
    [datePaid]
  );

  const seq = parseInt(result.rows[0].count) + 1;
  const datePart = new Date(datePaid).toISOString().slice(0, 10).replace(/-/g, '');

  return `${datePart}-WF-${String(seq).padStart(3, '0')}`;
};

/* ================= CREATE EVENT ================= */

const createEvent = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      event_name,
      event_type,
      default_amount,
      created_by,
      event_date
    } = req.body;

    // 🔒 BASIC VALIDATION
    if (!event_type || !default_amount || !created_by) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await client.query("BEGIN");

    // ================= DUES =================
    if (event_type === "DUES") {
      // Use frontend date if provided, else fallback
      const baseDate = event_date ? new Date(event_date) : new Date();
      const year = baseDate.getFullYear();

      for (let m = 0; m < 12; m++) {
        const date = new Date(year, m, 1);
        const code = generateEventCode("DUES", date);

        // جلوگیری duplicates
        const check = await client.query(
          `SELECT id FROM welfare_events WHERE event_code = $1`,
          [code]
        );

        if (check.rows.length > 0) continue;

        // Create event
        const result = await client.query(
          `INSERT INTO welfare_events
           (event_code, event_name, event_type, default_amount, event_date, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            code,
            `Welfare Dues - ${date.toLocaleString("default", {
              month: "long"
            })} ${year}`,
            "DUES",
            default_amount,
            date,
            created_by
          ]
        );

        const eventId = result.rows[0].id;

        // Assign members
        await client.query(
          `INSERT INTO welfare_event_members (event_id, member_id, expected_amount)
           SELECT $1, id, $2 FROM members WHERE is_deleted = false`,
          [eventId, default_amount]
        );
      }

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Yearly dues created"
      });
    }

    // ================= SPECIAL =================

    if (!event_name || !event_date) {
      return res
        .status(400)
        .json({ message: "Event name and date are required for SPECIAL events" });
    }

    const code = generateEventCode("SPECIAL");

    const date = new Date(event_date); // ✅ from frontend

    const result = await client.query(
      `INSERT INTO welfare_events
       (event_code, event_name, event_type, default_amount, event_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [code, event_name, "SPECIAL", default_amount, date, created_by]
    );

    const eventId = result.rows[0].id;

    await client.query(
      `INSERT INTO welfare_event_members (event_id, member_id, expected_amount)
       SELECT $1, id, $2 FROM members WHERE is_deleted = false`,
      [eventId, default_amount]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      event_id: eventId
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CREATE EVENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

/* ================= BULK PAYMENT ================= */

const recordBulkPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { payments, date_paid, recorded_by } = req.body;

    if (!payments || payments.length === 0) {
      return res.status(400).json({ message: "No payments provided" });
    }

    await client.query('BEGIN');

    for (let p of payments) {
      const { event_member_id, amount, payment_method, payment_reference } = p;

      const check = await client.query(
        `SELECT expected_amount, total_paid
         FROM welfare_event_members
         WHERE id = $1`,
        [event_member_id]
      );

      if (check.rows.length === 0) continue;

      const member = check.rows[0];

      if (member.total_paid + amount > member.expected_amount) continue;

      const code = await generateWelfareCode(client, date_paid);

      await client.query(
        `INSERT INTO welfare_funds
         (welfare_code, event_member_id, amount, payment_method, payment_reference, date_paid, recorded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          code,
          event_member_id,
          amount,
          payment_method || "Cash",
          payment_reference || null,
          date_paid,
          recorded_by
        ]
      );

      await client.query(
        `UPDATE welfare_event_members
         SET total_paid = total_paid + $1,
             status = CASE
               WHEN total_paid + $1 < expected_amount THEN 'PARTIAL'
               ELSE 'PAID'
             END
         WHERE id = $2`,
        [amount, event_member_id]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Bulk payments recorded",
      count: payments.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: "Bulk payment failed" });
  } finally {
    client.release();
  }
};

/* ================= GET ================= */

const getEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM welfare_events ORDER BY event_code ASC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEventMembersFull = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT wem.id AS event_member_id,
              wem.expected_amount,
              wem.total_paid,
              wem.status,
              m.first_name,
              m.last_name
       FROM welfare_event_members wem
       JOIN members m ON wem.member_id = m.id
       WHERE wem.event_id = $1 and m.is_deleted = false`,
      [req.params.eventId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= SINGLE PAYMENT ================= */

const recordSinglePayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      event_member_id,
      amount,
      payment_method,
      payment_reference,
      date_paid,
      recorded_by
    } = req.body;

    await client.query('BEGIN');

    const check = await client.query(
      `SELECT expected_amount, total_paid
       FROM welfare_event_members
       WHERE id = $1`,
      [event_member_id]
    );

    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Invalid member" });
    }

    const member = check.rows[0];

    if (member.total_paid + amount > member.expected_amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Exceeds expected amount" });
    }

    const code = await generateWelfareCode(client, date_paid);

    await client.query(
      `INSERT INTO welfare_funds
       (welfare_code, event_member_id, amount, payment_method, payment_reference, date_paid, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        code,
        event_member_id,
        amount,
        payment_method || "Cash",
        payment_reference || null,
        date_paid,
        recorded_by
      ]
    );

    await client.query(
      `UPDATE welfare_event_members
       SET total_paid = total_paid + $1,
           status = CASE
             WHEN total_paid + $1 < expected_amount THEN 'PARTIAL'
             ELSE 'PAID'
           END
       WHERE id = $2`,
      [amount, event_member_id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: "Payment successful" });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: "Payment failed" });
  } finally {
    client.release();
  }
};

/* ================= HISTORY ================= */

const getMemberFullHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT we.event_name,
              wem.expected_amount,
              wf.amount,
              wf.payment_method,
              wf.payment_reference,
              wf.date_paid
       FROM welfare_funds wf
       JOIN welfare_event_members wem ON wf.event_member_id = wem.id
       JOIN welfare_events we ON wem.event_id = we.id
       WHERE wem.member_id = (
         SELECT member_id FROM welfare_event_members WHERE id = $1
       )
       ORDER BY wf.date_paid DESC`,
      [req.params.event_member_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

/* ================= DAY BORN SPLIT ================= */

const addDayBornSplit = async (req, res) => {
  const client = await pool.connect();
  const groupId = randomUUID();

  try {
    const {
      total_amount,
      welfare_amount,
      description,
      approved_by = 1,
      recorded_by,
      date_received
    } = req.body;

    if (
      total_amount === undefined ||
      welfare_amount === undefined ||
      !date_received
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const total = Number(total_amount);
    const welfare = Number(welfare_amount);

    if (welfare > total) {
      return res.status(400).json({ message: "Invalid split" });
    }

    await client.query("BEGIN");

    // 1. Income
    await client.query(
      `INSERT INTO income
       (income_type, amount, source_description, recorded_by, date_received, transaction_group_id)
       VALUES ('Day Born Offering', $1, $2, $3, $4, $5)`,
      [total, description, recorded_by, date_received, groupId]
    );

    // 2. Expenditure
    await client.query(
      `INSERT INTO expenditure
       (category, amount, description, approved_by, recorded_by, date_spent, transaction_group_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "Welfare Transfer",
        welfare,
        "Transfer from Day Born Offering",
        approved_by,
        recorded_by,
        date_received,
        groupId
      ]
    );

    // 3. Welfare income
    await client.query(
      `INSERT INTO welfare_direct_income
       (source, amount, description, recorded_by, date_received, transaction_group_id)
       VALUES ('Day Born Offering', $1, $2, $3, $4, $5)`,
      [welfare, description, recorded_by, date_received, groupId]
    );

    await client.query("COMMIT");

    res.json({ success: true, message: "Split successful" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Day Born Split Error:", err);
    res.status(500).json({ message: "Transaction failed" });
  } finally {
    client.release();
  }
};

const getIncomeLedger = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        wf.id,
        wf.date_paid AS transaction_date,
        CONCAT(m.first_name, ' ', m.last_name) AS source,
        'Welfare Dues' AS income_type,
        we.event_name AS description,
        wf.payment_method,
        wf.amount

      FROM welfare_funds wf

      JOIN welfare_event_members wem
        ON wf.event_member_id = wem.id

      JOIN members m
        ON wem.member_id = m.id

      JOIN welfare_events we
        ON wem.event_id = we.id

      UNION ALL

      SELECT
        wdi.id,
        wdi.date_received AS transaction_date,
        wdi.source,
        'Direct Income' AS income_type,
        wdi.description,
        '-' AS payment_method,
        wdi.amount

      FROM welfare_direct_income wdi

      ORDER BY transaction_date DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch income ledger"
    });
  }
};


const getExpenseLedger = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        we.id,
        we.expense_code,
        we.title,
        we.description,
        we.amount,
        we.status,
        we.date_spent,

        et.name AS expense_type,

        CONCAT(
          COALESCE(m.first_name, ''),
          ' ',
          COALESCE(m.last_name, '')
        ) AS beneficiary

      FROM welfare_expenses we

      JOIN welfare_expense_types et
        ON we.expense_type_id = et.id

      LEFT JOIN members m
        ON we.beneficiary_member_id = m.id

      ORDER BY we.date_spent DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch expense ledger"
    });
  }
};


export default {
  createEvent,
  recordBulkPayment,
  getEvents,
  getEventMembersFull,
  recordSinglePayment,
  getMemberFullHistory,
  addDayBornSplit,
  getIncomeLedger,
  getExpenseLedger
};