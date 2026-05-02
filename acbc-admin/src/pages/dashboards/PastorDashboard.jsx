import { useEffect, useState } from "react";

import DashboardCards from "../../components/DashboardCards";
import DashboardCharts from "../../components/DashboardCharts";
import QuickActions from "../../components/QuickAction";
import RecentActivity from "../../components/RecentActivity";
import PendingItems from "../../components/PendingItems";
import TodaySummary from "../../components/TodaySummary";
import UpcomingEvents from "../../components/UpcomingEvents";

import {
  getMembers,
  getIncome,
  getExpenses,
  getAllTithes,
  getTodaySummary
} from "../../services/api";

function PastorDashboard() {

  const [cards, setCards] = useState([]);
  const [todaySummary, setTodaySummary] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {

    try {

      const members = await getMembers();
      const income = await getIncome();
      const expenses = await getExpenses();
      const tithes = await getAllTithes();
      const summary = await getTodaySummary();
      setTodaySummary(summary);

      const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);

      const totalExpense = expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0
      );

      const totalTithe = tithes.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      const dashboardCards = [
        {
          title: "Total Members",
          value: members.length,
          icon: "👥",
        },
        {
          title: "Total Income",
          value: `GH₵ ${totalIncome.toLocaleString()}`,
          icon: "💰",
        },
        {
          title: "Total Expenses",
          value: `GH₵ ${totalExpense.toLocaleString()}`,
          icon: "📉",
        },
        {
          title: "Total Tithes",
          value: `GH₵ ${totalTithe.toLocaleString()}`,
          icon: "🙏",
        },
      ];

      setCards(dashboardCards);

    } catch (error) {

      console.error("Dashboard Error:", error);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    fetchDashboardData();

  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <>
      <DashboardCards cards={cards} />


      <TodaySummary data={todaySummary}/>

      <DashboardCharts />

      

      <UpcomingEvents />

      <RecentActivity />

    </>
  );
}

export default PastorDashboard;