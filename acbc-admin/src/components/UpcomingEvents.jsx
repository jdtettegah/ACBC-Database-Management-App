import { useEffect, useState } from "react";
import { getEvents, createEvent, deleteEvent } from "../services/api";
import "./UpcomingEvents.css";

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    event_time: ""
  });

  // Get current month range
  const getNext30Days = () => {
    const now = new Date();
  
    const start = new Date(now);
    const end = new Date(now);
  
    end.setDate(end.getDate() + 30); // add 30 days
  
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    };
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      const { start, end } = getNext30Days();
      const data = await getEvents(start, end);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setNewEvent({
      ...newEvent,
      [e.target.name]: e.target.value
    });
  };

  // Add new event
  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.event_date) {
        alert("Title and Date are required");
        return;
      }

      const payload = {
        ...newEvent,
        event_time: newEvent.event_time || null // ✅ Fix for SQL TIME validation
      };

      await createEvent(payload);

      setNewEvent({
        title: "",
        description: "",
        location: "",
        event_date: "",
        event_time: ""
      });

      setShowForm(false);
      fetchEvents();

    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // Add to Google Calendar
  const addToCalendar = (event) => {
    const time = event.event_time ? event.event_time.slice(0, 5) : "00:00";

    const start = `${event.event_date}T${time}:00`;
    const end = `${event.event_date}T${time}:00`;

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${start.replace(/[-:]/g, "")}/${end.replace(/[-:]/g, "")}&details=${encodeURIComponent(
      event.description || ""
    )}&location=${encodeURIComponent(event.location || "")}`;

    window.open(url, "_blank");
  };

  return (
    <div className="events-container">

      {/* Header */}
      <div className="events-header">
        <div className="dashboard-header">Upcoming Events</div>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="event-form">
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={handleChange}
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={newEvent.description}
            onChange={handleChange}
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={newEvent.location}
            onChange={handleChange}
          />

          <input
            type="date"
            name="event_date"
            value={newEvent.event_date}
            onChange={handleChange}
          />

          <input
            type="time"
            name="event_time"
            value={newEvent.event_time}
            onChange={handleChange}
          />

          <button onClick={handleAddEvent}>Save Event</button>
        </div>
      )}

      {/* Events List */}
      <div className="events-list">
        {events.length === 0 ? (
          <p className="no-events">No upcoming events</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-card">

              <div className="event-info">
                <h4>{event.title}</h4>
                <p>
                  {event.event_date}
                  {event.event_time && ` • ${event.event_time}`}
                </p>
                {event.location && <p>{event.location}</p>}
                {event.description && <p>{event.description}</p>}
              </div>

              <div className="event-actions">
                <button className="addToCalender-btn" onClick={() => addToCalendar(event)}>
                  Add to Calendar
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(event.id)}
                >
                  Delete
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default UpcomingEvents;