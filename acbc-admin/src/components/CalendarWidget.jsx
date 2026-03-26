import "./CalendarWidget.css";

function CalendarWidget() {
  return (
    <div className="calendar-widget">
      <h3>Calendar</h3>

      <ul className="calendar-list">
        <li>
          <span className="date">Mar 10</span>
          <span className="event">Leaders Meeting</span>
        </li>

        <li>
          <span className="date">Mar 14</span>
          <span className="event">Youth Service</span>
        </li>

        <li>
          <span className="date">Mar 21</span>
          <span className="event">Church Cleanup</span>
        </li>

        <li>
          <span className="date">Mar 28</span>
          <span className="event">End of Month Report</span>
        </li>
      </ul>
    </div>
  );
}

export default CalendarWidget;
