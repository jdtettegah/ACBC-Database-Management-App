// src/controllers/welfare.controller.js

const { poolPromise, sql } = require('../services/db');

/* ================= HELPERS ================= */

const generateEventCode = (type, date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (type === "DUES") return `DUES-${year}-${month}`;
  return `SPC-${Date.now()}`;
};

const generateWelfareCode = async (request, datePaid) => {
  const result = await request
    .input('date_paid', sql.Date, datePaid)
    .query(`
      SELECT COUNT(*) AS count 
      FROM WelfareFunds 
      WHERE date_paid = @date_paid
    `);

  const seq = result.recordset[0].count + 1;
  const datePart = new Date(datePaid)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  return `${datePart}-WF-${String(seq).padStart(3, '0')}`;
};

/* ================= CREATE EVENT ================= */

const createEvent = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { event_name, event_type, default_amount, created_by } = req.body;

    await transaction.begin();

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
          .input("event_name", sql.VarChar,
            `Welfare Dues - ${date.toLocaleString('default', { month: 'long' })} ${year}`
          )
          .input("event_type", sql.VarChar, "DUES")
          .input("default_amount", sql.Decimal(18,2), default_amount)
          .input("created_by", sql.Int, created_by)
          .query(`
            INSERT INTO WelfareEvents 
            (event_code, event_name, event_type, default_amount, created_by)
            OUTPUT INSERTED.id
            VALUES (@event_code,@event_name,@event_type,@default_amount,@created_by)
          `);

        // ❌ REMOVED MEMBER INSERT LOGIC
        // This is what was causing your bug
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
      .input("default_amount", sql.Decimal(18, 2), default_amount)
      .input("created_by", sql.Int, created_by)
      .query(`
        INSERT INTO WelfareEvents 
        (event_code, event_name, event_type, default_amount, created_by)
        OUTPUT INSERTED.id
        VALUES (
          @event_code,
          @event_name,
          @event_type,
          @default_amount,
          @created_by
        )
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


/* ================= BULK PAYMENT ================= */

const recordBulkPayment = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const { payments, date_paid, recorded_by } = req.body;

    if (!payments || payments.length === 0) {
      return res.status(400).json({ message: "No payments provided" });
    }

    await transaction.begin();

    for (let p of payments) {
      const { event_member_id, amount, payment_method, payment_reference } = p;

      const request = new sql.Request(transaction);

      const check = await request
        .input("id", sql.Int, event_member_id)
        .query(`
          SELECT expected_amount, total_paid 
          FROM WelfareEventMembers 
          WHERE id = @id
        `);

      if (check.recordset.length === 0) continue;

      const member = check.recordset[0];

      if (member.total_paid + amount > member.expected_amount) continue;

      const code = await generateWelfareCode(request, date_paid);

      await request
        .input("code", sql.VarChar, code)
        .input("event_member_id", sql.Int, event_member_id)
        .input("amount", sql.Decimal(18, 2), amount)
        .input("method", sql.VarChar, payment_method || "Cash")
        .input("ref", sql.VarChar, payment_reference || null)
        .input("date", sql.Date, date_paid)
        .input("user", sql.Int, recorded_by)
        .query(`
          INSERT INTO WelfareFunds 
          (welfare_code,event_member_id,amount,payment_method,payment_reference,date_paid,recorded_by)
          VALUES (@code,@event_member_id,@amount,@method,@ref,@date,@user)
        `);

      await request
        .input("amt", sql.Decimal(18, 2), amount)
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
    }

    await transaction.commit();

    res.json({
      success: true,
      message: "Bulk payments recorded",
      count: payments.length
    });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: "Bulk payment failed" });
  }
};

/* ================= GET ================= */

const getEvents = async (req, res) => {
  const pool = await poolPromise;

  const result = await pool.request().query(`
    SELECT * FROM WelfareEvents
    ORDER BY event_code ASC
  `);

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


const recordSinglePayment = async (req, res) => {
  const transaction = new sql.Transaction(await poolPromise);

  try {
    const {
      event_member_id,
      amount,
      payment_method,
      payment_reference,
      date_paid,
      recorded_by
    } = req.body;

    if (!event_member_id || !amount || !date_paid) {
      return res.status(400).json({ message: "Missing fields" });
    }

    await transaction.begin();

    const request = new sql.Request(transaction);

    const check = await request
      .input("id", sql.Int, event_member_id)
      .query(`
        SELECT expected_amount, total_paid 
        FROM WelfareEventMembers 
        WHERE id = @id
      `);

    if (check.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Invalid member" });
    }

    const member = check.recordset[0];

    if (member.total_paid + amount > member.expected_amount) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Exceeds expected amount"
      });
    }

    const code = await generateWelfareCode(request, date_paid);

    await request
      .input("code", sql.VarChar, code)
      .input("event_member_id", sql.Int, event_member_id)
      .input("amount", sql.Decimal(18,2), amount)
      .input("method", sql.VarChar, payment_method || "Cash")
      .input("ref", sql.VarChar, payment_reference || null)
      .input("date", sql.Date, date_paid)
      .input("user", sql.Int, recorded_by)
      .query(`
        INSERT INTO WelfareFunds 
        (welfare_code,event_member_id,amount,payment_method,payment_reference,date_paid,recorded_by)
        VALUES (@code,@event_member_id,@amount,@method,@ref,@date,@user)
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

    res.json({ success: true, message: "Payment successful" });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
};

const getMemberFullHistory = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, req.params.event_member_id)
      .query(`
        SELECT 
          we.event_name,
          wem.expected_amount,   -- ✅ ADD THIS
          wf.amount,
          wf.payment_method,
          wf.payment_reference,
          wf.date_paid
        FROM WelfareFunds wf
        JOIN WelfareEventMembers wem ON wf.event_member_id = wem.id
        JOIN WelfareEvents we ON wem.event_id = we.id
        WHERE wem.member_id = (
          SELECT member_id FROM WelfareEventMembers WHERE id = @id
        )
        ORDER BY wf.date_paid DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};



const addDayBornSplit = async (req, res) => {

  const transaction = new sql.Transaction(await poolPromise);

  try {

    const {
      total_amount,
      welfare_amount,
      description,
      approved_by,
      recorded_by,
      date_received
    } = req.body;

    if (!total_amount || !welfare_amount || !date_received) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (welfare_amount > total_amount) {
      return res.status(400).json({ message: "Welfare amount cannot exceed total" });
    }

    await transaction.begin();

    const request = new sql.Request(transaction);

    /* ======================
       1. FULL INCOME
    ====================== */
    await request
      .input("type", sql.NVarChar, "Day Born Offering")
      .input("amount", sql.Decimal(10,2), total_amount)
      .input("desc", sql.NVarChar, description || null)
      .input("user", sql.Int, recorded_by)
      .input("date", sql.Date, date_received)
      .query(`
        INSERT INTO Income
        (income_type, amount, source_description, recorded_by, date_received)
        VALUES (@type, @amount, @desc, @user, @date)
      `);


    /* ======================
       2. EXPENSE (TO WELFARE)
    ====================== */
    await request
      .input("cat", sql.NVarChar, "Welfare Transfer")
      .input("amt", sql.Decimal(10,2), welfare_amount)
      .input("desc2", sql.NVarChar, "Transfer from Day Born Offering")
      .input('approved_by', sql.Int, approved_by)
      .input("user2", sql.Int, recorded_by)
      .input("date2", sql.Date, date_received)
      .query(`
        INSERT INTO Expenditure
        (category, amount, description, approved_by, recorded_by, date_spent)
        VALUES (@cat, @amt, @desc2, @user2, @user2, @date2)
      `);


    /* ======================
       3. WELFARE INCOME
    ====================== */
    await request
      .input("source", sql.NVarChar, "Day Born Offering")
      .input("amt2", sql.Decimal(18,2), welfare_amount)
      .input("desc3", sql.NVarChar, description || null)
      .input("user3", sql.Int, recorded_by)
      .input("date3", sql.Date, date_received)
      .query(`
        INSERT INTO WelfareDirectIncome
        (source, amount, description, recorded_by, date_received)
        VALUES (@source, @amt2, @desc3, @user3, @date3)
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: "Day Born Offering split successfully"
    });

  } catch (err) {

    await transaction.rollback();
    console.error(err);
    res.status(500).json({ message: "Transaction failed" });

  }
};

module.exports = {
  createEvent,
  recordBulkPayment,
  getEvents,
  getEventMembersFull,
  recordSinglePayment,
  getMemberFullHistory,
  addDayBornSplit
};