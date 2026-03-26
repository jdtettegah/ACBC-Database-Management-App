const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../services/db');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT u.id, u.password_hash, r.name AS role
                FROM Users u
                JOIN UserRoles ur ON u.id = ur.user_id
                JOIN Roles r ON ur.role_id = r.id
                WHERE u.email = @email AND u.is_active = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.recordset[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token,
            id: user.id,
            role: user.role });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
