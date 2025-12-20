import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBarChart,
    RadialBar,
    ComposedChart,
    Line
} from 'recharts';
import { motion } from 'framer-motion';
import {
    Users,
    Clock,
    UserCheck,
    UserX,
    Calendar,
    ChevronDown,
    Filter,
    Download,
    TrendingUp,
    Activity,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../../config/api';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [kpiData, setKpiData] = useState({
        totalEmployees: { value: 0, trend: 0 },
        presentToday: { value: 0, trend: 0 },
        lateArrivals: { value: 0, trend: 0 },
        onLeave: { value: 0, trend: 0 }
    });

    const [graphData, setGraphData] = useState({
        trends: [],
        shifts: [],
        punctuality: [],
        roles: [],
        leaves: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Employees
            const empRes = await axios.get(`${API_URL}/api/v1/user/employees`, { headers });
            const employees = (empRes.data.data || []).filter(e => e.role !== 'Admin'); // Exclude admin from counts usually
            const totalEmployees = employees.length;

            // 2. Fetch Leaves
            const leaveRes = await axios.get(`${API_URL}/api/v1/leave/all`, { headers });
            const allLeaves = leaveRes.data.leaves || [];

            // Filter leaves for today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isLeaveActiveToday = (l) => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return l.status === 'Approved' && start <= today && end >= today;
            };

            const activeLeavesToday = allLeaves.filter(isLeaveActiveToday).length;

            // 3. Fetch Shifts
            const shiftRes = await axios.get(`${API_URL}/api/v1/shift`, { headers });
            const shifts = shiftRes.data.shifts || [];

            // 4. Fetch Attendance for Last 7 Days (for Trends & Today's Stats)
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push(d.toISOString().split('T')[0]);
            }

            const attendancePromises = days.map(d =>
                axios.get(`${API_URL}/api/v1/attendance/all`, { params: { date: d }, headers })
                    .then(r => ({ date: d, data: r.data.attendance || [] }))
                    .catch(() => ({ date: d, data: [] }))
            );

            const attendanceHistory = await Promise.all(attendancePromises);

            // Process Data
            const todayDataObj = attendanceHistory[attendanceHistory.length - 1]; // Today is last
            const yesterdayDataObj = attendanceHistory[attendanceHistory.length - 2]; // Yesterday

            const todayAttendance = todayDataObj?.data || [];
            const yesterdayAttendance = yesterdayDataObj?.data || [];

            // KPI Calculations
            const countPresent = (arr) => arr.filter(a => ['Present', 'On Time', 'Late', 'Half Day'].includes(a.status)).length;
            const countLate = (arr) => arr.filter(a => a.status === 'Late').length;

            const presentTodayVal = countPresent(todayAttendance);
            const presentYesterdayVal = countPresent(yesterdayAttendance);

            const lateTodayVal = countLate(todayAttendance);
            const lateYesterdayVal = countLate(yesterdayAttendance);

            // Calculate percentage trends
            const calcTrend = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0;
                return Math.round(((curr - prev) / prev) * 100);
            };

            setKpiData({
                totalEmployees: { value: totalEmployees, trend: 0 }, // Static for now
                presentToday: { value: presentTodayVal, trend: calcTrend(presentTodayVal, presentYesterdayVal) },
                lateArrivals: { value: lateTodayVal, trend: calcTrend(lateTodayVal, lateYesterdayVal) },
                onLeave: { value: activeLeavesToday, trend: 0 } // Need historical leave data for trend, skipping for now
            });

            // Graph 1: Trends
            const trends = attendanceHistory.map(dayData => {
                const dayName = new Date(dayData.date).toLocaleDateString('en-US', { weekday: 'short' });
                const present = countPresent(dayData.data);
                const late = countLate(dayData.data);
                const absent = Math.max(0, totalEmployees - present - activeLeavesToday); // Rough approx
                return { day: dayName, present, absent, late };
            });

            // Graph 2: Shifts Performance (Today)
            const shiftStats = shifts.map(s => {
                const actual = todayAttendance.filter(a => a.shiftId?._id === s._id || a.shiftId === s._id).length;
                // Estimate scheduled: evenly distribute or just show actual. 
                // Visualizing 'actual' vs 'capacity' where capacity ~ total/shifts (naive)
                const capacity = Math.round(totalEmployees / (shifts.length || 1));
                return {
                    name: s.shiftName,
                    actual: actual,
                    scheduled: capacity, // Placeholder for "Expected"
                    efficiency: capacity > 0 ? Math.round((actual / capacity) * 100) : 0
                };
            });

            // Graph 3: Punctuality (Today)
            const onTimeCount = todayAttendance.filter(a => a.status === 'On Time').length;
            const lateCountVal = todayAttendance.filter(a => a.status === 'Late').length;
            const punctualityData = [
                { name: 'On Time', uv: onTimeCount, fill: '#10b981' },
                { name: 'Late', uv: lateCountVal, fill: '#f59e0b' },
                { name: 'Others', uv: Math.max(0, todayAttendance.length - onTimeCount - lateCountVal), fill: '#ef4444' } // Absent/Unmarked?
            ].filter(i => i.uv > 0);

            if (punctualityData.length === 0) {
                punctualityData.push({ name: 'No Data', uv: 1, fill: '#e2e8f0' });
            }

            // Graph 4: Role Health (Today)
            const roleCounts = {};
            todayAttendance.forEach(a => {
                const role = a.userId?.role || 'Unknown';
                roleCounts[role] = (roleCounts[role] || 0) + 1;
            });
            // Ensure we have at least the standard roles
            ['Agent', 'TL', 'QA'].forEach(r => {
                if (!roleCounts[r]) roleCounts[r] = 0;
            });
            const roleHealth = Object.keys(roleCounts).map(r => ({
                subject: r,
                A: roleCounts[r],
                fullMark: totalEmployees // relative scale
            }));

            // Graph 5: Leave Types (This Month)
            const currentMonth = new Date().getMonth();
            const thisMonthLeaves = allLeaves.filter(l => new Date(l.startDate).getMonth() === currentMonth);
            const leaveTypeCounts = {};
            thisMonthLeaves.forEach(l => {
                leaveTypeCounts[l.leaveType] = (leaveTypeCounts[l.leaveType] || 0) + 1;
            });

            const leaveColors = ['#f87171', '#fbbf24', '#60a5fa', '#94a3b8', '#8b5cf6'];
            const leaveDist = Object.keys(leaveTypeCounts).map((type, idx) => ({
                name: type,
                value: leaveTypeCounts[type],
                color: leaveColors[idx % leaveColors.length]
            }));

            if (leaveDist.length === 0) {
                leaveDist.push({ name: 'None', value: 1, color: '#e2e8f0' });
            }

            setGraphData({
                trends,
                shifts: shiftStats,
                punctuality: punctualityData,
                roles: roleHealth,
                leaves: leaveDist
            });

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------------------------------
    // ANIMATIONS
    // ------------------------------------------------------------------
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100, damping: 12 }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950 p-6 font-sans text-slate-800 dark:text-slate-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* 🔹 PREMIUM HEADER */}
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                        Executive Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Activity size={14} /> System Online
                        </span>
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={fetchDashboardData}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                    >
                        <Filter size={16} />
                        <span className="text-sm font-semibold">Refresh</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm font-semibold">
                        <Download size={16} />
                        <span>Export Data</span>
                    </button>
                </div>
            </header>

            {/* 🔹 KPIs / STAT BLOCKS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard
                    title="Total Employees"
                    value={kpiData.totalEmployees.value}
                    trend={`${kpiData.totalEmployees.trend > 0 ? '+' : ''}${kpiData.totalEmployees.trend}%`}
                    trendUp={kpiData.totalEmployees.trend >= 0}
                    icon={<Users size={24} />}
                    color="blue"
                    subtext="Active in roster"
                />
                <KpiCard
                    title="Present Today"
                    value={kpiData.presentToday.value}
                    trend={`${kpiData.presentToday.trend > 0 ? '+' : ''}${kpiData.presentToday.trend}%`}
                    trendUp={kpiData.presentToday.trend >= 0}
                    icon={<UserCheck size={24} />}
                    color="emerald"
                    subtext="vs Yesterday"
                />
                <KpiCard
                    title="Late Arrivals"
                    value={kpiData.lateArrivals.value}
                    trend={`${kpiData.lateArrivals.trend > 0 ? '+' : ''}${kpiData.lateArrivals.trend}%`}
                    trendUp={kpiData.lateArrivals.trend < 0} // Less late is better
                    isWarning={kpiData.lateArrivals.value > 0}
                    icon={<Clock size={24} />}
                    color="amber"
                    subtext="vs Yesterday"
                />
                <KpiCard
                    title="On Leave"
                    value={kpiData.onLeave.value}
                    trend="0%"
                    trendUp={true}
                    icon={<UserX size={24} />}
                    color="purple"
                    subtext="Approved for today"
                />
            </div>

            {/* 🔹 MAIN CHART GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

                {/* 1. Main Trend Chart (Wide - Spans 8 cols) */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Attendance Volume</h3>
                            <p className="text-xs text-slate-500">Last 7 Days</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Present
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span> Absent
                            </div>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={graphData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', background: 'rgba(255, 255, 255, 0.9)', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="present"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPresent)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="absent"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAbsent)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 2. Visual Punctuality (Radial Bar - spans 4 cols) */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800"
                >
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Punctuality Score</h3>
                    <div className="h-64 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="30%"
                                outerRadius="100%"
                                barSize={20}
                                data={graphData.punctuality}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    background={{ fill: '#f1f5f9' }} // slate-100
                                    clockWise
                                    dataKey="uv"
                                    cornerRadius={10}
                                />
                                <Legend
                                    iconSize={10}
                                    layout="vertical"
                                    verticalAlign="middle"
                                    wrapperStyle={{
                                        top: '50%', right: 0, transform: 'translate(0, -50%)', lineHeight: '24px'
                                    }}
                                />
                                <Tooltip />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center Text Overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8 text-center">
                            <h4 className="text-3xl font-bold text-slate-800 dark:text-white">
                                {kpiData.totalEmployees.value > 0
                                    ? Math.round((kpiData.presentToday.value / kpiData.totalEmployees.value) * 100)
                                    : 0}%
                            </h4>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Attendance</p>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                            Based on today's check-in data.
                        </p>
                    </div>
                </motion.div>

                {/* 3. Shift Efficiency (Composed Chart - Spans 6 cols) */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-6 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800"
                >
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Shift Distribution (Today)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={graphData.shifts} layout="vertical">
                                <CartesianGrid stroke="#f1f5f9" horizontal={false} opacity={0.5} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    scale="band"
                                    axisLine={false}
                                    tickLine={false}
                                    width={80}
                                    tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="scheduled" name="Capacity (Est)" barSize={12} fill="#e2e8f0" radius={[0, 10, 10, 0]} />
                                <Bar dataKey="actual" name="Present" barSize={12} fill="#6366f1" radius={[0, 10, 10, 0]} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 4. Department Radar (Spans 3 cols) */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800"
                >
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Role Breakdown</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={graphData.roles}>
                                <PolarGrid strokeOpacity={0.2} />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                                <Radar
                                    name="Present Today"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    fill="#8b5cf6"
                                    fillOpacity={0.5}
                                    isAnimationActive={false}
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 5. Leave Distribution (Spans 3 cols) */}
                <motion.div
                    variants={cardVariants}
                    className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800"
                >
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Leave Types</h3>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={graphData.leaves}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {graphData.leaves.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconType="circle" iconSize={8} verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-3/4 text-center pointer-events-none">
                            <div className="text-2xl font-bold text-slate-700 dark:text-white">{graphData.leaves.reduce((a, b) => a + b.value, 0)}</div>
                            <div className="text-[10px] text-slate-400 uppercase">Requests</div>
                            <div className="text-[10px] text-slate-400 uppercase">(Month)</div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* 🔹 BOTTOM SECTION: Quick Actions / Alerts */}
            <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Alerts */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900 dark:text-amber-100">Attendance Insight</h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                            {kpiData.lateArrivals.value > 0
                                ? `${kpiData.lateArrivals.value} employees are late today. Check shift timings.`
                                : "Good attendance today! No major delays reported."}
                        </p>
                    </div>
                </div>

                {/* System Status or Promo */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-lg">Generate Monthly Report?</h4>
                        <p className="text-blue-100 text-sm mt-1">
                            The comprehensive audit log for {new Date().toLocaleDateString('en-US', { month: 'long' })} is available.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold shadow-md hover:bg-blue-50 transition">
                        Download Now
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ------------------------------------------------------------------
// HELPER COMPONENTS
// ------------------------------------------------------------------

const KpiCard = ({ title, value, trend, trendUp, icon, color, subtext, isWarning }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <motion.div
            variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
            }}
            className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-md transition-shadow relative overflow-hidden"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${isWarning
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : trendUp
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                    {trendUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1 rotate-180" />}
                    {trend}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                    {subtext}
                </span>
            </div>
        </motion.div>
    );
};

export default Dashboard;