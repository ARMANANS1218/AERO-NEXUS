import React, { useState, useEffect } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Briefcase,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AgentActivity = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  const [filterDate, setFilterDate] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [agentHistory, setAgentHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  const agents = employeesData?.data?.filter((emp) => emp.role === 'Agent') || [];

  // Fetch 30-day history for an agent
  const fetch30DayHistory = async (agentId) => {
    if (agentHistory[agentId]) {
      // Already loaded, just toggle expand
      setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [agentId]: true }));

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${agentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.status && result.data) {
        setAgentHistory((prev) => ({ ...prev, [agentId]: result.data }));
        setExpandedAgentId(agentId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handleRowClick = (agentId) => {
    if (expandedAgentId === agentId) {
      setExpandedAgentId(null);
    } else {
      fetch30DayHistory(agentId);
    }
  };

  // Calculate real activity data from agent data
  const agentsWithActivity = agents.map((agent) => {
    const loginTime = agent.login_time ? new Date(agent.login_time) : null;
    const logoutTimeRaw = agent.logout_time ? new Date(agent.logout_time) : null;
    const now = new Date();

    // Calculate total break duration in minutes (ONLY from breakLogs, NOT including checkout)
    let totalBreakDuration = 0;
    let totalBreaks = 0;
    if (agent.breakLogs && agent.breakLogs.length > 0) {
      totalBreaks = agent.breakLogs.length;
      totalBreakDuration = agent.breakLogs.reduce((total, log) => {
        if (log.duration) {
          return total + log.duration;
        }
        return total;
      }, 0);
    }

    // Determine logout time and calculate active time
    let logoutTime = null;
    let activeTime = 0;

    if (!loginTime) {
      // No login time available - agent never logged in today
      logoutTime = null;
      activeTime = 0;
    } else if (agent.is_active) {
      // Agent is currently ONLINE (active or on break)
      // Calculate time from login to now
      logoutTime = null; // Show "-" since they haven't logged out yet
      const totalTimeInMs = now - loginTime;
      const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);

      // Subtract break time to get active time
      activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
    } else {
      // Agent is OFFLINE (logged out or checked out)
      // Use logout_time as the end time
      if (logoutTimeRaw && logoutTimeRaw > loginTime) {
        logoutTime = logoutTimeRaw;
        const totalTimeInMs = logoutTime - loginTime;
        const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);

        // Subtract break time to get active time (breaks are NOT counted in online time)
        activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
      } else {
        // No valid logout_time - treat current time as logout
        logoutTime = now;
        const totalTimeInMs = now - loginTime;
        const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);
        activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
      }
    }

    return {
      ...agent,
      activity: {
        loginTime,
        logoutTime,
        totalBreaks,
        breakDuration: totalBreakDuration,
        activeTime,
      },
    };
  });

  const formatTime = (date) => {
    if (!date) return '-';
    try {
      return format(date, 'hh:mm a');
    } catch (error) {
      return '-';
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins.toString().padStart(2, '0')}m` : `${mins}m`;
  };

  // Download individual agent Excel
  const handleDownloadAgentExcel = (agent, period) => {
    const toastId = toast.loading(`Generating ${agent.name}'s ${period} report...`);

    try {
      const now = new Date();
      let periodLabel;

      if (period === 'daily') {
        periodLabel = format(now, 'MMMM dd, yyyy');
      } else if (period === 'weekly') {
        const startDate = startOfWeek(now);
        const endDate = endOfWeek(now);
        periodLabel = `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        periodLabel = format(now, 'MMMM yyyy');
      }

      // Prepare data for Excel
      const data = [
        ['Agent Activity Report'],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Period', periodLabel],
        [''],
        ['Agent Details'],
        ['Name', agent.name],
        ['Employee ID', agent.employee_id],
        ['Email', agent.email],
        ['Role', agent.role],
        [
          'Current Status',
          agent.is_active ? (agent.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline',
        ],
        [''],
        ['Activity Details'],
        ['Login Time', formatTime(agent.activity.loginTime)],
        ['Logout Time', formatTime(agent.activity.logoutTime)],
        ['Online Time', formatDuration(agent.activity.activeTime)],
        ['Total Breaks', agent.activity.totalBreaks],
        ['Break Duration', formatDuration(agent.activity.breakDuration)],
        [''],
        ['Productivity Averages'],
        ['Daily Average', formatDuration(agent.activity.activeTime)],
        ['Weekly Average (Projected)', formatDuration(Math.round(agent.activity.activeTime * 7))],
        ['Monthly Average (Projected)', formatDuration(Math.round(agent.activity.activeTime * 30))],
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);

      // Style the first column (keys)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (!ws[cellRef]) continue;
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.font = { bold: true };
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Agent Report');

      // Save file
      XLSX.writeFile(wb, `${agent.name.replace(/\s+/g, '_')}_${period}_report.xlsx`);

      toast.dismiss(toastId);
      toast.success(`${agent.name}'s ${period} report generated!`);
    } catch (error) {
      console.error('Excel generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate Excel report');
    }
  };

  const handleDownloadExcel = (period) => {
    const toastId = toast.loading(`Generating ${period} activity report...`);

    try {
      const now = new Date();
      let startDate, endDate, periodLabel;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        periodLabel = format(now, 'MMMM dd, yyyy');
      } else if (period === 'weekly') {
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        periodLabel = `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        periodLabel = format(now, 'MMMM yyyy');
      }

      // Calculate totals
      const totalAgents = agentsWithActivity.length;
      const activeAgents = agentsWithActivity.filter((a) => a.is_active).length;
      const onBreak = agentsWithActivity.filter((a) => a.workStatus === 'break').length;
      const offline = agentsWithActivity.filter((a) => !a.is_active).length;
      const avgActiveTime = Math.round(
        agentsWithActivity.reduce((acc, a) => acc + a.activity.activeTime, 0) / totalAgents
      );

      // Prepare summary data
      const summaryData = [
        [''],
        ['Agent Activity Report'],
        ['Period', periodLabel],
        ['Generated On', format(now, 'dd MMM yyyy, hh:mm a')],
        ['Type', `${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report`],
        [''],
        ['Summary'],
        ['Currently Online', activeAgents],
        ['On Break', onBreak],
        ['Offline', offline],
        ['Avg Online Time', formatDuration(avgActiveTime)],
      ];

      // Prepare agent data headers
      const headers = [
        'S.No',
        'Agent Name',
        'Email',
        'Status',
        'Login Time',
        'Logout Time',
        'Online Time',
        'Breaks',
        'Break Duration',
        'Daily Avg',
        'Weekly Avg',
        'Monthly Avg',
      ];

      // Prepare agent rows
      const agentRows = agentsWithActivity.map((agent, index) => [
        index + 1,
        agent.name,
        agent.email,
        agent.is_active ? (agent.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline',
        formatTime(agent.activity.loginTime),
        formatTime(agent.activity.logoutTime),
        formatDuration(agent.activity.activeTime),
        agent.activity.totalBreaks,
        formatDuration(agent.activity.breakDuration),
        formatDuration(agent.activity.activeTime),
        formatDuration(Math.round(agent.activity.activeTime * 7)),
        formatDuration(Math.round(agent.activity.activeTime * 30)),
      ]);

      // Combine all data
      const wsData = [headers, ...agentRows, ...summaryData];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Apply styling
      const range = XLSX.utils.decode_range(ws['!ref']);

      // Style Headers (Row 0)
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) continue;
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.font = { bold: true };
      }

      // Style Summary Keys (First column of summary section)
      const summaryStartRow = headers.length + agentRows.length; // Start after table
      for (let R = summaryStartRow; R <= range.e.r; ++R) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
        if (!ws[cellRef]) continue;
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.font = { bold: true };
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Activity Report');

      // Save file
      XLSX.writeFile(wb, `Agent_Activity_${period}_${format(now, 'yyyy-MM-dd')}.xlsx`);

      toast.dismiss(toastId);
      toast.success(
        `${period.charAt(0).toUpperCase() + period.slice(1)} activity report generated!`
      );
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.dismiss(toastId);
      toast.error(`Failed to generate ${period} report`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Agent Activity</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track agent work hours, breaks, and activity status
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => handleDownloadExcel('daily')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Daily
          </button>
          <button
            onClick={() => handleDownloadExcel('weekly')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Weekly
          </button>
          <button
            onClick={() => handleDownloadExcel('monthly')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileSpreadsheet size={16} />
            Monthly
          </button>
        </div>
      </div>

      <div className="mb-6">
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
            bg-white dark:bg-slate-700 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently Online</p>
              <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {agents.filter((a) => a.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <Briefcase className="text-green-600 dark:text-green-400" size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On Break</p>
              <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {agents.filter((a) => a.workStatus === 'break').length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Coffee className="text-amber-600 dark:text-amber-400" size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
              <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {agents.filter((a) => !a.is_active).length}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-950">
              <LogOut className="text-gray-600 dark:text-gray-400" size={32} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Online Time</p>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatDuration(
                  Math.round(
                    agentsWithActivity.reduce((acc, a) => acc + a.activity.activeTime, 0) /
                      agents.length
                  ) || 0
                )}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Clock className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Details</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Login Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Logout Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Online Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Breaks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Break Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {agentsWithActivity.map((agent) => (
                <React.Fragment key={agent._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={agent.profileImage}
                          alt={agent.name}
                          className="w-10 h-10 bg-blue-500"
                        >
                          {agent.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {agent.employee_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          agent.is_active
                            ? agent.workStatus === 'break'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                        }`}
                      >
                        {agent.is_active
                          ? agent.workStatus === 'break'
                            ? 'On Break'
                            : 'Online'
                          : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <LogIn size={16} className="text-green-600 dark:text-green-400" />
                        {formatTime(agent.activity.loginTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <LogOut size={16} className="text-red-600 dark:text-red-400" />
                        {formatTime(agent.activity.logoutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatDuration(agent.activity.activeTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                      {agent.activity.totalBreaks}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                      {formatDuration(agent.activity.breakDuration)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'weekly');
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentExcel(agent, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileSpreadsheet size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(agent._id);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View 30-Day History"
                        >
                          {expandedAgentId === agent._id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Section */}
                  {expandedAgentId === agent._id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-6 bg-gray-50 dark:bg-slate-900/50">
                        {loadingHistory[agent._id] ? (
                          <div className="flex justify-center py-8">
                            <CircularProgress size={40} />
                          </div>
                        ) : agentHistory[agent._id] ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Last 30 Days Activity - {agent.name}
                            </h3>

                            {/* Chart */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                              <Line
                                data={{
                                  labels: agentHistory[agent._id]
                                    .map((day) => format(new Date(day.date), 'MMM dd'))
                                    .reverse(),
                                  datasets: [
                                    {
                                      label: 'Online Time (minutes)',
                                      data: agentHistory[agent._id]
                                        .map((day) => day.totalOnlineTime)
                                        .reverse(),
                                      borderColor: 'rgb(59, 130, 246)',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      tension: 0.4,
                                      fill: true,
                                      pointRadius: 4,
                                      pointHoverRadius: 6,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false,
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function (context) {
                                          const minutes = context.parsed.y;
                                          const hours = Math.floor(minutes / 60);
                                          const mins = Math.round(minutes % 60);
                                          return `Online Time: ${hours}h ${mins}m`;
                                        },
                                      },
                                    },
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function (value) {
                                          const hours = Math.floor(value / 60);
                                          return `${hours}h`;
                                        },
                                      },
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)',
                                      },
                                    },
                                    x: {
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)',
                                      },
                                    },
                                  },
                                }}
                                height={300}
                              />
                            </div>

                            {/* Daily Details Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                              <div className="overflow-x-auto max-h-96">
                                <table className="w-full">
                                  <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Date
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Login
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Logout
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Online Time
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Breaks
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Break Time
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {agentHistory[agent._id].map((day, idx) => (
                                      <tr
                                        key={idx}
                                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                      >
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                          {format(new Date(day.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {day.loginTime
                                            ? format(new Date(day.loginTime), 'hh:mm a')
                                            : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {day.logoutTime
                                            ? format(new Date(day.logoutTime), 'hh:mm a')
                                            : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                          {formatDuration(day.totalOnlineTime)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                                          {day.breakCount}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                                          {formatDuration(day.totalBreakTime)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No historical data available
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentActivity;
