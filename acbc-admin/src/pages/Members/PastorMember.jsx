import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { useEffect, useState } from "react";
import "./PastorMember.css";
import PastorMemberTable from "./PastorMemberTable";
import { apiRequest } from "../../services/api";

const COLORS = ["#4d4dea", "#2f2fd6", "#6f6ff2", "#9999ff"];

function PastorMember() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const data = await apiRequest("/members");
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members", err);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CALCULATIONS ---------------- */

  // Total
  const totalMembers = members.length;

  // New this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const newMembers = members.filter((m) => {
    const joined = new Date(m.date_joined);
    return (
      joined.getMonth() === currentMonth &&
      joined.getFullYear() === currentYear
    );
  }).length;

  // Gender data
  const genderData = [
    {
      name: "Male",
      value: members.filter((m) => m.gender === "Male").length,
    },
    {
      name: "Female",
      value: members.filter((m) => m.gender === "Female").length,
    },
  ];

  // Auxiliary Groups
  const auxGroups = {};

  members.forEach((m) => {
    const group = m.Auxiliary_Group || "Unknown";
    auxGroups[group] = (auxGroups[group] || 0) + 1;
  });

  const auxGroupData = Object.keys(auxGroups).map((g) => ({
    group: g,
    count: auxGroups[g],
  }));

  if (loading) return <p>Loading members...</p>;

  return (
    <div className="pastor-members">

      <h2>Members Overview</h2>

      {/* SUMMARY */}
      <div className="member-summary">
        <div className="summary-card">
          <h4>Total Members</h4>
          <p>{totalMembers}</p>
        </div>

        <div className="summary-card">
          <h4>New Members (Month)</h4>
          <p>{newMembers}</p>
        </div>

        <div className="summary-card">
          <h4>Auxiliary Groups</h4>
          <p>{auxGroupData.length}</p>
        </div>
      </div>

      {/* TABLE */}
      <PastorMemberTable members={members} />

      {/* CHARTS */}
      <div className="member-charts">

        {/* Gender */}
        <div className="chart-box">
          <h3>Gender Distribution</h3>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={genderData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {genderData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Auxiliary Groups */}
        <div className="chart-box">
          <h3>Auxiliary Groups</h3>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={auxGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4d4dea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default PastorMember;

/* I have to add departments graph */
