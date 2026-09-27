const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * ============================================================
 * MAIN API REQUEST HELPER
 * ============================================================
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Unauthorized / expired token
  if (response.status === 401) {
    console.error("❌ 401 UNAUTHORIZED:", endpoint);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";

    throw new Error("UNAUTHORIZED");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}


/* ============================================================
   AUTH
   ============================================================ */

export function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}


/* ============================================================
   MEMBERS
   ============================================================ */

export function getMembers() {
  return apiRequest("/members");
}


/* ============================================================
   TITHES
   ============================================================ */

export function saveBulkTithe(data) {
  return apiRequest("/tithes/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAllTithes() {
  return apiRequest("/tithes");
}

export function getTitheMembers() {
  return apiRequest("/members");
}

export function updateTithe(id, data) {
  return apiRequest(`/tithes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTithe(id) {
  return apiRequest(`/tithes/${id}`, {
    method: "DELETE",
  });
}


/* ============================================================
   FINANCE
   ============================================================ */

/*
 * IMPORTANT:
 *
 * All finance transactions now use a FUND.
 *
 * Examples:
 * MAIN
 * YOUTH
 * MEN
 * WOMEN
 * CHILDREN
 *
 */


/* -------------------- INCOME -------------------- */

// Get ALL income from all funds
export function getIncome() {
  return apiRequest("/income");
}


// Get income belonging to one fund
//
// Example:
// getIncomeByFund("YOUTH")
//
export function getIncomeByFund(fundCode) {
  return apiRequest(
    `/income/fund/${encodeURIComponent(fundCode)}`
  );
}

export function getFundByCode(fundCode) {
  return apiRequest(
    `/funds/${encodeURIComponent(fundCode)}`
  );
}


// Get income for a fund within a date range
//
// Example:
// getIncomeByFundAndDateRange(
//   "YOUTH",
//   "2026-08-01",
//   "2026-08-31"
// )
//
export function getIncomeByFundAndDateRange(
  fundCode,
  start,
  end
) {
  return apiRequest(
    `/income/fund/${encodeURIComponent(fundCode)}/range?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Get income from ALL funds within a date range
export function getIncomeByDateRange(start, end) {
  return apiRequest(
    `/income/range?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Add income
//
// data should contain the fund information expected
// by your backend.
//
// Example:
//
// {
//   amount: 500,
//   description: "Youth Week Offering",
//   fund_code: "YOUTH",
//   ...
// }
//
export function addIncome(data) {
  return apiRequest("/income", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// Update income
export function updateIncome(id, data) {
  return apiRequest(`/income/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}


// Delete income
export function deleteIncome(id) {
  return apiRequest(`/income/${id}`, {
    method: "DELETE",
  });
}


/* -------------------- EXPENDITURE -------------------- */

// Get ALL expenditure
export function getExpenses() {
  return apiRequest("/expenditure");
}


// Get expenditure belonging to one fund
//
// Example:
// getExpenditureByFund("YOUTH")
//
export function getExpenditureByFund(fundCode) {
  return apiRequest(
    `/expenditure/fund/${encodeURIComponent(fundCode)}`
  );
}


// Get expenditure for a fund within a date range
export function getExpenditureByFundAndDateRange(
  fundCode,
  start,
  end
) {
  return apiRequest(
    `/expenditure/fund/${encodeURIComponent(
      fundCode
    )}/range?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Get expenditure from ALL funds within a date range
export function getExpenditureByDateRange(start, end) {
  return apiRequest(
    `/expenditure/range?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Add expenditure
//
// Example:
//
// {
//   amount: 300,
//   description: "Youth transportation",
//   fund_code: "YOUTH",
//   ...
// }
//
export function addExpenditure(data) {
  return apiRequest("/expenditure", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// Update expenditure
export function updateExpenditure(id, data) {
  return apiRequest(`/expenditure/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}


// Delete expenditure
export function deleteExpenditure(id) {
  return apiRequest(`/expenditure/${id}`, {
    method: "DELETE",
  });
}


/* ============================================================
   TITHE → INCOME SYNCHRONIZATION
   ============================================================ */

/*
 * Synchronize weekly tithes into the finance system.
 */
export function syncWeeklyTithe(data) {
  return apiRequest("/income/sync-tithe-weekly", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* ============================================================
   USERS / ROLES
   ============================================================ */

export function getLoggedInUser() {
  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getApprovers() {
  return apiRequest("/user-roles/approvers");
}

export function getRoles() {
  return apiRequest("/role");
}


/* ============================================================
   REPORTS
   ============================================================ */

// Monthly financial report
export function getMonthlyFinance(start, end, fundCode = "ALL") {
  const params = new URLSearchParams({
    start,
    end,
  });

  if (fundCode !== "ALL") {
    params.append("fund_code", fundCode);
  }

  return apiRequest(`/reports/finance/monthly?${params.toString()}`);
}


// Tithe summary
export function getTitheSummary(start, end) {
  return apiRequest(
    `/reports/tithes/summary?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Attendance summary
export function getAttendanceSummary(start, end) {
  return apiRequest(
    `/reports/attendance/summary?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Attendance weekly chart
export function getAttendanceChart(start, end) {
  return apiRequest(
    `/reports/attendance/weekly?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Finance weekly chart
export function getFinanceChart(start, end) {
  return apiRequest(
    `/reports/finance/weekly?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Welfare report
export function getWelfareReport(start, end) {
  return apiRequest(
    `/reports/welfare?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}


// Get saved reports
export function getAllReports() {
  return apiRequest("/reports");
}


// Save report
export function saveReport(data) {
  return apiRequest("/reports/save", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// Delete report
export function deleteReport(id) {
  return apiRequest(`/reports/${id}`, {
    method: "DELETE",
  });
}


// Delete all reports
export function clearReports() {
  return apiRequest("/reports", {
    method: "DELETE",
  });
}


/* ============================================================
   VISITORS
   ============================================================ */

export function getAllVisitors() {
  return apiRequest("/visitors");
}

export function getVisitorsByDate(date) {
  return apiRequest(`/visitors/date/${date}`);
}

export function getVisitorsReport(start, end) {
  return apiRequest(
    `/visitors/report?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`
  );
}

export function addVisitor(data) {
  return apiRequest("/visitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* ============================================================
   EVENTS
   ============================================================ */

export function getEvents(start, end) {
  let url = "/events";

  if (start && end) {
    url += `?start=${encodeURIComponent(
      start
    )}&end=${encodeURIComponent(end)}`;
  }

  return apiRequest(url);
}

export function createEvent(data) {
  return apiRequest("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteEvent(id) {
  return apiRequest(`/events/${id}`, {
    method: "DELETE",
  });
}


/* ============================================================
   ACTIVITY
   ============================================================ */

export function getActivities() {
  return apiRequest("/activity");
}


/* ============================================================
   ATTENDANCE
   ============================================================ */

export function markAttendanceBulk(data) {
  return apiRequest("/attendance/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAttendanceStats() {
  return apiRequest("/attendance/stats");
}

export function updateAttendance(attendanceCode, data) {
  return apiRequest(`/attendance/${attendanceCode}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}


/* ============================================================
   DASHBOARD
   ============================================================ */

export function getTodaySummary() {
  return apiRequest("/dashboard/today-summary");
}


/* ============================================================
   WELFARE
   ============================================================ */


/* -------------------- WELFARE EVENTS -------------------- */

export function createWelfareEvent(data) {
  return apiRequest("/welfare/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWelfareEvents() {
  return apiRequest("/welfare/events");
}

export function assignMembersToWelfareEvent(eventId) {
  return apiRequest(
    `/welfare/events/${eventId}/assign`,
    {
      method: "POST",
    }
  );
}

export function getWelfareEventMembers(eventId) {
  return apiRequest(
    `/welfare/events/${eventId}/members`
  );
}

export function getWelfareEventMembersFull(eventId) {
  return apiRequest(
    `/welfare/events/${eventId}/members/full`
  );
}


/* -------------------- WELFARE PAYMENTS -------------------- */

export function recordWelfarePayment(data) {
  return apiRequest("/welfare/pay", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function saveBulkWelfare(data) {
  return apiRequest("/welfare/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWelfarePaymentHistory(eventMemberId) {
  return apiRequest(
    `/welfare/history/${eventMemberId}`
  );
}


/* -------------------- WELFARE LEDGERS -------------------- */

export function getWelfareIncomeLedger() {
  return apiRequest("/welfare/income-ledger");
}

export function getWelfareExpenseLedger() {
  return apiRequest("/welfare/expense-ledger");
}


/* -------------------- WELFARE EXPENSE TYPES -------------------- */

export function getWelfareExpenseTypes() {
  return apiRequest("/welfare/expenses/types");
}

export function createWelfareExpenseType(data) {
  return apiRequest("/welfare/expenses/types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* -------------------- WELFARE EXPENSES -------------------- */

export function addWelfareExpense(data) {
  return apiRequest("/welfare/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWelfareExpenses() {
  return apiRequest("/welfare/expenses");
}

export function getSingleWelfareExpense(id) {
  return apiRequest(`/welfare/expenses/${id}`);
}


/* -------------------- WELFARE SUMMARY -------------------- */

export function getWelfareSummary() {
  return apiRequest(
    "/welfare/expenses/summary/all"
  );
}


/* -------------------- DAY BORN -------------------- */

export function addDayBornSplit(data) {
  return apiRequest("/welfare/dayborn-split", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* ============================================================
   DEPARTMENTS
   ============================================================ */

// Get all departments
export function getDepartments() {
  return apiRequest("/departments");
}


// Create department
export function createDepartment(data) {
  return apiRequest("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// Update department
export function updateDepartment(id, data) {
  return apiRequest(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}


// Delete department
export function deleteDepartment(id) {
  return apiRequest(`/departments/${id}`, {
    method: "DELETE",
  });
}


/* ============================================================
   MEMBER → DEPARTMENT
   ============================================================ */

// Assign member to department
export function assignMemberToDepartment(data) {
  return apiRequest("/member-departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// Get members in department
export function getDepartmentMembers(deptId) {
  return apiRequest(
    `/member-departments/department/${deptId}`
  );
}


// Remove member from department
export function removeMemberFromDepartment(id) {
  return apiRequest(
    `/member-departments/${id}`,
    {
      method: "DELETE",
    }
  );
}