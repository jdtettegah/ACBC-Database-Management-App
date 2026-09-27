import "./AddTransaction.css";
import { useState, useEffect } from "react";

import {
  addIncome,
  addExpenditure,
  getApprovers,
  getLoggedInUser,
  getFundByCode,
} from "../services/api";

import { HandCoins } from "lucide-react";
import { createPortal } from "react-dom";

const FUND_CODE = "CHILDREN";
const FUND_NAME = "Children";

function ChildrenAddTransaction({ onSaved }) {
  const [type, setType] = useState("Income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [approvedBy, setApprovedBy] = useState("");

  const [approvers, setApprovers] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [fundId, setFundId] = useState(null);

  const user = getLoggedInUser();

  /*
   * CHILDREN INCOME CATEGORIES
   */
  const INCOME_CATEGORIES = [
    "Children's Offering",
    "Children's Dues",
    "Children's Contributions",
    "Children's Fundraising",
    "Children's Donations",
    "Programme Contributions",
    "Special Contributions",
    "Other Income",
  ];

  /*
   * CHILDREN EXPENSE CATEGORIES
   */
  const EXPENSE_CATEGORIES = [
    "Transportation",
    "Programme Expenses",
    "Refreshments",
    "Welfare",
    "Evangelism",
    "Association Dues",
    "Convention Dues",
    "Equipment",
    "Meetings",
    "Printing and Stationery",
    "Teaching Materials",
    "Donations",
    "Other Expenses",
  ];

  /*
   * LOAD APPROVERS
   */
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
        console.error("Failed to load approvers:", err);
        alert("Failed to load approvers");
      } finally {
        setLoadingApprovers(false);
      }
    };

    loadApprovers();
  }, []);

  /*
   * CLOSE MODAL WITH ESC
   */

  useEffect(() => {
    const loadFund = async () => {
      try {
        const fund = await getFundByCode(FUND_CODE);
        setFundId(fund.id);
      } catch (err) {
        console.error("Failed to load Children's fund:", err);
        alert("Failed to load Men's fund");
      }
    };
  
    loadFund();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  /*
   * RESET FORM
   */
  const resetForm = () => {
    setType("Income");
    setCategory("");
    setAmount("");
    setDate("");
    setDescription("");
    setApprovedBy("");
  };

  /*
   * SAVE TRANSACTION
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      return alert("Please select a category");
    }

    if (!amount || Number(amount) <= 0) {
      return alert("Please enter a valid amount");
    }

    if (!date) {
      return alert("Date is required");
    }

    if (!user?.id) {
      return alert("Unable to identify the logged-in user");
    }

    if (type === "Expense" && !approvedBy) {
      return alert("Please select who approved this expense");
    }

    if (!fundId) {
      return alert("Children's fund is not available");
    }

    try {
      setLoading(true);

      /*
       * INCOME
       */
      if (type === "Income") {
        await addIncome({
          fund_id: fundId,
          income_type: category,
          amount: Number(amount),
          source_description: description,
          date_received: date,
          recorded_by: user.id,
        });
      }

      /*
       * EXPENSE
       */
      else {
        await addExpenditure({
          fund_id: fundId,
          category,
          amount: Number(amount),
          description,
          approved_by: approvedBy,
          recorded_by: user.id,
          date_spent: date,
        });
      }

      alert("Children's transaction saved successfully ✅");

      setOpen(false);
      resetForm();

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(
        "Failed to save Children's transaction:",
        err
      );

      alert(
        err?.message ||
          "Failed to save Children's transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="add-transaction-button"
        onClick={() => setOpen(true)}
      >
        <HandCoins size={18} />
        Add Transaction
      </button>

      {open &&
        createPortal(
          <div
            className="add-transaction-modal-overlay"
            onClick={() => !loading && setOpen(false)}
          >
            <div
              className="add-transaction-page"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="add-transaction-header">
                <h2>Add Children's Transaction</h2>

                <p>
                  Record Children's Ministry income or expense
                </p>

                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Fund: {FUND_NAME}
                </div>
              </div>

              <form
                className="add-transaction-form"
                onSubmit={handleSubmit}
              >
                {/* TRANSACTION TYPE */}
                <div className="add-transaction-form-group">
                  <label>Transaction Type</label>

                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setCategory("");
                      setApprovedBy("");
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

                {/* CATEGORY */}
                <div className="add-transaction-form-group">
                  <label>Category</label>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      -- Select Category --
                    </option>

                    {(type === "Income"
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

                {/* AMOUNT */}
                <div className="add-transaction-form-group">
                  <label>Amount (GHS)</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value)
                    }
                    required
                  />
                </div>

                {/* DATE */}
                <div className="add-transaction-form-group">
                  <label>Date</label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    required
                  />
                </div>

                {/* APPROVER */}
                {type === "Expense" && (
                  <div className="add-transaction-form-group">
                    <label>Approved By</label>

                    <select
                      value={approvedBy}
                      onChange={(e) =>
                        setApprovedBy(e.target.value)
                      }
                      required
                      disabled={loadingApprovers}
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

                {/* DESCRIPTION */}
                <div className="add-transaction-form-group full-width">
                  <label>Description</label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Optional notes..."
                  />
                </div>

                {/* ACTIONS */}
                <div className="add-transaction-actions">
                  <button
                    type="button"
                    className="add-transaction-cancel-btn"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="add-transaction-save-btn"
                    disabled={loading}
                  >
                    {loading
                      ? "Saving..."
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

export default ChildrenAddTransaction;