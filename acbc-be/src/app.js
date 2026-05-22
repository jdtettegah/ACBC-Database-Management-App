import express from "express";



import authRoutes from './routes/auth.routes.js'
import cors from 'cors';
import authMiddleware from './middlewares/auth.middleware.js';
import memberRoutes from './routes/members.routes.js';
import titheRoutes from './routes/tithe.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import visitorsAttendanceRoutes from './routes/visitorsAttendance.routes.js';
import incomeRoutes from './routes/income.routes.js';
import expenditureRoutes from './routes/expenditure.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import memberDepartmentRoutes from './routes/memberDepartment.routes.js';
import roleRoutes from './routes/role.routes.js';
import userRoleRoutes from './routes/userRole.routes.js';
import eventRoutes from "./routes/events.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import welfareRoutes from './routes/welfare.routes.js';
import welfareExpenseRoutes from './routes/welfareExpense.routes.js';

const app = express();

app.use(cors({
    origin: "*"
}));
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

export default app;
