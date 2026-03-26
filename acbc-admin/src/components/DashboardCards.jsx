import "./DashboardCards.css";

function DashboardCards({ cards }) {
  return (
    <div className="dashboard-cards">
      {cards.map((card, index) => (
        <div className="dashboard-card" key={index}>
          <div className="card-icon">{card.icon}</div>
          <div className="card-info">
            <p className="card-title">{card.title}</p>
            <h2 className="card-value">{card.value}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;
