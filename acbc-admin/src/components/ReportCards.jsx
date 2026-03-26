
import "../pages/Reports/SecretaryReports.css"
const ReportCards = () => {
    const cards = [
      { title: "Total Attendance", value: 1245 },
      { title: "Services Held", value: 18 },
      { title: "New Members", value: 12 },
      { title: "Meetings", value: 9 },
    ];
  
    return (
      <div className="reports-stats">
        {cards.map((card, index) => (
          <div key={index} className="stats-card">
            <h4>{card.title}</h4>
            <p>{card.value}</p>
          </div>
        ))}
      </div>
    );
  };
  
  export default ReportCards;
  