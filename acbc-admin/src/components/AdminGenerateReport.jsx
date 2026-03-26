import "./AdminGenerateReport.css";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getMonthlyFinance,
  getTitheSummary,
  getAttendanceSummary,
  getVisitorsReport,
  saveReport
} from "../services/api";

import acbcLogo from "../assets/acbc-logo.png";

function AdminGenerateReport({ existingReport, onClose, refreshReports }) {

  const [reportType, setReportType] = useState("Tithe");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [result, setResult] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // OPEN REPORT FROM TABLE
  useEffect(() => {

    if (existingReport) {

      const [start, end] = existingReport.period.split(" - ");

      setReportType(existingReport.category);
      setStartDate(start);
      setEndDate(end);
      setOpen(true);

      handleGenerate(start, end, existingReport.category);

    }

  }, [existingReport]);



  // GENERATE REPORT
  const handleGenerate = async (
    start = startDate,
    end = endDate,
    type = reportType
  ) => {

    try {

      if (!start || !end) {
        alert("Please select start and end date");
        return;
      }

      setLoading(true);
      setResult(null);

      let data;

      if (type === "Tithe") {
        data = await getTitheSummary(start, end);
      }

      if (type === "Financial") {
        data = await getMonthlyFinance(start, end);
      }

      if (type === "Attendance") {
        data = await getAttendanceSummary(start, end);
      }

      if (type === "Visitors") {
        data = await getVisitorsReport(start, end);
      }

      setResult(data);

      // SAVE REPORT
      if (!existingReport) {

        await saveReport({
          title: `${type} Report`,
          category: type,
          period: `${start} - ${end}`,
          status: "Generated"
        });

        if (refreshReports) refreshReports();

      }

    } catch (err) {

      console.error(err);
      alert("Failed to generate report");

    } finally {

      setLoading(false);

    }

  };


  // DOWNLOAD PDF
  const downloadPDF = () => {

    if (!result) return;

    const doc = new jsPDF();

    doc.addImage(acbcLogo, "PNG", 80, 10, 50, 25);

    doc.setFontSize(18);
    doc.text(
      "ACTS CHARISMATIC BAPTIST CHURCH - KWAMO",
      105,
      40,
      { align: "center" }
    );

    doc.setFontSize(14);
    doc.text(`${reportType} Report`, 105, 50, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Period: ${startDate} - ${endDate}`, 14, 60);

    let startY = 70;

    // TITHE
    if (reportType === "Tithe") {

      doc.text(`Total Members Paid: ${result.totalMembers}`, 14, startY);
      doc.text(`Total Tithes: ${result.totalTithes}`, 14, startY + 6);

      const rows = result.members?.map(m => [
        m.member_id,
        `${m.first_name} ${m.last_name || ""}`,
        m.amount_paid,
        new Date(m.date_paid).toLocaleDateString()
      ]);

      if (rows?.length) {

        autoTable(doc, {
          startY: startY + 15,
          head: [["Member ID", "Name", "Amount", "Date"]],
          body: rows
        });

      }

    }

    // FINANCE
    if (reportType === "Financial") {

      autoTable(doc, {
        startY,
        head: [["Description", "Amount"]],
        body: [["Opening Balance", result.openingBalance]]
      });

      startY = doc.lastAutoTable.finalY + 5;

      autoTable(doc, {
        startY,
        head: [["Income", "Amount"]],
        body: result.income.map(i => [i.income_type, i.total])
      });

      startY = doc.lastAutoTable.finalY + 5;

      autoTable(doc, {
        startY,
        head: [["Expenses", "Amount"]],
        body: result.expenses.map(e => [e.category, e.total])
      });

    }

    // ATTENDANCE
    if (reportType === "Attendance") {

      doc.text(`Members: ${result.totalMembers}`, 14, startY);
      doc.text(`Visitors: ${result.totalVisitors}`, 14, startY + 6);
      doc.text(`Total Attendance: ${result.totalAttendance}`, 14, startY + 12);

      const rows = result.services?.map(s => [
        new Date(s.service_date).toLocaleDateString(),
        s.service_type,
        s.members,
        s.visitors,
        s.total
      ]);

      if (rows?.length) {

        autoTable(doc, {
          startY: startY + 20,
          head: [["Date", "Service", "Members", "Visitors", "Total"]],
          body: rows
        });

      }

    }

    // VISITORS
    if (reportType === "Visitors") {

      doc.text(`Total Visitors: ${result.total}`, 14, startY);

      const rows = result.visitors?.map(v => [
        `${v.first_name} ${v.last_name || ""}`,
        new Date(v.visit_date).toLocaleDateString(),
        v.service_type
      ]);

      if (rows?.length) {

        autoTable(doc, {
          startY: startY + 15,
          head: [["Name", "Visit Date", "Service"]],
          body: rows
        });

      }

    }

    doc.save(`${reportType}-report.pdf`);

  };


  const closeModal = () => {

    setOpen(false);

    if (onClose) onClose();

  };


  return (
    <>
      {!existingReport && (
        <button
          className="add-attendance-button"
          onClick={() => setOpen(true)}
        >
          📝 Generate Report
        </button>
      )}

      {open && (

        <div className="modal-overlay">

          <div className="generate-reports-page">

            <div className="generate-reports-header">

              <h2>Generate Report</h2>

              <button
                className="close-btn"
                onClick={closeModal}
              >
                ❌
              </button>

            </div>


            <div className="generate-reports-filters">

              <div className="filter-group">
                <label>Type</label>

                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Tithe">Tithe</option>
                  <option value="Financial">Financial</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Visitors">Visitors</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Start Date</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>End Date</label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                className="generate-btn"
                onClick={() => handleGenerate()}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>

              {result && (
                <button
                  className="download-btn"
                  onClick={downloadPDF}
                >
                  Download PDF
                </button>
              )}

            </div>

          </div>

        </div>

      )}
    </>
  );
}

export default AdminGenerateReport;