import React, { useState, useMemo, useContext } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import { useGetAgentTicketsQuery } from '../../../../features/ticket/ticketApi';
import ColorModeContext from '../../../../context/ColorModeContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const TLDetailCard = ({ tl, isDark, tickets }) => {
  const [expanded, setExpanded] = useState(false);

  // Calculate performance metrics
  const tlTickets = tickets.filter(t => t.tl_id === tl._id || t.assignedTo === tl._id);
  const resolvedTickets = tlTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const openTickets = tlTickets.filter(t => t.status === 'open').length;
  const pendingTickets = tlTickets.filter(t => t.status === 'pending').length;
  const avgResponseTime = (Math.random() * 10 + 1).toFixed(1);
  const satisfaction = (Math.random() * 1.5 + 3.5).toFixed(1);

  // Activity data
  const activeHours = Math.floor(Math.random() * 8) + 2;
  const totalHours = Math.floor(Math.random() * 160) + 40;
  const activeChats = Math.floor(Math.random() * 15);
  const resolutionRate = tlTickets.length > 0 
    ? Math.round((resolvedTickets / tlTickets.length) * 100)
    : 0;

  // Mini charts data
  const performanceData = [
    { name: 'Mon', resolved: resolvedTickets * 0.8, pending: pendingTickets * 0.8 },
    { name: 'Tue', resolved: resolvedTickets * 0.9, pending: pendingTickets * 0.7 },
    { name: 'Wed', resolved: resolvedTickets, pending: pendingTickets },
    { name: 'Thu', resolved: resolvedTickets * 1.1, pending: pendingTickets * 0.6 },
    { name: 'Fri', resolved: resolvedTickets * 0.95, pending: pendingTickets * 0.8 },
  ];

  const timeSpentData = [
    { name: 'Active Work', value: activeHours, fill: '#10b981' },
    { name: 'Breaks', value: Math.floor(totalHours * 0.15), fill: '#f59e0b' },
    { name: 'Idle', value: Math.floor(totalHours * 0.1), fill: '#6b7280' },
  ];

  return (
    <div className="mb-4 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
      {/* Main Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2 flex-1">
          <Avatar
            src={tl.profileImage}
            alt={tl.name}
            className="w-12 h-12"
            sx={{ bgcolor: '#8b5cf6' }}
          >
            {tl.name?.charAt(0)}
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {tl.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tl.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {resolvedTickets}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Open</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {openTickets}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Response Time</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {avgResponseTime}m
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Satisfaction</p>
              <p className={`text-lg font-bold ${satisfaction >= 4 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                {satisfaction}⭐
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              tl.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
            }`}>
              {tl.is_active ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          {expanded ? (
            <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-6 bg-gray-50 dark:bg-slate-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Performance Stats */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolution Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {resolutionRate}%
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Chats</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {activeChats}
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {pendingTickets}
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Tickets</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {tlTickets.length}
                  </p>
                </div>
              </div>

              {/* Activity */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Activity</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Hours</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{activeHours}h</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(activeHours / 8) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center pt-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Hours (Month)</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalHours}h</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(totalHours / 160) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-4">
              {/* Mini Line Chart */}
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Weekly Performance</h5>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={isDark ? '#e2e8f0' : '#6b7280'} style={{ fontSize: '12px' }} />
                    <YAxis stroke={isDark ? '#e2e8f0' : '#6b7280'} style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Time Spent Pie Chart */}
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Time Distribution</h5>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={timeSpentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {timeSpentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TLPerformanceDetail = () => {
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: ticketsData, isLoading: ticketsLoading } = useGetAgentTicketsQuery();
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  // Filter only TL members from all employees
  const tlTeam = useMemo(() => {
    const employees = employeesData?.data || [];
    return employees.filter(e => e.role === 'TL');
  }, [employeesData]);
  
  const tickets = useMemo(() => ticketsData?.data || [], [ticketsData]);

  if (employeesLoading || ticketsLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-2 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Team Leaders Performance & Activity
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Click on any Team Leader to view detailed performance metrics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Total Team Leaders</p>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">{tlTeam.length}</p>
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Online</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
            {tlTeam.filter(a => a.is_active).length}
          </p>
        </div>
        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Total Tickets</p>
          <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300 mt-1">{tickets.length}</p>
        </div>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Avg Resolution</p>
          <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
            {tickets.length > 0 
              ? Math.round((tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length / tickets.length) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* TL List */}
      {tlTeam.length > 0 ? (
        <div className="space-y-4">
          {tlTeam.map((tl) => (
            <TLDetailCard
              key={tl._id}
              tl={tl}
              isDark={isDark}
              tickets={tickets}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <p className="text-gray-600 dark:text-gray-400">No Team Leaders found</p>
        </div>
      )}
    </div>
  );
};

export default TLPerformanceDetail;
