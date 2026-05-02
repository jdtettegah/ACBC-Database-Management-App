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
          SELECT 
            u.id, 
            u.email,
            u.username,
            u.first_name,
            u.last_name,
            u.password_hash, 
            r.name AS role
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
  
      res.json({
        token,
        id: user.id,
        role: user.role,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };

  exports.createUser = async (req, res) => {
    try {
      const {
        email,
        password, // ✅ FIXED
        username,
        first_name,
        last_name,
        role_id
      } = req.body;
  
      if (!email || !password || !username || !role_id) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }
  
      const pool = await poolPromise;
  
      // ✅ HASH PASSWORD CORRECTLY
      const password_hash = bcrypt.hashSync(password, 10);
  
      // ===============================
      // INSERT USER
      // ===============================
      const result = await pool.request()
        .input("email", sql.VarChar, email)
        .input("password_hash", sql.VarChar, password_hash)
        .input("username", sql.VarChar, username)
        .input("first_name", sql.VarChar, first_name || null)
        .input("last_name", sql.VarChar, last_name || null)
        .query(`
          INSERT INTO Users (email, password_hash, username, first_name, last_name)
          OUTPUT INSERTED.id
          VALUES (@email, @password_hash, @username, @first_name, @last_name)
        `);
  
      const userId = result.recordset[0].id;
  
      // ===============================
      // ASSIGN ROLE
      // ===============================
      await pool.request()
        .input("user_id", sql.Int, userId)
        .input("role_id", sql.Int, role_id)
        .query(`
          INSERT INTO UserRoles (user_id, role_id)
          VALUES (@user_id, @role_id)
        `);
  
      res.json({
        message: "User created successfully"
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Failed to create user"
      });
    }
  };