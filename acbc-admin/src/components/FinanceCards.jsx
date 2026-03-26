const FinanceCards = () => {
    const cards = [
      { title: "Total Income", value: "₵45,200" },
      { title: "Total Expenses", value: "₵28,400" },
      { title: "Balance", value: "₵16,800" },
      { title: "This Month", value: "₵7,300" },
    ];
  
    return (
      <div className="finance-stats">
        {cards.map((card, index) => (
          <div className="finance-card" key={index}>
            <h4>{card.title}</h4>
            <p>{card.value}</p>
          </div>
        ))}
      </div>
    );
  };
  
  export default FinanceCards;
  