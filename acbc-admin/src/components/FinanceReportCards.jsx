const FinanceReportCards = () => {
    const cards = [
      { title: "Total Income", value: "₵58,200" },
      { title: "Total Expenses", value: "₵39,600" },
      { title: "Net Balance", value: "₵18,600" },
      { title: "Transactions", value: 64 },
    ];
  
    return (
      <div className="finance-report-stats">
        {cards.map((card, index) => (
          <div key={index} className="finance-report-card">
            <h4>{card.title}</h4>
            <p>{card.value}</p>
          </div>
        ))}
      </div>
    );
  };
  
  export default FinanceReportCards;
  