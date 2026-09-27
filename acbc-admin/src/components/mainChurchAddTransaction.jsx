import "./AddTransaction.css";
import { useState, useEffect } from "react";

import {
  addIncome,
  addExpenditure,
  getApprovers,
  addDayBornSplit,
  getLoggedInUser,
  getFundByCode,
} from "../services/api";

import { HandCoins } from "lucide-react";
import { createPortal } from "react-dom";

function MainChurchAddTransaction({ onSaved }) {
  /* ============================================================
     MAIN CHURCH FUND
     ============================================================ */

  const FUND_CODE = "MAIN";
  const FUND_NAME = "Main Church";

  /* ============================================================
     STATES
     ============================================================ */

  const [type, setType] = useState("Income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [approvers, setApprovers] = useState([]);
  const [welfareAmount, setWelfareAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingApprovers, setLoadingApprovers] = useState(false);

  /* ============================================================
     FUND ID
     ============================================================ */

  const [fundId, setFundId] = useState(null);
  const [loadingFund, setLoadingFund] = useState(true);

  /* ============================================================
     CURRENT USER
     ============================================================ */

  const user = getLoggedInUser();

  /* ============================================================
     INCOME CATEGORIES
     ============================================================ */

  const INCOME_CATEGORIES = [
    "Main Offering",
    "Second Offering",
    "Day Born Offering",
    "Seed Offering",
    "Givings from Ministrations",
    "Altar Offering",
    "Special Offering",
    "Mid-Year Harvest",
    "Annual Harvest",
    "Received Donation",
    "Other Contributions",
  ];

  /* ============================================================
     EXPENSE CATEGORIES
     ============================================================ */

  const EXPENSE_CATEGORIES = [
    "Honorarium",
    "Transportation",
    "Association Dues",
    "Convention Dues",
    "Miscellaneous",
    "Meetings",
    "Donations",
    "Other Expenses",
  ];

  /* ============================================================
     LOAD MAIN CHURCH FUND
     ============================================================ */

  useEffect(() => {
    const loadFund = async () => {
      try {
        setLoadingFund(true);

        const fund = await getFundByCode(FUND_CODE);

        if (!fund?.id) {
          throw new Error("Main Church fund was not found");
        }

        if (fund.is_active === false) {
          throw new Error("Main Church fund is currently inactive");
        }

        setFundId(fund.id);
      } catch (err) {
        console.error("Failed to load Main Church fund:", err);

        alert(
          err.message ||
            "Failed to load Main Church fund"
        );
      } finally {
        setLoadingFund(false);
      }
    };

    loadFund();
  }, []);

  /* ============================================================
     LOAD APPROVERS
     ============================================================ */

  useEffect(() => {
    const loadApprovers = async () => {
      try {
        setLoadingApprovers(true);

        const data = await getApprovers();

        setApprovers(
          Array.isArray(data)
            ? data
            : data?.data || []
        );
      } catch (err) {
        console.error(
          "Failed to load approvers:",
          err
        );

        alert(
          err.message ||
            "Failed to load approvers"
        );
      } finally {
        setLoadingApprovers(false);
      }
    };

    loadApprovers();
  }, []);

  /* ============================================================
     ESC KEY
     ============================================================ */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener(
        "keydown",
        handleEsc
      );
    }

    return () => {
      window.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, [open]);

  /* ============================================================
     RESET FORM
     ============================================================ */

  const resetForm = () => {
    setType("Income");
    setCategory("");
    setAmount("");
    setDate("");
    setDescription("");
    setApprovedBy("");
    setWelfareAmount("");
  };

  /* ============================================================
     SUBMIT TRANSACTION
     ============================================================ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    /* ----------------------------------------------------------
       BASIC VALIDATION
       ---------------------------------------------------------- */

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!date) {
      alert("Date is required");
      return;
    }

    if (!category) {
      alert("Please select a category");
      return;
    }

    if (!user?.id) {
      alert(
        "Unable to identify the logged-in user. Please log in again."
      );
      return;
    }

    /* ----------------------------------------------------------
       MAIN CHURCH FUND VALIDATION
       ---------------------------------------------------------- */

    /*
     * Day Born Split uses its own API flow, so it does not
     * require fundId here.
     *
     * Normal income and expenditure DO require fundId.
     */

    if (
      !(
        type === "Income" &&
        category === "Day Born Offering"
      ) &&
      !fundId
    ) {
      alert(
        `${FUND_NAME} fund is not available`
      );
      return;
    }

    /* ----------------------------------------------------------
       EXPENSE APPROVAL
       ---------------------------------------------------------- */

    if (
      type === "Expense" &&
      !approvedBy
    ) {
      alert(
        "Please select who approved this expense"
      );
      return;
    }

    /* ----------------------------------------------------------
       DAY BORN VALIDATION
       ---------------------------------------------------------- */

       if (
        type === "Income" &&
        category === "Day Born Offering"
      ) {
        const welfare = Number(welfareAmount || 0);
      
        if (welfare < 0) {
          alert("Welfare amount cannot be negative");
          return;
        }
      
        if (welfare > Number(amount)) {
          alert("Welfare amount cannot exceed total amount");
          return;
        }
      }

    try {
      setLoading(true);

      /* ========================================================
         INCOME
         ======================================================== */

      if (type === "Income") {
        /* ------------------------------------------------------
           DAY BORN OFFERING
           ------------------------------------------------------ */

        if (
          category === "Day Born Offering"
        ) {
          /*
           * IMPORTANT:
           * Keep this as fund_code for now because Day Born
           * Split has its own backend controller/API.
           */

          await addDayBornSplit({
            total_amount: Number(amount),
            welfare_amount: Number(welfareAmount || 0),
            description: description.trim(),
            recorded_by: user.id,
            date_received: date,
          });
        }

        /* ------------------------------------------------------
           NORMAL INCOME
           ------------------------------------------------------ */

        else {
          await addIncome({
            fund_id: fundId,

            income_type:
              category,

            amount:
              Number(amount),

            source_description:
              description.trim(),

            date_received:
              date,

            recorded_by:
              user.id,
          });
        }
      }

      /* ========================================================
         EXPENSE
         ======================================================== */

      else {
        await addExpenditure({
          fund_id: fundId,

          category,

          amount:
            Number(amount),

          description:
            description.trim(),

          approved_by:
            approvedBy,

          recorded_by:
            user.id,

          date_spent:
            date,
        });
      }

      /* ========================================================
         SUCCESS
         ======================================================== */

      alert(
        `${FUND_NAME} transaction saved successfully ✅`
      );

      setOpen(false);

      resetForm();

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(
        `❌ Failed to save ${FUND_NAME} transaction:`,
        err
      );

      alert(
        err.message ||
          "Failed to save transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     OPEN MODAL
     ============================================================ */

  const openModal = () => {
    setOpen(true);
  };

  /* ============================================================
     CLOSE MODAL
     ============================================================ */

  const closeModal = () => {
    if (loading) return;

    setOpen(false);
  };

  /* ============================================================
     UI
     ============================================================ */

  return (
    <>
      {/* ======================================================
          OPEN BUTTON
          ====================================================== */}

      <button
        type="button"
        className="add-transaction-button"
        onClick={openModal}
      >
        <HandCoins size={18} />

        Add Transaction
      </button>

      {/* ======================================================
          MODAL
          ====================================================== */}

      {open &&
        createPortal(
          <div
            className="add-transaction-modal-overlay"
            onClick={closeModal}
          >
            <div
              className="add-transaction-page"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* =================================================
                  HEADER
                  ================================================= */}

              <div className="add-transaction-header">
                <h2>
                  Add Main Church Transaction
                </h2>

                <p>
                  Record income or expense for the Main Church Fund
                </p>
              </div>

              {/* =================================================
                  FUND INDICATOR
                  ================================================= */}

              <div
                style={{
                  marginBottom: "18px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  fontSize: "14px",
                }}
              >
                <strong>Fund:</strong>{" "}
                {FUND_NAME}
              </div>

              {/* =================================================
                  FORM
                  ================================================= */}

              <form
                className="add-transaction-form"
                onSubmit={handleSubmit}
              >
                {/* =================================================
                    TYPE
                    ================================================= */}

                <div className="add-transaction-form-group">
                  <label>
                    Transaction Type
                  </label>

                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setCategory("");
                      setApprovedBy("");
                      setWelfareAmount("");
                    }}
                  >
                    <option value="Income">
                      Income
                    </option>

                    <option value="Expense">
                      Expense
                    </option>
                  </select>
                </div>

                {/* =================================================
                    CATEGORY
                    ================================================= */}

                <div className="add-transaction-form-group">
                  <label>
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      -- Select Category --
                    </option>

                    {(
                      type === "Income"
                        ? INCOME_CATEGORIES
                        : EXPENSE_CATEGORIES
                    ).map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* =================================================
                    AMOUNT
                    ================================================= */}

                <div className="add-transaction-form-group">
                  <label>
                    Amount (GHS)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {/* =================================================
                    DAY BORN WELFARE SPLIT
                    ================================================= */}

                {type === "Income" &&
                  category ===
                    "Day Born Offering" && (
                    <div className="add-transaction-form-group">
                      <label>
                        Amount Given to Welfare
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={welfareAmount}
                        onChange={(e) =>
                          setWelfareAmount(
                            e.target.value
                          )
                        }
                        placeholder="Enter welfare portion"
                        required
                      />
                    </div>
                  )}

                {/* =================================================
                    DATE
                    ================================================= */}

                <div className="add-transaction-form-group">
                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(
                        e.target.value
                      )
                    }
                    required
                  />
                </div>

                {/* =================================================
                    APPROVED BY
                    ================================================= */}

                {type === "Expense" && (
                  <div className="add-transaction-form-group">
                    <label>
                      Approved By
                    </label>

                    <select
                      value={approvedBy}
                      onChange={(e) =>
                        setApprovedBy(
                          e.target.value
                        )
                      }
                      required
                      disabled={
                        loadingApprovers
                      }
                    >
                      <option value="">
                        {loadingApprovers
                          ? "Loading approvers..."
                          : "-- Select Approver --"}
                      </option>

                      {approvers.map((a) => (
                        <option
                          key={a.user_id}
                          value={a.user_id}
                        >
                          {a.role_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* =================================================
                    DESCRIPTION
                    ================================================= */}

                <div className="add-transaction-form-group full-width">
                  <label>
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Optional notes..."
                  />
                </div>

                {/* =================================================
                    ACTION BUTTONS
                    ================================================= */}

                <div className="add-transaction-actions">
                  <button
                    type="button"
                    className="add-transaction-cancel-btn"
                    onClick={closeModal}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="add-transaction-save-btn"
                    disabled={
                      loading ||
                      loadingFund ||
                      (!fundId &&
                        !(
                          type === "Income" &&
                          category ===
                            "Day Born Offering"
                        ))
                    }
                  >
                    {loading
                      ? "Saving..."
                      : loadingFund
                      ? "Loading fund..."
                      : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default MainChurchAddTransaction;

