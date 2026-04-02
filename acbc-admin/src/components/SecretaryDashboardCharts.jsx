import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

import { getAttendanceChart, getFinanceChart } from "../services/api";
import "./DashboardCharts.css";

function SecretaryDashboardCharts() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [financeData, setFinanceData] = useState([]);

  // Get current month range
  const getCurrentMonthDates = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      month: now.toLocaleString("default", { month: "long" })
    };
  };

  // Normalize weeks to always show Week 1–5
  const normalizeWeeks = (data) => {
    const allWeeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    return allWeeks.map(week => {
      const found = data.find(d => d.week === week);
      return {
        week,
        sunday: found?.sunday || 0,
        midweek: found?.midweek || 0,
        income: found?.income || 0,
        expense: found?.expense || 0,
        startDate: found?.startDate || null,
        endDate: found?.endDate || null
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { start, end } = getCurrentMonthDates();

        const attendance = await getAttendanceChart(start, end);
        const finance = await getFinanceChart(start, end);

        setAttendanceData(Array.isArray(attendance.weeks) ? normalizeWeeks(attendance.weeks) : []);
        setFinanceData(Array.isArray(finance.weeks) ? normalizeWeeks(finance.weeks) : []);

      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchData();
  }, []);

  const { month } = getCurrentMonthDates();

  // Custom Tooltip for both charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="custom-tooltip">
          <p><strong>{data.week}</strong></p>

          {data.sunday !== undefined && (
            <>
              <p>Sunday: {data.sunday}</p>
              <p>Midweek: {data.midweek}</p>
            </>
          )}

          {data.income !== undefined && (
            <>
              <p>Income: GH₵{data.income}</p>
              <p>Expense: GH₵{data.expense}</p>
            </>
          )}

          <p>
            {data.startDate && data.endDate
              ? `${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`
              : "No data"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-charts">

      {/* Attendance Chart */}
      <div className="chart-card">
        <h3>{month} Attendance (Sunday vs Midweek)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="sunday" fill="#4d4dea" name="Sunday" />
            <Bar dataKey="midweek" fill="#82ca9d" name="Midweek" />
          </BarChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
}

export default SecretaryDashboardCharts;