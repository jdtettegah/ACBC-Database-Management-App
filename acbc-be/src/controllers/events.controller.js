import pool from '../services/db.js';
import {logActivity} from "./activity.controller.js";

/**
 * ➕ Create Event
 */
const createEvent = async (req, res) => {
  try {

    const {
      title,
      description,
      location,
      event_date,
      event_time
    } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        message: "Title and date are required"
      });
    }

    let timeValue = null;

    // Convert HH:mm → PostgreSQL time format
    if (event_time && event_time.trim() !== "") {

      const parts = event_time.split(":");

      if (parts.length !== 2) {
        return res.status(400).json({
          message: "Invalid time format"
        });
      }

      const [hours, minutes] = parts;

      const dateObj = new Date();
      dateObj.setHours(
        parseInt(hours, 10),
        parseInt(minutes, 10),
        0,
        0
      );

      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          message: "Invalid time value"
        });
      }

      timeValue = dateObj;
    }

    await pool.query(
      `
      INSERT INTO events (
        title,
        description,
        location,
        event_date,
        event_time
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        title,
        description || null,
        location || null,
        event_date,
        timeValue
      ]
    );

    res.json({
      message: "Event created successfully"
    });

    await logActivity(
      "event",
      `Event created: ${title} on ${event_date}`
    );

  } catch (err) {
    console.error("Create Event Error:", err);

    res.status(500).json({
      message: err.message || "Failed to create event"
    });
  }
};


/**
 * 📅 Get Events
 */
const getEvents = async (req, res) => {

  try {

    const { start, end } = req.query;

    let query = `
      SELECT 
        id,
        title,
        description,
        location,
        TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
        TO_CHAR(event_time, 'HH24:MI:SS') AS event_time
      FROM events
    `;

    const params = [];

    if (start && end) {
      params.push(start, end);
      query += `
        WHERE event_date BETWEEN $1 AND $2
      `;
    }

    query += ` ORDER BY event_date ASC`;

    const result = await pool.query(query, params);

    res.json(result.rows);

  } catch (err) {
    console.error("Get Events Error:", err);

    res.status(500).json({
      message: "Failed to fetch events"
    });
  }
};


/**
 * ❌ Delete Event
 */
const deleteEvent = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM events
      WHERE id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    res.json({
      message: "Event deleted successfully"
    });

    await logActivity(
      "event",
      `Event deleted (ID: ${id})`
    );

  } catch (err) {
    console.error("Delete Event Error:", err);

    res.status(500).json({
      message: "Failed to delete event"
    });
  }
};

export default {
  createEvent,
  getEvents,
  deleteEvent
};