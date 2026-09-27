import { useEffect, useState } from "react";

import YouthAddTransaction from "../../components/youthAddTransaction";

import IncomeExpenseChart from "../../components/IncomeExpenseChart";
import IncomeCategoryChart from "../../components/IncomeCategoryChart";
import ExpenseCategoryChart from "../../components/ExpenseCategoryChart";

import {
  getIncomeByFund,
  getExpenditureByFund,
  deleteIncome,
  deleteExpenditure,
  updateIncome,
  updateExpenditure,
} from "../../services/api";

import "./FinancialSecretaryFinance.css";
import "./AdminFinance.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Wallet,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

const FUND_CODE = "YOUTH";
const FUND_NAME = "Youth";

function YouthFinance() {
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [dateFilter, setDateFilter] =
    useState(today);

  const [editingTx, setEditingTx] =
    useState(null);

  const [editForm, setEditForm] = useState({});

  /*
   * LOAD YOUTH FINANCE
   */
  useEffect(() => {
    loadFinance();
  }, []);

  const loadFinance = async () => {
    try {
      setLoading(true);

      const incomeData =
        await getIncomeByFund(FUND_CODE);

      const expenseData =
        await getExpenditureByFund(FUND_CODE);

      setIncome(
        Array.isArray(incomeData)
          ? incomeData
          : incomeData?.data || []
      );

      setExpenses(
        Array.isArray(expenseData)
          ? expenseData
          : expenseData?.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load Youth finance:",
        err
      );

      alert("Failed to load Youth finance data");
    } finally {
      setLoading(false);
    }
  };

  /*
   * MERGE INCOME + EXPENSES
   */
  const transactions = [
    ...income.map((i) => ({
      id: `INC-${i.id}`,
      date: i.date_received,
      type: "Income",
      description:
        i.source_description ||
        i.income_type,
      amount: i.amount,
      status: "Completed",
    })),

    ...expenses.map((e) => ({
      id: `EXP-${e.id}`,
      date: e.date_spent,
      type: "Expense",
      description:
        e.description ||
        e.category,
      amount: e.amount,
      status: "Completed",
    })),
  ].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );

  /*
   * FILTER TRANSACTIONS
   */
  const filteredTransactions =
    transactions.filter((tx) => {
      const searchLower =
        search.toLowerCase();

      const matchesSearch =
        tx.description
          ?.toLowerCase()
          .includes(searchLower) ||
        tx.type
          .toLowerCase()
          .includes(searchLower) ||
        tx.id
          .toLowerCase()
          .includes(searchLower);

      const matchesType =
        typeFilter === "All" ||
        tx.type === typeFilter;

      const matchesDate = dateFilter
        ? new Date(tx.date)
            .toISOString()
            .split("T")[0] ===
          dateFilter
        : true;

      return (
        matchesSearch &&
        matchesType &&
        matchesDate
      );
    });

  /*
   * TOTALS
   */
  const totalIncome = income.reduce(
    (sum, i) =>
      sum + Number(i.amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (sum, e) =>
      sum + Number(e.amount || 0),
    0
  );

  const balance =
    totalIncome - totalExpense;

  /*
   * PARSE TRANSACTION ID
   */
  const parseTransaction = (tx) => {
    const [type, id] =
      tx.id.split("-");

    return {
      type,
      id,
    };
  };

  /*
   * RESTRICTED TRANSACTIONS
   *
   * Youth transactions currently do not
   * have Day Born split.
   *
   * We still protect tithe records in case
   * one ever enters this fund.
   */
  const isRestricted = (tx) => {
    const desc =
      tx.description?.toLowerCase() ||
      "";

    const isTithe =
      tx.type === "Income" &&
      desc.includes("tithe");

    return isTithe;
  };

  /*
   * DELETE
   */
  const handleDelete = async (tx) => {
    if (isRestricted(tx)) {
      alert(
        "This transaction cannot be deleted from Youth Finance."
      );
      return;
    }

    if (
      !window.confirm(
        "Delete this Youth transaction?"
      )
    ) {
      return;
    }

    const { type, id } =
      parseTransaction(tx);

    try {
      if (type === "INC") {
        await deleteIncome(id);
      } else {
        await deleteExpenditure(id);
      }

      await loadFinance();
    } catch (err) {
      console.error(err);

      alert(
        err?.message ||
          "Failed to delete transaction"
      );
    }
  };

  /*
   * OPEN EDIT
   */
  const openEdit = (tx) => {
    if (isRestricted(tx)) {
      alert(
        "This transaction cannot be edited from Youth Finance."
      );
      return;
    }

    setEditingTx(tx);

    setEditForm({
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
    });
  };

  /*
   * SUBMIT EDIT
   */
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (
      !editForm.description ||
      !editForm.amount ||
      !editForm.date
    ) {
      alert(
        "Description, amount and date are required"
      );
      return;
    }

    const { type, id } =
      parseTransaction(editingTx);

    try {
      if (type === "INC") {
        await updateIncome(id, {
          fund_code: FUND_CODE,
          income_type:
            editForm.description,
          amount: Number(editForm.amount),
          date_received:
            editForm.date,
        });
      } else {
        await updateExpenditure(id, {
          fund_code: FUND_CODE,
          category:
            editForm.description,
          amount: Number(editForm.amount),
          date_spent:
            editForm.date,
        });
      }

      setEditingTx(null);

      setEditForm({});

      await loadFinance();
    } catch (err) {
      console.error(
        "Update failed:",
        err
      );

      alert(
        err?.message ||
          "Failed to update transaction"
      );
    }
  };

  /*
   * EXPORT CSV
   */
  const exportToCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Description",
      "Amount",
      "Status",
    ];

    const rows =
      filteredTransactions.map(
        (tx) => [
          tx.id,
          new Date(
            tx.date
          ).toLocaleDateString(),
          tx.type,
          tx.description,
          tx.amount,
          tx.status,
        ]
      );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) =>
              `"${String(value ?? "")
                .replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const link =
      document.createElement("a");

    link.href =
      encodeURI(csvContent);

    link.download =
      "youth_finance_report.csv";

    link.click();
  };

  /*
   * EXPORT PDF
   */
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);

    doc.text(
      "Youth Financial Report",
      14,
      15
    );

    doc.setFontSize(10);

    doc.text(
      "Fund: Youth",
      14,
      21
    );

    autoTable(doc, {
      startY: 28,

      head: [
        [
          "ID",
          "Date",
          "Type",
          "Description",
          "Amount",
          "Status",
        ],
      ],

      body:
        filteredTransactions.map(
          (tx) => [
            tx.id,
            new Date(
              tx.date
            ).toLocaleDateString(),
            tx.type,
            tx.description,
            `GH₵ ${Number(
              tx.amount
            ).toFixed(2)}`,
            tx.status,
          ]
        ),

      styles: {
        fontSize: 8,
      },
    });

    doc.save(
      "youth_finance_report.pdf"
    );
  };

  /*
   * LOADING
   */
  if (loading) {
    return (
      <p style={{ padding: 20 }}>
        Loading Youth finance...
      </p>
    );
  }

  return (
    <div className="finance-page">

      {/* HEADER */}
      <div className="finance-header">
        <div className="finance-title">
          <span className="finance-title-icon">
            <Wallet />
          </span>

          <span className="finance-title-text">
            Youth Financial Management
          </span>
        </div>

        <div className="finance-action-btn">
          <YouthAddTransaction
            onSaved={loadFinance}
          />
        </div>
      </div>

      {/* FUND INDICATOR */}
      <div
        style={{
          marginBottom: "15px",
          fontWeight: "600",
        }}
      >
        Fund: {FUND_NAME}
      </div>

      {/* STATS */}
      <div className="finance-stats">

        <div className="finance-stats-card">
          <h3>Total Income</h3>

          <p>
            GH₵{" "}
            {totalIncome.toFixed(2)}
          </p>
        </div>

        <div className="finance-stats-card">
          <h3>Total Expense</h3>

          <p>
            GH₵{" "}
            {totalExpense.toFixed(2)}
          </p>
        </div>

        <div className="finance-stats-card">
          <h3>Balance</h3>

          <p>
            GH₵{" "}
            {balance.toFixed(2)}
          </p>
        </div>

      </div>

      {/* INCOME VS EXPENSE */}
      <div>
        <IncomeExpenseChart
          income={income}
          expenses={expenses}
        />
      </div>

      {/* CATEGORY CHARTS */}
      <div className="finance-charts">

        <IncomeCategoryChart
          income={income}
        />

        <ExpenseCategoryChart
          expenses={expenses}
        />

      </div>

      {/* CONTROLS */}
      <div className="finance-controls">

        <input
          type="text"
          placeholder="Search Youth transactions..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
        >
          <option value="All">
            All
          </option>

          <option value="Income">
            Income
          </option>

          <option value="Expense">
            Expense
          </option>
        </select>

        <div className="finance-date-filter">

          <input
            type="date"
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(
                e.target.value
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              setDateFilter(
                new Date()
                  .toISOString()
                  .split("T")[0]
              )
            }
          >
            Today
          </button>

          <button
            type="button"
            onClick={() =>
              setDateFilter("")
            }
          >
            Show All
          </button>

        </div>

        {/* EXPORT */}
        <div className="finance-export-actions">

          <button
            className="finance-export-btn"
            onClick={exportToCSV}
          >
            <FileSpreadsheet
              size={18}
            />

            Export Excel
          </button>

          <button
            className="finance-export-btn pdf"
            onClick={exportToPDF}
          >
            <FileText size={18} />

            Download PDF
          </button>

        </div>

      </div>

      {/* TRANSACTION TABLE */}
      <div className="finance-table-wrapper">

        <table className="finance-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredTransactions.length ===
            0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                  }}
                >
                  No Youth finance records
                </td>
              </tr>
            ) : (
              filteredTransactions.map(
                (tx) => (
                  <tr key={tx.id}>

                    <td>
                      {tx.id}
                    </td>

                    <td>
                      {new Date(
                        tx.date
                      ).toLocaleDateString()}
                    </td>

                    <td
                      className={
                        tx.type ===
                        "Income"
                          ? "type income"
                          : "type expense"
                      }
                    >
                      {tx.type}
                    </td>

                    <td>
                      {tx.description}
                    </td>

                    <td>
                      GH₵{" "}
                      {Number(
                        tx.amount
                      ).toFixed(2)}
                    </td>

                    <td className="status completed">
                      {tx.status}
                    </td>

                    <td>

                      <div className="finance-actions">

                        <button
                          className="finance-edit-btn"
                          disabled={isRestricted(
                            tx
                          )}
                          onClick={() =>
                            openEdit(tx)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="finance-delete-btn"
                          disabled={isRestricted(
                            tx
                          )}
                          onClick={() =>
                            handleDelete(
                              tx
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

      {/* EDIT MODAL */}
      {editingTx && (
        <div
          className="edit-transaction-modal-overlay"
          onClick={() =>
            setEditingTx(null)
          }
        >

          <div
            className="edit-transaction-modal-box"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3>
              Edit Youth Transaction
            </h3>

            <form
              onSubmit={
                handleEditSubmit
              }
            >

              <input
                value={
                  editForm.description ||
                  ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description:
                      e.target.value,
                  })
                }
                placeholder="Description"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  editForm.amount || ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    amount:
                      e.target.value,
                  })
                }
                placeholder="Amount"
              />

              <input
                type="date"
                value={
                  editForm.date
                    ? editForm.date.split(
                        "T"
                      )[0]
                    : ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    date:
                      e.target.value,
                  })
                }
              />

              <button
                type="submit"
                className="edit-transaction-save-button"
              >
                Save
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default YouthFinance;