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
  
    // SAFER FONT
    doc.setFont("helvetica", "normal");
  
    /* =========================
        FORMATTERS
    ========================= */
  
    const formatDate = (date) => {
  
      if (!date) return "-";
  
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  
    };
  
    const formatCurrency = (amount) => {
  
      return new Intl.NumberFormat("en-GH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(amount));
  
    };
  
    const money = (amount) => `GHS ${formatCurrency(amount)}`;
  
    /* =========================
        HEADER
    ========================= */
  
    doc.addImage(acbcLogo, "PNG", 80, 10, 50, 25);
  
    doc.setFontSize(18);
  
    doc.text(
      "ACTS CHARISMATIC BAPTIST CHURCH - KWAMO",
      105,
      40,
      { align: "center" }
    );
  
    doc.setFontSize(14);
  
    doc.text(
      `${reportType} Report`,
      105,
      50,
      { align: "center" }
    );
  
    doc.setFontSize(10);
  
    doc.text(
      `Period: ${formatDate(startDate)} - ${formatDate(endDate)}`,
      14,
      60
    );
  
    let startY = 70;
  
    /* =========================
        COMMON TABLE STYLE
    ========================= */
  
    const tableStyles = {
      theme: "grid",
  
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",
      },
  
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
  
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    };
  
    /* =========================
        TITHE REPORT
    ========================= */
  
    if (reportType === "Tithe") {
  
      doc.setFontSize(12);
  
      doc.text(
        `Total Members Paid: ${result.totalMembers}`,
        14,
        startY
      );
  
      doc.text(
        `Total Tithes: ${money(result.totalTithes)}`,
        14,
        startY + 7
      );
  
      const rows = result.members?.map((m) => [
        m.member_id,
        `${m.first_name} ${m.last_name || ""}`,
        money(m.amount_paid),
        formatDate(m.date_paid),
      ]);
  
      if (rows?.length) {
  
        autoTable(doc, {
          startY: startY + 18,
  
          head: [[
            "Member ID",
            "Name",
            "Amount",
            "Date",
          ]],
  
          body: rows,
  
          ...tableStyles,
        });
  
      }
  
    }
  
    /* =========================
        FINANCIAL REPORT
    ========================= */
  
    if (reportType === "Financial") {
  
      autoTable(doc, {
        startY,
  
        head: [["Description", "Amount"]],
  
        body: [
          ["Opening Balance", money(result.openingBalance)],
        ],
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 8;
  
      autoTable(doc, {
        startY,
  
        head: [["Income Type", "Amount"]],
  
        body: result.income.map((i) => [
          i.income_type,
          money(i.total),
        ]),
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 8;
  
      autoTable(doc, {
        startY,
  
        head: [["Expense Category", "Amount"]],
  
        body: result.expenses.map((e) => [
          e.category,
          money(e.total),
        ]),
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 12;
  
      doc.setFontSize(12);
  
      doc.text(
        `Total Income: ${money(result.totalIncome)}`,
        14,
        startY
      );
  
      doc.text(
        `Total Expense: ${money(result.totalExpense)}`,
        14,
        startY + 7
      );
  
      doc.text(
        `Closing Balance: ${money(result.closingBalance)}`,
        14,
        startY + 14
      );
  
    }
  
    /* =========================
        ATTENDANCE REPORT
    ========================= */
  
    if (reportType === "Attendance") {
  
      doc.setFontSize(12);
  
      doc.text(
        `Unique Members: ${result.totalMembers}`,
        14,
        startY
      );
  
      doc.text(
        `Member Attendance: ${result.totalMemberAttendance}`,
        14,
        startY + 7
      );
  
      doc.text(
        `Visitors: ${result.totalVisitors}`,
        14,
        startY + 14
      );
  
      doc.text(
        `Total Attendance: ${result.totalAttendance}`,
        14,
        startY + 21
      );
  
      const rows = result.services?.map((s) => [
        formatDate(s.service_date),
        s.service_type,
        s.members,
        s.visitors,
        s.total,
      ]);
  
      if (rows?.length) {
  
        autoTable(doc, {
          startY: startY + 32,
  
          head: [[
            "Date",
            "Service",
            "Members",
            "Visitors",
            "Total",
          ]],
  
          body: rows,
  
          ...tableStyles,
        });
  
      }
  
    }
  
    /* =========================
        VISITORS REPORT
    ========================= */
  
    if (reportType === "Visitors") {
  
      doc.setFontSize(12);
  
      doc.text(
        `Total Visitors: ${result.total}`,
        14,
        startY
      );
  
      const rows = result.visitors?.map((v) => [
        `${v.first_name} ${v.last_name || ""}`,
        formatDate(v.visit_date),
        v.service_type,
      ]);
  
      if (rows?.length) {
  
        autoTable(doc, {
          startY: startY + 15,
  
          head: [[
            "Name",
            "Visit Date",
            "Service",
          ]],
  
          body: rows,
  
          ...tableStyles,
        });
  
      }
  
    }
  
    /* =========================
        WELFARE REPORT
    ========================= */
  
    if (reportType === "Welfare") {
  
      autoTable(doc, {
        startY,
  
        head: [["Description", "Amount"]],
  
        body: [
          ["Opening Balance", money(result.openingBalance)],
        ],
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 8;
  
      autoTable(doc, {
        startY,
  
        head: [["Income Source", "Amount"]],
  
        body: result.income.map((i) => [
          i.source,
          money(i.total),
        ]),
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 8;
  
      autoTable(doc, {
        startY,
  
        head: [["Expense Category", "Amount"]],
  
        body: result.expenses.map((e) => [
          e.category,
          money(e.total),
        ]),
  
        ...tableStyles,
      });
  
      startY = doc.lastAutoTable.finalY + 12;
  
      doc.setFontSize(12);
  
      doc.text(
        `Total Income: ${money(result.totalIncome)}`,
        14,
        startY
      );
  
      doc.text(
        `Total Expense: ${money(result.totalExpense)}`,
        14,
        startY + 7
      );
  
      doc.text(
        `Closing Balance: ${money(result.closingBalance)}`,
        14,
        startY + 14
      );
  
    }
  /* =========================
    FOOTER
    ========================= */

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(9);

    doc.text(
      `Generated on ${formatDate(new Date())}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: "right" }
    );
  
    /* =========================
        SAVE
    ========================= */
  
    doc.save(
      `${reportType}-report-${startDate}-to-${endDate}.pdf`
    );
  
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