// src/controllers/welfare.controller.js

const { poolPromise, sql } = require('../services/db');

/* ================= HELPERS ================= */

const generateEventCode = (type, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (type === "DUES") return `DUES-${year}-${month}`;
  return `SPC-${Date.now()}`;
};

const generateWelfareCode = async (pool, datePaid) => {
  const result = await pool.request()
    .input('date_paid', sql.Date, datePaid)
    .query(`SELECT COUNT(*) AS count FROM WelfareFunds WHERE date_paid = @date_paid`);

  const seq = result.recordset[0].count + 1;
  const datePart = new Date(datePaid).toISOString().slice(0,10).replace(/-/g, '');
  return `${datePart}-WF-${String(seq).padStart(3,'0')}`;
};

/* ================= CREATE EVENT ================= */

const createEvent = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { event_name, event_type, default_amount, created_by } = req.body;

    if (!event_type || !default_amount) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await transaction.begin();

    // ✅ MONTHLY DUES → CREATE FULL YEAR
    if (event_type === "DUES") {
      const year = new Date().getFullYear();

      for (let m = 0; m < 12; m++) {
        const date = new Date(year, m, 1);
        const code = generateEventCode("DUES", date);

        const check = await new sql.Request(transaction)
          .input("code", sql.VarChar, code)
          .query(`SELECT id FROM WelfareEvents WHERE event_code = @code`);

        if (check.recordset.length > 0) continue;

        const result = await new sql.Request(transaction)
          .input("event_code", sql.VarChar, code)
          .input("event_name", sql.VarChar, `Welfare Dues - ${date.toLocaleString('default',{month:'long'})} ${year}`)
          .input("event_type", sql.VarChar, "DUES")
          .input("default_amount", sql.Decimal(18,2), default_amount)
          .input("created_by", sql.Int, created_by)
          .query(`
            INSERT INTO WelfareEvents (event_code, event_name, event_type, default_amount, created_by)
            OUTPUT INSERTED.id
            VALUES (@event_code,@event_name,@event_type,@default_amount,@created_by)
          `);

        const eventId = result.recordset[0].id;

        // ✅ Assign active members
        await new sql.Request(transaction)
          .input("event_id", sql.Int, eventId)
          .input("amount", sql.Decimal(18,2), default_amount)
          .query(`
            INSERT INTO WelfareEventMembers (event_id, member_id, expected_amount)
            SELECT @event_id, m.id, @amount
            FROM Members m
            WHERE m.is_deleted = 0
          `);
      }

      await transaction.commit();
      return res.json({ success: true, message: "Yearly dues created" });
    }

    // ✅ SPECIAL EVENT
    const code = generateEventCode("SPECIAL");

    const result = await new sql.Request(transaction)
      .input("event_code", sql.VarChar, code)
      .input("event_name", sql.VarChar, event_name)
      .input("event_type", sql.VarChar, "SPECIAL")
      .input("default_amount", sql.Decimal(18,2), default_amount)
      .input("created_by", sql.Int, created_by)
      .query(`
        INSERT INTO WelfareEvents (event_code,event_name,event_type,default_amount,created_by)
        OUTPUT INSERTED.id
        VALUES (@event_code,@event_name,@event_type,@default_amount,@created_by)
      `);

    const eventId = result.recordset[0].id;

    await new sql.Request(transaction)
      .input("event_id", sql.Int, eventId)
      .input("amount", sql.Decimal(18,2), default_amount)
      .query(`
        INSERT INTO WelfareEventMembers (event_id, member_id, expected_amount)
        SELECT @event_id, m.id, @amount
        FROM Members m
        WHERE m.is_deleted = 0
      `);

    await transaction.commit();

    res.json({ success: true, event_id: eventId });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RECORD PAYMENT ================= */

const recordPayment = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { event_member_id, amount, date_paid, recorded_by } = req.body;

    if (!event_member_id || !amount || !date_paid) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await transaction.begin();

    const request = new sql.Request(transaction);

    const check = await request
      .input("id", sql.Int, event_member_id)
      .query(`SELECT expected_amount,total_paid FROM WelfareEventMembers WHERE id=@id`);

    if (check.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invalid member" });
    }

    const member = check.recordset[0];

    if (member.total_paid + amount > member.expected_amount) {
      await transaction.rollback();
      return res.status(400).json({ message: "Exceeds expected amount" });
    }

    const code = await generateWelfareCode(await poolPromise, date_paid);

    await request
      .input("code", sql.VarChar, code)
      .input("event_member_id", sql.Int, event_member_id)
      .input("amount", sql.Decimal(18,2), amount)
      .input("date", sql.Date, date_paid)
      .input("user", sql.Int, recorded_by)
      .query(`
        INSERT INTO WelfareFunds (welfare_code,event_member_id,amount,payment_method,date_paid,recorded_by)
        VALUES (@code,@event_member_id,@amount,'Cash',@date,@user)
      `);

    await request
      .input("amt", sql.Decimal(18,2), amount)
      .input("id2", sql.Int, event_member_id)
      .query(`
        UPDATE WelfareEventMembers
        SET total_paid = total_paid + @amt,
            status = CASE 
              WHEN total_paid + @amt < expected_amount THEN 'PARTIAL'
              ELSE 'PAID'
            END
        WHERE id = @id2
      `);

    await transaction.commit();

    res.json({ success: true, message: "Payment recorded" });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
};

/* ================= GET ================= */

const getEvents = async (req, res) => {
  const pool = await poolPromise;
  const result = await pool.request().query(`SELECT * FROM WelfareEvents ORDER BY event_date DESC`);
  res.json(result.recordset);
};

const getEventMembersFull = async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("event_id", sql.Int, req.params.eventId)
    .query(`
      SELECT wem.id AS event_member_id,
             wem.expected_amount,
             wem.total_paid,
             wem.status,
             m.first_name,
             m.last_name
      FROM WelfareEventMembers wem
      JOIN Members m ON wem.member_id = m.id
      WHERE wem.event_id = @event_id
    `);

  res.json(result.recordset);
};

module.exports = {
  createEvent,
  recordPayment,   // ✅ IMPORTANT
  getEvents,
  getEventMembersFull
};