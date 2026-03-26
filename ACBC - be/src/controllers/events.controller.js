const { poolPromise, sql } = require("../services/db");
const { logActivity } = require("./activity.controller");

/**
 * ➕ Create Event
 * POST /api/events
 */
const createEvent = async (req, res) => {
    try {
      const { title, description, location, event_date, event_time } = req.body;
  
      // Validate required fields
      if (!title || !event_date) {
        return res.status(400).json({ message: "Title and date are required" });
      }
  
      let timeValue = null;
  
      // ✅ Convert time string (HH:mm) to JS Date object
      if (event_time && event_time.trim() !== "") {
        const parts = event_time.split(":");
  
        if (parts.length !== 2) {
          return res.status(400).json({ message: "Invalid time format" });
        }
  
        const [hours, minutes] = parts;
  
        const dateObj = new Date();
        dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  
        // Extra validation
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({ message: "Invalid time value" });
        }
  
        timeValue = dateObj;
      }
  
      const pool = await poolPromise;
  
      await pool.request()
        .input("title", sql.NVarChar, title)
        .input("description", sql.NVarChar, description || null)
        .input("location", sql.NVarChar, location || null)
        .input("event_date", sql.Date, event_date)
        .input("event_time", sql.Time, timeValue) // ✅ Correct handling
        .query(`
          INSERT INTO Events (title, description, location, event_date, event_time)
          VALUES (@title, @description, @location, @event_date, @event_time)
        `);

        
  
      res.json({ message: "Event created successfully" });

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
 * 📅 Get Upcoming Events
 * GET /api/events?start=2026-03-01&end=2026-03-31
 */
const getEvents = async (req, res) => {
  try {
    const { start, end } = req.query;

    const pool = await poolPromise;

    let query = `
      SELECT 
        id,
        title,
        description,
        location,
        CONVERT(VARCHAR, event_date, 23) as event_date,
        CONVERT(VARCHAR, event_time, 8) as event_time
      FROM Events
    `;

    // Optional filtering
    if (start && end) {
      query += `
        WHERE event_date BETWEEN @start AND @end
      `;
    }

    query += ` ORDER BY event_date ASC`;

    const request = pool.request();

    if (start && end) {
      request.input("start", sql.Date, start);
      request.input("end", sql.Date, end);
    }

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (err) {
    console.error("Get Events Error:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};


/**
 * ❌ Delete Event
 * DELETE /api/events/:id
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM Events WHERE id = @id`);


      

    res.json({ message: "Event deleted successfully" });

    await logActivity(
      "event",
      `Event deleted (ID: ${id})`
    );

  } catch (err) {
    console.error("Delete Event Error:", err);
    res.status(500).json({ message: "Failed to delete event" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  deleteEvent
};