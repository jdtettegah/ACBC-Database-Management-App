const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

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

  // Auto logout if expired
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

export function getTodaySummary() {
  return apiRequest("/dashboard/today-summary");
}