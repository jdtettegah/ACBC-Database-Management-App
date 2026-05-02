import "./AdminGenerateReport.css";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getMonthlyFinance,
  getTitheSummary,
  getAttendanceSummary,
  getVisitorsReport,
  saveReport,
  getWelfareReport,
} from "../services/api";

import acbcLogo from "../assets/acbc-logo.png";
import { CalendarCheck, Download } from "lucide-react";
import { createPortal } from "react-dom";

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

      if (type === "Welfare") {
        data = await getWelfareReport(start, end);
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
  
    // ✅ FORMATTERS
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };
  
    const formatCurrency = (amount) => {
      return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
      });
    };
  
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
    doc.text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      14,
      60
    );
  
    let startY = 70;
  
    /* ================= TITHE ================= */
    if (reportType === "Tithe") {
  
      doc.text(`Total Members Paid: ${result.totalMembers}`, 14, startY);
      doc.text(`Total Tithes (GH₵): ${formatCurrency(result.totalTithes)}`, 14, startY + 6);
  
      const rows = result.members?.map(m => [
        m.member_id,
        `${m.first_name} ${m.last_name || ""}`,
        formatCurrency(m.amount_paid),
        formatDate(m.date_paid)
      ]);
  
      if (rows?.length) {
        autoTable(doc, {
          startY: startY + 15,
          head: [["Member ID", "Name", "Amount (GH₵)", "Date"]],
          body: rows
        });
      }
    }
  
    /* ================= FINANCIAL ================= */
    if (reportType === "Financial") {
  
      autoTable(doc, {
        startY,
        head: [["Description", "Amount (GH₵)"]],
        body: [["Opening Balance", formatCurrency(result.openingBalance)]]
      });
  
      startY = doc.lastAutoTable.finalY + 5;
  
      autoTable(doc, {
        startY,
        head: [["Income", "Amount (GH₵)"]],
        body: result.income.map(i => [
          i.income_type,
          formatCurrency(i.total)
        ])
      });
  
      startY = doc.lastAutoTable.finalY + 5;
  
      autoTable(doc, {
        startY,
        head: [["Expenses", "Amount (GH₵)"]],
        body: result.expenses.map(e => [
          e.category,
          formatCurrency(e.total)
        ])
      });
  
      startY = doc.lastAutoTable.finalY + 10;
  
      doc.setFontSize(12);
      doc.text(
        `Closing Balance (GH₵): ${formatCurrency(result.closingBalance)}`,
        14,
        startY
      );
    }
  
    /* ================= ATTENDANCE ================= */
    if (reportType === "Attendance") {
  
      doc.text(`Members: ${result.totalMembers}`, 14, startY);
      doc.text(`Visitors: ${result.totalVisitors}`, 14, startY + 6);
      doc.text(`Total Attendance: ${result.totalAttendance}`, 14, startY + 12);
  
      const rows = result.services?.map(s => [
        formatDate(s.service_date),
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
  
    /* ================= VISITORS ================= */
    if (reportType === "Visitors") {
  
      doc.text(`Total Visitors: ${result.total}`, 14, startY);
  
      const rows = result.visitors?.map(v => [
        `${v.first_name} ${v.last_name || ""}`,
        formatDate(v.visit_date),
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
  
    /* ================= WELFARE ================= */
    if (reportType === "Welfare") {
  
      autoTable(doc, {
        startY,
        head: [["Description", "Amount (GH₵)"]],
        body: [["Opening Balance", formatCurrency(result.openingBalance)]]
      });
  
      startY = doc.lastAutoTable.finalY + 5;
  
      autoTable(doc, {
        startY,
        head: [["Income Type", "Amount (GH₵)"]],
        body: result.income.map(i => [
          i.event_type,
          formatCurrency(i.total)
        ])
      });
  
      startY = doc.lastAutoTable.finalY + 5;
  
      autoTable(doc, {
        startY,
        head: [["Expense Category", "Amount (GH₵)"]],
        body: result.expenses.map(e => [
          e.category,
          formatCurrency(e.total)
        ])
      });
  
      startY = doc.lastAutoTable.finalY + 10;
  
      doc.text(
        `Closing Balance (GH₵): ${formatCurrency(result.closingBalance)}`,
        14,
        startY
      );
    }
  
    doc.save(`${reportType}-report.pdf`);
  };

  const closeModal = () => {

    setOpen(false);

    if (onClose) onClose();

  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
  
    if (open) {
      window.addEventListener("keydown", handleEsc);
    }
  
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);


  return (
    <>
      {!existingReport && (
        <button
          className="generate-report-button"
          onClick={() => setOpen(true)}
        >
          <CalendarCheck size={18} />
          Generate Report
        </button>
      )}

      {open && createPortal(

        <div className="generate-report-modal-overlay" onClick={() => setOpen(false)}>

          <div className="generate-reports-page" onClick={(e) => e.stopPropagation()}>

            <div className="generate-reports-header">

              <h2>Generate Report</h2>

              <button
                className="generate-report-close-btn"
                onClick={closeModal}
              >
                CLOSE ❌
              </button>

            </div>


            <div className="generate-reports-filters">

              <div className="generate-report-filter-group">
                <label>Type</label>

                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Tithe">Tithe</option>
                  <option value="Financial">Financial</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Visitors">Visitors</option>
                  <option value="Welfare">Welfare</option>
                </select>
              </div>

              <div className="generate-report-filter-group">
                <label>Start Date</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="generate-report-filter-group">
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
                  className="generate-report-download-btn"
                  onClick={downloadPDF}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              )}

            </div>

          </div>

        </div>,
        document.body

      )}
    </>
  );
}

export default AdminGenerateReport;