import "./TodaySummary.css";

function TodaySummary({ data }) {

  if (!data) {
    return <p>Loading today summary...</p>;
  }

  return (
    <div className="today-summary">
      <h3>📅 Today Summary</h3>

      <div className="todaySummary-grid">

        <div className="todaySummary-card income">
          <p>Income</p>
          <h2>GH₵ {Number(data.income).toLocaleString()}</h2>
        </div>

        <div className="todaySummary-card expense">
          <p>Expenses</p>
          <h2>GH₵ {Number(data.expenses).toLocaleString()}</h2>
        </div>

        <div className="todaySummary-card tithe">
          <p>Tithes</p>
          <h2>GH₵ {Number(data.tithes).toLocaleString()}</h2>
        </div>

        <div className="todaySummary-card attendance">
          <p>Attendance</p>
          <h2>{data.attendance}</h2>
        </div>

        <div className="todaySummary-card visitors">
          <p>Visitors</p>
          <h2>{data.visitors}</h2>
        </div>

      </div>
    </div>
  );
}

export default TodaySummary;