import { useState } from "react";
import AddMeetingModal from "./AddMeetingModal";
import "./meetings.css";

function MeetingsDashboard() {
  const [showModal, setShowModal] = useState(false);

  const meetings = [
    {
      id: 1,
      title: "Sunday Worship Service",
      type: "Service",
      date: "2026-01-14",
      attendance: 215,
      notes: "Powerful service, communion held",
    },
    {
      id: 2,
      title: "Leadership Meeting",
      type: "Meeting",
      date: "2026-01-12",
      attendance: 18,
      notes: "Discussed Q1 programs",
    },
  ];

  return (
    <div className="meetings-page">
      <div className="meetings-header">
        <h2>Meetings & Services</h2>
        <button className="action-btn" onClick={() => setShowModal(true)}>+ Add Record</button>
      </div>

      {/* FILTERS */}
      <div className="meetings-filters">
        <select>
          <option>All Types</option>
          <option>Service</option>
          <option>Meeting</option>
        </select>

        <input type="date" />
      </div>

      {/* TABLE */}
      <div className="meetings-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Type</th>
              <th>Attendance</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {meetings.map((m) => (
              <tr key={m.id}>
                <td>{m.date}</td>
                <td>{m.title}</td>
                <td>{m.type}</td>
                <td>{m.attendance}</td>
                <td>{m.notes}</td>
                <td>
                  <button className="edit-btn">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <AddMeetingModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default MeetingsDashboard;
