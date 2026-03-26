const { poolPromise, sql } = require('../services/db');
const { logActivity } = require("./activity.controller");


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

    // Basic validation
    if (!member_code || !first_name || !last_name || !gender || !date_of_birth || !membership_status) {
        return res.status(400).json({
            message: 'member_code, first_name, last_name, gender, date_of_birth, and membership_status are required'
        });
    }

    try {
        const pool = await poolPromise;

        // Optional pre-check for friendly message
        const check = await pool.request()
            .input('member_code', sql.NVarChar, member_code)
            .query('SELECT 1 FROM Members WHERE member_code = @member_code');

        if (check.recordset.length > 0) {
            return res.status(400).json({ message: 'Member code already exists' });
        }

        // Insert member
        await pool.request()
            .input('member_code', sql.NVarChar(20), member_code)
            .input('first_name', sql.NVarChar(50), first_name)
            .input('last_name', sql.NVarChar(50), last_name)
            .input('other_names', sql.NVarChar(50), other_names || null)
            .input('gender', sql.NVarChar(10), gender)
            .input('date_of_birth', sql.Date, date_of_birth)
            .input('phone', sql.NVarChar(20), phone || null)
            .input('email', sql.NVarChar(100), email || null)
            .input('address', sql.NVarChar(255), address || null)
            .input('membership_status', sql.NVarChar(20), membership_status)
            .input('date_joined', sql.Date, date_joined || null)
            .input('baptized', sql.Bit, baptized ?? false)
            .input('Auxiliary_Group', sql.NVarChar(50), Auxiliary_Group || null)
            .query(`
                INSERT INTO Members
                (member_code, first_name, last_name, other_names, gender, date_of_birth, phone, email, address, membership_status, date_joined, baptized, Auxiliary_Group)
                VALUES
                (@member_code, @first_name, @last_name, @other_names, @gender, @date_of_birth, @phone, @email, @address, @membership_status, @date_joined, @baptized, @Auxiliary_Group)
            `);

            

        res.status(201).json({ message: 'Member created successfully' });
        await logActivity(
            "member",
            `Member created: ${first_name} ${last_name} (${member_code})`
          );

    } catch (err) {
        console.error(err);

        // Catch DB-level unique constraint violation
        if (err.number === 2627) {
            return res.status(400).json({ message: 'Member code already exists' });
        }

        res.status(500).json({ message: 'Failed to create member' });
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
