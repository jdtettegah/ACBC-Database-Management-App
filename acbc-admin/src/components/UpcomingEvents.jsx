import { useEffect, useState } from "react";
import { getEvents, createEvent, deleteEvent } from "../services/api";
import "./UpcomingEvents.css";
import {
  CalendarPlus,
  CalendarCheck,
  Trash2
} from "lucide-react";

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

  const getNext30Days = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 30);

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    };
  };

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

  const handleChange = (e) => {
    setNewEvent({
      ...newEvent,
      [e.target.name]: e.target.value
    });
  };

  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.event_date) {
        alert("Title and Date are required");
        return;
      }

      const payload = {
        ...newEvent,
        event_time: newEvent.event_time || null
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

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

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

      {/* HEADER */}
      <div className="events-header">
        <div className="events-dashbaord-header">
          <span className="events-title-icon">
            <CalendarPlus size={21} />
          </span>
          <span className="events-title-text">
            Upcoming Events
          </span>
        </div>

        <button
          className="add-event-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <CalendarPlus size={16} />
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="event-form">
          <input type="text" name="title" placeholder="Event Title" value={newEvent.title} onChange={handleChange} />
          <input type="text" name="description" placeholder="Description" value={newEvent.description} onChange={handleChange} />
          <input type="text" name="location" placeholder="Location" value={newEvent.location} onChange={handleChange} />
          <input type="date" name="event_date" value={newEvent.event_date} onChange={handleChange} />
          <input type="time" name="event_time" value={newEvent.event_time} onChange={handleChange} />

          <button className="save-event-btn" onClick={handleAddEvent}>
            <CalendarPlus size={16} />
            Save Event
          </button>
        </div>
      )}

      {/* EVENTS LIST */}
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

                <button
                  className="addToCalender-btn"
                  onClick={() => addToCalendar(event)}
                >
                  <CalendarCheck size={16} />
                  Add to Calendar
                </button>

                <button
                  className="delete-btn"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 size={16} />
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