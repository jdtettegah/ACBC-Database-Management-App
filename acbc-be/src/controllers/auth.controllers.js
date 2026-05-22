import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../services/db.js';

const login = async (req, res) => {
  const { email, password } = req.body;

  try {

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.first_name,
        u.last_name,
        u.password_hash,
        r.name AS role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
      AND u.is_active = true
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
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

    res.status(500).json({
      message: 'Server error'
    });
  }
};

const createUser = async (req, res) => {

  try {

    const {
      email,
      password,
      username,
      first_name,
      last_name,
      role_id
    } = req.body;

    if (!email || !password || !username || !role_id) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }

    // HASH PASSWORD
    const password_hash = bcrypt.hashSync(password, 10);

    // ===============================
    // INSERT USER
    // ===============================
    const userResult = await pool.query(
      `
      INSERT INTO users (
        email,
        password_hash,
        username,
        first_name,
        last_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        email,
        password_hash,
        username,
        first_name || null,
        last_name || null
      ]
    );

    const userId = userResult.rows[0].id;

    // ===============================
    // ASSIGN ROLE
    // ===============================
    await pool.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id
      )
      VALUES ($1, $2)
      `,
      [userId, role_id]
    );

    res.json({
      message: 'User created successfully'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Failed to create user'
    });

  }

};

export default {
  login,
  createUser
};