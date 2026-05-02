const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");


const ensureMemberInDuesEvents = async (memberId, dateJoined) => {
  const pool = await poolPromise;

  const joinDate = new Date(dateJoined);
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1; // 1–12

  const events = await pool.request()
    .input("year", sql.Int, joinYear)
    .input("month", sql.Int, joinMonth)
    .query(`
      SELECT id, default_amount, event_code
      FROM WelfareEvents
      WHERE event_type = 'DUES'
      AND (
        CAST(SUBSTRING(event_code, 6, 4) AS INT) > @year
        OR (
          CAST(SUBSTRING(event_code, 6, 4) AS INT) = @year
          AND CAST(SUBSTRING(event_code, 11, 2) AS INT) >= @month
        )
      )
    `);

  for (const ev of events.recordset) {
    await pool.request()
      .input("event_id", sql.Int, ev.id)
      .input("member_id", sql.Int, memberId)
      .input("amount", sql.Decimal(18,2), ev.default_amount)
      .query(`
        IF NOT EXISTS (
          SELECT 1 FROM WelfareEventMembers 
          WHERE event_id = @event_id AND member_id = @member_id
        )
        INSERT INTO WelfareEventMembers (event_id, member_id, expected_amount)
        VALUES (@event_id, @member_id, @amount)
      `);
  }
};
/**
 * CREATE MEMBER
 */
exports.createMember = async (req, res) => {
    const {
      member_code,
      first_name,
      last_name,
      other_names,
      gender,
      date_of_birth,
      phone,
      email,
      address,
      membership_status,
      date_joined,
      baptized,
      Auxiliary_Group
    } = req.body;
  
    if (!member_code || !first_name || !last_name || !gender || !date_of_birth || !membership_status) {
      return res.status(400).json({ message: "Missing required fields" });
    }
  
    try {
      const pool = await poolPromise;
  
      const check = await pool.request()
        .input("member_code", sql.NVarChar, member_code)
        .query(`SELECT 1 FROM Members WHERE member_code = @member_code`);
  
      if (check.recordset.length > 0) {
        return res.status(400).json({ message: "Member code exists" });
      }
  
      const result = await pool.request()
        .input("member_code", sql.NVarChar, member_code)
        .input("first_name", sql.NVarChar, first_name)
        .input("last_name", sql.NVarChar, last_name)
        .input("other_names", sql.NVarChar, other_names || null)
        .input("gender", sql.NVarChar, gender)
        .input("date_of_birth", sql.Date, date_of_birth)
        .input("phone", sql.NVarChar, phone || null)
        .input("email", sql.NVarChar, email || null)
        .input("address", sql.NVarChar, address || null)
        .input("membership_status", sql.NVarChar, membership_status)
        .input("date_joined", sql.Date, date_joined || new Date())
        .input("baptized", sql.Bit, baptized ?? false)
        .input("Auxiliary_Group", sql.NVarChar, Auxiliary_Group || null)
        .query(`
          INSERT INTO Members (
            member_code, first_name, last_name, other_names,
            gender, date_of_birth, phone, email, address,
            membership_status, date_joined, baptized, Auxiliary_Group
          )
          OUTPUT INSERTED.id
          VALUES (
            @member_code, @first_name, @last_name, @other_names,
            @gender, @date_of_birth, @phone, @email, @address,
            @membership_status, @date_joined, @baptized, @Auxiliary_Group
          )
        `);
  
      const memberId = result.recordset[0].id;
  
      // 🔥 IMPORTANT FIX
      await ensureMemberInDuesEvents(memberId, date_joined);
  
      res.status(201).json({ message: "Member created successfully" });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create member" });
    }
  };

/**
 * GET ALL MEMBERS
 */
exports.getMembers = async (req, res) => {
    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .query(`
                SELECT 
                    id,
                    member_code,
                    first_name,
                    last_name,
                    other_names,
                    gender,
                    date_of_birth,
                    phone,
                    email,
                    address,
                    membership_status,
                    date_joined,
                    baptized,
                    Auxiliary_Group,
                    created_at,
                    updated_at
                FROM Members
                WHERE is_deleted = 0
                ORDER BY created_at DESC
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
};

/**
 * GET MEMBER BY ID
 */
exports.getMemberById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    id,
                    member_code,
                    first_name,
                    last_name,
                    other_names,
                    gender,
                    date_of_birth,
                    phone,
                    email,
                    address,
                    membership_status,
                    date_joined,
                    baptized,
                    Auxiliary_Group,
                    created_at,
                    updated_at
                FROM Members
                WHERE id = @id AND is_deleted = 0
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.json(result.recordset[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch member' });
    }
};

/**
 * UPDATE MEMBER
 */
exports.updateMember = async (req, res) => {
    const { id } = req.params;
    const {
        first_name,
        last_name,
        other_names,
        gender,
        date_of_birth,
        phone,
        email,
        address,
        membership_status,
        date_joined,
        baptized,
        Auxiliary_Group
    } = req.body;

    if (!first_name || !last_name || !gender || !date_of_birth || !membership_status) {
        return res.status(400).json({
            message: 'first_name, last_name, gender, date_of_birth, and membership_status are required'
        });
    }

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .input('first_name', sql.NVarChar, first_name)
            .input('last_name', sql.NVarChar, last_name)
            .input('other_names', sql.NVarChar, other_names || null)
            .input('gender', sql.NVarChar, gender)
            .input('date_of_birth', sql.Date, date_of_birth)
            .input('phone', sql.NVarChar, phone || null)
            .input('email', sql.NVarChar, email || null)
            .input('address', sql.NVarChar, address || null)
            .input('membership_status', sql.NVarChar, membership_status)
            .input('date_joined', sql.Date, date_joined || null)
            .input('baptized', sql.Bit, baptized ?? false)
            .input('Auxiliary_Group', sql.NVarChar(50), Auxiliary_Group || null)
            .query(`
                UPDATE Members
                SET
                    first_name = @first_name,
                    last_name = @last_name,
                    other_names = @other_names,
                    gender = @gender,
                    date_of_birth = @date_of_birth,
                    phone = @phone,
                    email = @email,
                    address = @address,
                    membership_status = @membership_status,
                    date_joined = @date_joined,
                    baptized = @baptized,
                    Auxiliary_Group = @Auxiliary_Group,
                    updated_at = SYSDATETIME()
                WHERE id = @id AND is_deleted = 0
            `);

            

        res.json({ message: 'Member updated successfully' });

        await logActivity(
            "member",
            `Member updated: ID ${id}`
          );

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update member' });
    }
};

/**
 * SOFT DELETE MEMBER
 */
exports.deleteMember = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                UPDATE Members
                SET is_deleted = 1, updated_at = SYSDATETIME()
                WHERE id = @id AND is_deleted = 0
            `);

           

        res.json({ message: 'Member deleted successfully' });

        await logActivity(
            "member",
            `Member deleted: ID ${id}`
          );

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete member' });
    }
};
