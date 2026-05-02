const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cors = require('cors');
const authMiddleware = require('./middlewares/auth.middleware');
const memberRoutes = require('./routes/members.routes');
const titheRoutes = require('./routes/tithe.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const visitorsAttendanceRoutes = require('./routes/visitorsAttendance.routes');
const incomeRoutes = require('./routes/income.routes');
const expenditureRoutes = require('./routes/expenditure.routes');
const reportsRoutes = require('./routes/reports.routes');
const departmentRoutes = require('./routes/departments.routes');
const memberDepartmentRoutes = require('./routes/memberDepartment.routes');
const roleRoutes = require('./routes/role.routes');
const userRoleRoutes = require('./routes/userRole.routes');
const eventRoutes = require("./routes/events.routes");
const activityRoutes = require("./routes/activity.routes");
const dashboardRoutes = require("./routes/dashboard.routes")
const welfareRoutes = require('./routes/welfare.routes');
const welfareExpenseRoutes = require('./routes/welfareExpense.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/members', authMiddleware, memberRoutes);
app.use('/api/tithes', authMiddleware, titheRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/visitors', authMiddleware, visitorsAttendanceRoutes);
app.use('/api/income', authMiddleware, incomeRoutes);
app.use('/api/expenditure', authMiddleware, expenditureRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);
app.use('/api/departments', authMiddleware, departmentRoutes);
app.use('/api/member-departments', authMiddleware, memberDepartmentRoutes);
app.use('/api/role', authMiddleware, roleRoutes);
app.use('/api/user-roles', authMiddleware, userRoleRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/activity", authMiddleware, activityRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);
app.use('/api/welfare', authMiddleware, welfareRoutes);
app.use('/api/welfare/expenses', authMiddleware, welfareExpenseRoutes);
app.get('/', (req, res) => {
    res.send('ACBC API is running');
});

app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({
        message: 'Access granted',
        user: req.user
    });
});

module.exports = app;
