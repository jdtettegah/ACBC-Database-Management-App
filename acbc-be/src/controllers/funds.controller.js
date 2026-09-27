import pool from "../services/db.js";
import { logActivity } from "./activity.controller.js";

/**
 * ================= GET ALL FUNDS =================
 */
const getAllFunds = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        fund_code,
        fund_name,
        is_active
      FROM funds
      ORDER BY id ASC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("GET FUNDS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch funds"
    });
  }
};


/**
 * ================= GET ACTIVE FUNDS =================
 */
const getActiveFunds = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        fund_code,
        fund_name,
        is_active
      FROM funds
      WHERE is_active = TRUE
      ORDER BY id ASC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("GET ACTIVE FUNDS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch active funds"
    });
  }
};


/**
 * ================= GET SINGLE FUND =================
 */
const getFundByCode = async (req, res) => {

  const { fundCode } = req.params;

  try {

    const result = await pool.query(
      `
      SELECT
        id,
        fund_code,
        fund_name,
        is_active
      FROM funds
      WHERE fund_code = $1
      `,
      [fundCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Fund not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error("GET FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch fund"
    });
  }
};


/**
 * ================= CREATE FUND =================
 */
const createFund = async (req, res) => {

  const {
    fund_code,
    fund_name
  } = req.body;

  if (!fund_code || !fund_name) {
    return res.status(400).json({
      message: "Fund code and fund name are required"
    });
  }

  try {

    const result = await pool.query(
      `
      INSERT INTO funds (
        fund_code,
        fund_name,
        is_active
      )
      VALUES ($1, $2, TRUE)
      RETURNING *
      `,
      [
        fund_code.toUpperCase(),
        fund_name
      ]
    );

    await logActivity(
      "finance",
      `Fund created: ${fund_name} (${fund_code.toUpperCase()})`
    );

    res.status(201).json({
      message: "Fund created successfully",
      fund: result.rows[0]
    });

  } catch (error) {

    console.error("CREATE FUND ERROR:", error);

    // Duplicate fund code
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A fund with this code already exists"
      });
    }

    res.status(500).json({
      message: "Failed to create fund"
    });
  }
};


/**
 * ================= UPDATE FUND =================
 */
const updateFund = async (req, res) => {

  const { fundCode } = req.params;

  const {
    fund_name
  } = req.body;

  if (!fund_name) {
    return res.status(400).json({
      message: "Fund name is required"
    });
  }

  try {

    const result = await pool.query(
      `
      UPDATE funds
      SET fund_name = $1
      WHERE fund_code = $2
      RETURNING *
      `,
      [
        fund_name,
        fundCode
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Fund not found"
      });
    }

    await logActivity(
      "finance",
      `Fund updated: ${fundCode}`
    );

    res.json({
      message: "Fund updated successfully",
      fund: result.rows[0]
    });

  } catch (error) {

    console.error("UPDATE FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to update fund"
    });
  }
};


/**
 * ================= DEACTIVATE FUND =================
 */
const deactivateFund = async (req, res) => {

  const { fundCode } = req.params;

  try {

    const result = await pool.query(
      `
      UPDATE funds
      SET is_active = FALSE
      WHERE fund_code = $1
      RETURNING *
      `,
      [fundCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Fund not found"
      });
    }

    await logActivity(
      "finance",
      `Fund deactivated: ${fundCode}`
    );

    res.json({
      message: "Fund deactivated successfully",
      fund: result.rows[0]
    });

  } catch (error) {

    console.error("DEACTIVATE FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to deactivate fund"
    });
  }
};


/**
 * ================= ACTIVATE FUND =================
 */
const activateFund = async (req, res) => {

  const { fundCode } = req.params;

  try {

    const result = await pool.query(
      `
      UPDATE funds
      SET is_active = TRUE
      WHERE fund_code = $1
      RETURNING *
      `,
      [fundCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Fund not found"
      });
    }

    await logActivity(
      "finance",
      `Fund activated: ${fundCode}`
    );

    res.json({
      message: "Fund activated successfully",
      fund: result.rows[0]
    });

  } catch (error) {

    console.error("ACTIVATE FUND ERROR:", error);

    res.status(500).json({
      message: "Failed to activate fund"
    });
  }
};


export default {
  getAllFunds,
  getActiveFunds,
  getFundByCode,
  createFund,
  updateFund,
  deactivateFund,
  activateFund
};