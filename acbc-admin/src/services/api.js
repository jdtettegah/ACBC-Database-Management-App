const API_BASE_URL =
  import.meta.env.VITE_API_URL;

/**
 * Main request helper
 */
export async function apiRequest(endpoint, options = {}) {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Auto logout if expiredw
  if (response.status === 401) {
    console.error("❌ 401 ERROR FROM:", endpoint);
  
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  
    throw new Error("UNAUTHORIZED");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

/* ================= AUTH ================= */

export function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/* ================= MEMBERS ================= */

export function getMembers() {
  return apiRequest("/members");
}

/* ================= TITHES ================= */

export function saveBulkTithe(data) {
  return apiRequest("/tithes/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAllTithes() {
  return apiRequest("/tithes");
}

/* ================= FINANCE ================= */

export function getIncome() {
  return apiRequest("/income");
}

export function getExpenses() {
  return apiRequest("/expenditure");
}

export function addIncome(data) {
  return apiRequest("/income", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function addExpenditure(data) {
  return apiRequest("/expenditure", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function syncWeeklyTithe(data) {
  return apiRequest("/income/sync-tithe-weekly", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ================= USERS ================= */

export function getLoggedInUser() {
  const user = localStorage.getItem("user");
  if (!user) return null;
  return JSON.parse(user);
}

export function getApprovers() {
  return apiRequest("/user-roles/approvers");
}

/* ================= REPORTS ================= */

/**
 * Financial Report
 * Uses start/end dates and calculates:
 * Opening Balance
 * Income
 * Expenses
 * Closing Balance


/* ================= REPORTS ================= */

export function getMonthlyFinance(start, end) {
  return apiRequest(`/reports/finance/monthly?start=${start}&end=${end}`);
}

export function getTitheSummary(start, end) {
  return apiRequest(`/reports/tithes/summary?start=${start}&end=${end}`);
}

export function getAttendanceSummary(start, end) {
  return apiRequest(`/reports/attendance/summary?start=${start}&end=${end}`);
}

export function getAllReports() {
  return apiRequest(`/reports`);
}

export function saveReport(data) {
  return apiRequest(`/reports/save`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}


/* ================= VISITORS ================= */

export function getAllVisitors() {
  return apiRequest("/visitors");
}

export function getVisitorsByDate(date) {
  return apiRequest(`/visitors/date/${date}`);
}

export function getVisitorsReport(start, end) {
  return apiRequest(`/visitors/report?start=${start}&end=${end}`);
}

export function addVisitor(data) {
  return apiRequest("/visitors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAttendanceChart(start, end) {
  return apiRequest(`/reports/attendance/weekly?start=${start}&end=${end}`);
}

export function getFinanceChart(start, end) {
  return apiRequest(`/reports/finance/weekly?start=${start}&end=${end}`);
}

/* ================= EVENTS ================= */

export function getEvents(start, end) {
  let url = "/events";

  if (start && end) {
    url += `?start=${start}&end=${end}`;
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

export function getActivities() {
  return apiRequest("/activity");
}

/* ================= ATTENDANCE ================= */

export function markAttendanceBulk(data) {
  return apiRequest("/attendance/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update attendance
export function updateAttendance(attendanceCode, data) {
  return apiRequest(`/attendance/${attendanceCode}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getTodaySummary() {
  return apiRequest("/dashboard/today-summary");
}

/* ================= WELFARE ================= */

// Create welfare event
export function createWelfareEvent(data) {
  return apiRequest("/welfare/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Get all welfare events
export function getWelfareEvents() {
  return apiRequest("/welfare/events");
}

// Assign all members to event
export function assignMembersToWelfareEvent(eventId) {
  return apiRequest(`/welfare/events/${eventId}/assign`, {
    method: "POST",
  });
}

// Get members + status (VERY IMPORTANT for UI)
export function getWelfareEventMembers(eventId) {
  return apiRequest(`/welfare/events/${eventId}/members`);
}

// Record welfare payment (partial/full)
export function recordWelfarePayment(data) {
  return apiRequest("/welfare/pay", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ================= WELFARE ================= */

// Get full members for an event (with event_member_id)
export function getWelfareEventMembersFull(eventId) {
  return apiRequest(`/welfare/events/${eventId}/members/full`);
}

// Just ensure this API exists:

export function saveBulkWelfare(data) {
  return apiRequest("/welfare/bulk", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWelfarePaymentHistory(event_member_id) {
  return apiRequest(`/welfare/history/${event_member_id}`);
}

/* ================= DEPARTMENTS ================= */

// Get all departments (with member_count)
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

// Delete (soft delete)
export function deleteDepartment(id) {
  return apiRequest(`/departments/${id}`, {
    method: "DELETE",
  });
}

/* ================= MEMBER-DEPARTMENTS ================= */

// Assign member
export function assignMemberToDepartment(data) {
  return apiRequest("/member-departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Get members in department
export function getDepartmentMembers(deptId) {
  return apiRequest(`/member-departments/department/${deptId}`);
}

// Remove member from department
export function removeMemberFromDepartment(id) {
  return apiRequest(`/member-departments/${id}`, {
    method: "DELETE",
  });
}

/* ================= WELFARE EXPENSE ================= */

// Expense Types
export function getWelfareExpenseTypes() {
  return apiRequest("/welfare/expenses/types");
}

export function createWelfareExpenseType(data) {
  return apiRequest("/welfare/expenses/types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Expenses
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

// Summary (VERY IMPORTANT 🔥)
export function getWelfareSummary() {
  return apiRequest("/welfare/expenses/summary/all");
}

export function getWelfareReport(start, end) {
  return apiRequest(`/reports/welfare?start=${start}&end=${end}`);
}

export function getRoles() {
  return apiRequest("/role");
}

export function addDayBornSplit(data) {
  return apiRequest("/welfare/dayborn-split", {
    method: "POST",
    body: JSON.stringify(data),
  });
}