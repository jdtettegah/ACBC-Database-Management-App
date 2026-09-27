import { useEffect, useState } from "react";

import AddTransaction from "../../components/AddTransaction";
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
import MainChurchAddTransaction from "../../components/mainChurchAddTransaction";
import MenAddTransaction from "../../components/menAddTransaction";


/* ============================================================
   MAIN CHURCH FINANCE
   ============================================================ */

function MenFinance() {

  /* ----------------------------------------------------------
     FUND
     ---------------------------------------------------------- */

  const FUND_CODE = "MAIN";
  const FUND_NAME = "Main Church";


  /* ----------------------------------------------------------
     STATE
     ---------------------------------------------------------- */

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const [dateFilter, setDateFilter] = useState(today);

  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({});


  /* ==========================================================
     LOAD FINANCE
     ========================================================== */

  useEffect(() => {
    loadFinance();
  }, []);


  const loadFinance = async () => {

    try {

      setLoading(true);

      /*
       * IMPORTANT:
       *
       * We are deliberately NOT using:
       *
       * getIncome()
       * getExpenses()
       *
       * because this page belongs specifically
       * to the MAIN fund.
       */

      const [incomeData, expenseData] = await Promise.all([
        getIncomeByFund(FUND_CODE),
        getExpenditureByFund(FUND_CODE),
      ]);


      /*
       * Protect against unexpected API responses.
       */

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
        "❌ Failed to load main church finance:",
        err
      );

      alert(
        err.message ||
        "Failed to load main church finance data"
      );

    } finally {

      setLoading(false);

    }
  };


  /* ==========================================================
     MERGE TRANSACTIONS
     ========================================================== */

  const transactions = [

    ...income.map((i) => ({

      id: `INC-${i.id}`,

      originalId: i.id,

      date:
        i.date_received ||
        i.date ||
        i.created_at,

      type: "Income",

      description:
        i.source_description ||
        i.income_type ||
        i.description ||
        "Income",

      amount: Number(i.amount) || 0,

      status:
        i.status ||
        "Completed",

      fundCode:
        i.fund_code ||
        i.fundCode ||
        FUND_CODE,

    })),

    ...expenses.map((e) => ({

      id: `EXP-${e.id}`,

      originalId: e.id,

      date:
        e.date_spent ||
        e.date ||
        e.created_at,

      type: "Expense",

      description:
        e.description ||
        e.category ||
        "Expense",

      amount: Number(e.amount) || 0,

      status:
        e.status ||
        "Completed",

      fundCode:
        e.fund_code ||
        e.fundCode ||
        FUND_CODE,

    })),

  ].sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );


  /* ==========================================================
     FILTER TRANSACTIONS
     ========================================================== */

  const filteredTransactions =
    transactions.filter((tx) => {

      const searchLower =
        search.toLowerCase().trim();


      const description =
        tx.description
          ?.toLowerCase() || "";


      const type =
        tx.type
          ?.toLowerCase() || "";


      const id =
        tx.id
          ?.toLowerCase() || "";


      const matchesSearch =
        description.includes(searchLower) ||
        type.includes(searchLower) ||
        id.includes(searchLower);


      const matchesType =
        typeFilter === "All" ||
        tx.type === typeFilter;


      const matchesDate =
        dateFilter
          ? new Date(tx.date)
              .toISOString()
              .split("T")[0] === dateFilter
          : true;


      return (
        matchesSearch &&
        matchesType &&
        matchesDate
      );

    });


  /* ==========================================================
     FINANCIAL TOTALS
     ========================================================== */

  const totalIncome =
    income.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );


  const totalExpense =
    expenses.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );


  const balance =
    totalIncome - totalExpense;


  /* ==========================================================
     TRANSACTION ID PARSER
     ========================================================== */

  const parseTransaction = (tx) => {

    const [type, id] =
      tx.id.split("-");

    return {
      type,
      id,
    };
  };


  /* ==========================================================
     RESTRICTED TRANSACTIONS
     ========================================================== */

  const isRestricted = (tx) => {

    const desc =
      tx.description
        ?.toLowerCase() || "";


    /*
     * Tithes should be edited/deleted
     * from the Tithes module.
     */

    const isTithe =
      tx.type === "Income" &&
      desc.includes("tithe");


    /*
     * Welfare-generated transfers
     * should not be modified here.
     */

    const isWelfareTransfer =
      tx.type === "Expense" &&
      (
        desc.includes(
          "transfer from day born offering"
        ) ||
        desc.includes(
          "day born offering transfer"
        )
      );


    return (
      isTithe ||
      isWelfareTransfer
    );
  };


  /* ==========================================================
     DELETE
     ========================================================== */

  const handleDelete = async (tx) => {

    if (isRestricted(tx)) {

      alert(
        "This transaction must be managed from its original module."
      );

      return;
    }


    const confirmed =
      window.confirm(
        "Delete this transaction?"
      );


    if (!confirmed) return;


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

      console.error(
        "❌ Delete failed:",
        err
      );

      alert(
        err.message ||
        "Failed to delete transaction"
      );

    }

  };


  /* ==========================================================
     OPEN EDIT
     ========================================================== */

  const openEdit = (tx) => {

    if (isRestricted(tx)) {

      alert(
        "This transaction must be edited from its original module."
      );

      return;
    }


    setEditingTx(tx);


    setEditForm({

      description:
        tx.description || "",

      amount:
        tx.amount || "",

      date:
        tx.date
          ? tx.date.split("T")[0]
          : "",

    });

  };


  /* ==========================================================
     SUBMIT EDIT
     ========================================================== */

  const handleEditSubmit =
    async (e) => {

      e.preventDefault();


      if (!editingTx) return;


      const {
        type,
        id,
      } = parseTransaction(
        editingTx
      );


      try {

        if (type === "INC") {

          await updateIncome(id, {

            /*
             * Keep the transaction
             * in MAIN fund.
             */

            fund_code: FUND_CODE,

            income_type:
              editForm.description,

            source_description:
              editForm.description,

            amount:
              Number(editForm.amount),

            date_received:
              editForm.date,

          });

        } else {

          await updateExpenditure(id, {

            /*
             * Keep the transaction
             * in MAIN fund.
             */

            fund_code: FUND_CODE,

            category:
              editForm.description,

            description:
              editForm.description,

            amount:
              Number(editForm.amount),

            date_spent:
              editForm.date,

          });

        }


        setEditingTx(null);

        setEditForm({});

        await loadFinance();

      } catch (err) {

        console.error(
          "❌ Update failed:",
          err
        );

        alert(
          err.message ||
          "Failed to update transaction"
        );

      }

    };


  /* ==========================================================
     EXPORT CSV
     ========================================================== */

  const exportToCSV = () => {

    const headers = [
      "ID",
      "Date",
      "Fund",
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

          FUND_NAME,

          tx.type,

          `"${String(
            tx.description || ""
          ).replace(/"/g, '""')}"`,

          Number(tx.amount).toFixed(2),

          tx.status,

        ]
      );


    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.join(",")
      )
      .join("\n");


    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      "main_church_finance_report.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  };


  /* ==========================================================
     EXPORT PDF
     ========================================================== */

  const exportToPDF = () => {

    const doc =
      new jsPDF();


    doc.setFontSize(16);

    doc.text(
      "Main Church Financial Report",
      14,
      15
    );


    doc.setFontSize(10);

    doc.text(
      `Fund: ${FUND_NAME}`,
      14,
      21
    );


    autoTable(doc, {

      startY: 28,

      head: [[
        "ID",
        "Date",
        "Type",
        "Description",
        "Amount",
        "Status",
      ]],

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
      "main_church_finance_report.pdf"
    );

  };


  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {

    return (
      <p
        style={{
          padding: 20,
        }}
      >
        Loading Main Church Finance...
      </p>
    );

  }


  /* ==========================================================
     UI
     ========================================================== */

  return (

    <div className="finance-page">


      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="finance-header">

        <div className="finance-title">

          <span className="finance-title-icon">
            <Wallet />
          </span>

          <span className="finance-title-text">
            Main Church Finance
          </span>

        </div>


        <div className="finance-action-btn">

          <MenAddTransaction
            fundCode={FUND_CODE}
            onSuccess={loadFinance}
          />

        </div>

      </div>



      {/* ======================================================
          FUND INDICATOR
          ====================================================== */}

      <div
        className="finance-fund-indicator"
        style={{
          marginBottom: "20px",
        }}
      >
        <strong>
          Fund:
        </strong>{" "}
        {FUND_NAME}
      </div>



      {/* ======================================================
          STATS
          ====================================================== */}

      <div className="finance-stats">

        <div className="finance-stats-card">

          <h3>
            Total Income
          </h3>

          <p>
            GH₵{" "}
            {totalIncome.toFixed(2)}
          </p>

        </div>


        <div className="finance-stats-card">

          <h3>
            Total Expense
          </h3>

          <p>
            GH₵{" "}
            {totalExpense.toFixed(2)}
          </p>

        </div>


        <div className="finance-stats-card">

          <h3>
            Balance
          </h3>

          <p>
            GH₵{" "}
            {balance.toFixed(2)}
          </p>

        </div>

      </div>



      {/* ======================================================
          INCOME / EXPENSE CHART
          ====================================================== */}

      <div>

        <IncomeExpenseChart
          income={income}
          expenses={expenses}
        />

      </div>



      {/* ======================================================
          CATEGORY CHARTS
          ====================================================== */}

      <div className="finance-charts">

        <IncomeCategoryChart
          income={income}
        />

        <ExpenseCategoryChart
          expenses={expenses}
        />

      </div>



      {/* ======================================================
          FILTERS
          ====================================================== */}

      <div className="finance-controls">


        {/* SEARCH */}

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />


        {/* TYPE */}

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



        {/* DATE */}

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

            <FileText
              size={18}
            />

            Download PDF

          </button>

        </div>

      </div>



      {/* ======================================================
          TRANSACTION TABLE
          ====================================================== */}

      <div className="finance-table-wrapper">

        <table className="finance-table">

          <thead>

            <tr>

              <th>
                ID
              </th>

              <th>
                Date
              </th>

              <th>
                Type
              </th>

              <th>
                Description
              </th>

              <th>
                Amount
              </th>

              <th>
                Status
              </th>

              <th>
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredTransactions.length ===
            0 ? (

              <tr>

                <td
                  colSpan="7"
                  style={{
                    textAlign:
                      "center",
                  }}
                >
                  No records
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
                        tx.type === "Income"
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


                    <td
                      className="status completed"
                    >
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
                            handleDelete(tx)
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



      {/* ======================================================
          EDIT MODAL
          ====================================================== */}

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
              Edit Transaction
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
                required
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
                required
              />


              <input
                type="date"
                value={
                  editForm.date || ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    date:
                      e.target.value,
                  })
                }
                required
              />


              <button
                type="submit"
                className="edit-transaction-save-button"
              >
                Save
              </button>


              <button
                type="button"
                onClick={() =>
                  setEditingTx(null)
                }
              >
                Cancel
              </button>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


export default MenFinance;