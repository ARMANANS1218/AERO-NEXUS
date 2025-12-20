import React, { useState, useMemo } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { ChevronDown, ChevronUp, FileDown, Calendar, RefreshCw } from 'lucide-react';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import { useGetAgentTicketsQuery } from '../../../../features/ticket/ticketApi';
import { toast } from 'react-toastify';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const AgentDetailCard = ({ agent, isDark, tickets, onDownloadPDF }) => {
  const [expanded, setExpanded] = useState(false);

  // Calculate performance metrics - REAL DATA ONLY
  const agentTickets = tickets.filter(t => t.agent_id === agent._id || t.assignedTo === agent._id);
  const resolvedTickets = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const openTickets = agentTickets.filter(t => t.status === 'open').length;
  const pendingTickets = agentTickets.filter(t => t.status === 'pending').length;
  const escalatedTickets = agentTickets.filter(t => t.status === 'escalated').length;
  
  // Get today's tickets
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTickets = agentTickets.filter(t => {
    const ticketDate = new Date(t.createdAt);
    ticketDate.setHours(0, 0, 0, 0);
    return ticketDate.getTime() === today.getTime();
  }).length;
  
  const resolutionRate = agentTickets.length > 0 
    ? Math.round((resolvedTickets / agentTickets.length) * 100)
    : 0;
  
  // Calculate average rating from QA (if available)
  const ticketsWithRating = agentTickets.filter(t => t.qaRating && t.qaRating > 0);
  const avgQARating = ticketsWithRating.length > 0
    ? (ticketsWithRating.reduce((sum, t) => sum + t.qaRating, 0) / ticketsWithRating.length).toFixed(1)
    : null;

  // Calculate escalation rate
  const escalationRate = agentTickets.length > 0
    ? Math.round((escalatedTickets / agentTickets.length) * 100)
    : 0;

  // Calculate average response time (if timestamps available)
  const ticketsWithResponseTime = agentTickets.filter(t => t.firstResponseTime && t.createdAt);
  const avgResponseTime = ticketsWithResponseTime.length > 0
    ? Math.round(ticketsWithResponseTime.reduce((sum, t) => {
        const responseMs = new Date(t.firstResponseTime) - new Date(t.createdAt);
        return sum + (responseMs / 60000); // Convert to minutes
      }, 0) / ticketsWithResponseTime.length)
    : 0;

  // Status distribution data for chart
  const statusDistribution = [
    { name: 'Resolved', value: resolvedTickets, fill: '#10b981' },
    { name: 'Open', value: openTickets, fill: '#3b82f6' },
    { name: 'Pending', value: pendingTickets, fill: '#f59e0b' },
    { name: 'Escalated', value: escalatedTickets, fill: '#ef4444' },
  ].filter(item => item.value > 0); // Only show categories with data

  // Prepare Radar Chart Data for Queries - Actual Values
  const maxQueryValue = Math.max(agentTickets.length, resolvedTickets, openTickets, escalatedTickets, 10);
  const queryRadarData = [
    {
      metric: `Total (${agentTickets.length})`,
      value: agentTickets.length,
      actualValue: agentTickets.length,
      fullMark: maxQueryValue,
    },
    {
      metric: `Resolved (${resolvedTickets})`,
      value: resolvedTickets,
      actualValue: resolvedTickets,
      fullMark: maxQueryValue,
    },
    {
      metric: `Open (${openTickets})`,
      value: openTickets,
      actualValue: openTickets,
      fullMark: maxQueryValue,
    },
    {
      metric: `Pending (${pendingTickets})`,
      value: pendingTickets,
      actualValue: pendingTickets,
      fullMark: maxQueryValue,
    },
    {
      metric: `Escalated (${escalatedTickets})`,
      value: escalatedTickets,
      actualValue: escalatedTickets,
      fullMark: maxQueryValue,
    },
  ];

  // Prepare Radar Chart Data for Tickets - Actual Values
  const ticketRadarData = [
    {
      metric: `Today (${todayTickets})`,
      value: todayTickets,
      actualValue: todayTickets,
      fullMark: Math.max(agentTickets.length, 10),
    },
    {
      metric: `Resolution (${resolutionRate}%)`,
      value: resolutionRate,
      actualValue: `${resolutionRate}%`,
      fullMark: 100,
    },
    {
      metric: `Escalation (${escalationRate}%)`,
      value: escalationRate,
      actualValue: `${escalationRate}%`,
      fullMark: 100,
    },
    {
      metric: avgQARating ? `QA Rating (${avgQARating})` : 'QA Rating (N/A)',
      value: avgQARating ? parseFloat(avgQARating) * 20 : 0,
      actualValue: avgQARating || 'N/A',
      fullMark: 100,
    },
    {
      metric: avgResponseTime > 0 ? `Response (${avgResponseTime}m)` : 'Response (N/A)',
      value: avgResponseTime > 0 ? Math.min(100, 100 - avgResponseTime) : 0,
      actualValue: avgResponseTime > 0 ? `${avgResponseTime}m` : 'N/A',
      fullMark: 100,
    },
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
            src={agent.profileImage}
            alt={agent.name}
            className="w-12 h-12"
            sx={{ bgcolor: '#3b82f6' }}
          >
            {agent.name?.charAt(0)}
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {agent.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {agentTickets.length}
              </p>
            </div>
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
              <p className="text-xs text-gray-600 dark:text-gray-400">Today</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {todayTickets}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Escalated</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {escalatedTickets}
              </p>
            </div>
            {avgQARating && (
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">QA Weightage</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {avgQARating}⭐
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              agent.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
            }`}>
              {agent.is_active ? 'Online' : 'Offline'}
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
          {/* PDF Download Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPDF(agent, 'daily');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
            >
              <FileDown size={16} />
              Daily PDF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPDF(agent, 'weekly');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
            >
              <Calendar size={16} />
              Weekly PDF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPDF(agent, 'monthly');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
            >
              <Calendar size={16} />
              Monthly PDF
            </button>
          </div>

          {/* Query Related Statistics */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-blue-200 dark:border-blue-700 p-4 mb-4">
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-3 uppercase tracking-wide">📊 Query Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{agentTickets.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{resolvedTickets}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Open</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{openTickets}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-amber-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingTickets}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-red-200 dark:border-red-700 shadow-md">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">Escalated</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{escalatedTickets}</p>
                <p className="text-xs text-red-500 dark:text-red-400">{escalationRate}%</p>
              </div>
              {avgQARating && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700 shadow-md">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">QA Rating</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{avgQARating}⭐</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{ticketsWithRating.length} rated</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Related Statistics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-green-200 dark:border-green-700 p-4 mb-6">
            <h4 className="text-sm font-bold text-green-900 dark:text-green-300 mb-3 uppercase tracking-wide">🎫 Ticket Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Today</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{todayTickets}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolution Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{resolutionRate}%</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-100 dark:border-slate-600">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Escalation Rate</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{escalationRate}%</p>
              </div>
              {avgResponseTime > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-green-100 dark:border-slate-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Response</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgResponseTime}m</p>
                </div>
              )}
            </div>
          </div>

          {/* Two Radar Charts Side by Side - Showing Actual Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Query Performance Radar Chart */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-blue-200 dark:border-blue-700 p-6">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 text-center uppercase tracking-wide">📊 Query Performance Radar</h4>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={queryRadarData}>
                  <PolarGrid stroke="#94a3b8" strokeWidth={1.5} />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 'dataMax']}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Queries"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border-2 border-blue-500 shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-white">{payload[0].payload.metric}</p>
                            <p className="text-blue-600 dark:text-blue-400 font-bold">Value: {payload[0].payload.actualValue}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Ticket Performance Radar Chart */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-green-200 dark:border-green-700 p-6">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4 text-center uppercase tracking-wide">🎫 Ticket Performance Radar</h4>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={ticketRadarData}>
                  <PolarGrid stroke="#94a3b8" strokeWidth={1.5} />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fill: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 'dataMax']}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  />
                  <Radar
                    name="Tickets"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    content={({ payload }) => {
                      if (payload && payload[0]) {
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border-2 border-green-500 shadow-lg">
                            <p className="font-semibold text-gray-900 dark:text-white">{payload[0].payload.metric}</p>
                            <p className="text-green-600 dark:text-green-400 font-bold">Value: {payload[0].payload.actualValue}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Status Distribution Pie Chart */}
          {statusDistribution.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-center">Ticket Status Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AgentPerformanceDetail = () => {
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = useGetAllEmployeesQuery();
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useGetAgentTicketsQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchEmployees(), refetchTickets()]);
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  const agents = useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter(emp => 
      emp.role && emp.role.toLowerCase() === 'agent'
    );
  }, [employeesData]);

  const tickets = useMemo(() => {
    if (!ticketsData?.data) return [];
    return ticketsData.data;
  }, [ticketsData]);

  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return b.is_active - a.is_active;
      return 0;
    });

    return filtered;
  }, [agents, searchTerm, sortBy]);

  const handleDownloadAllAgentsPDF = async (period) => {
    const toastId = toast.loading(`Generating ${period} report for all agents...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate, periodText;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        periodText = format(now, 'MMM dd, yyyy');
      } else if (period === 'weekly') {
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        periodText = `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        periodText = format(now, 'MMMM yyyy');
      }

      // Generate report for all agents
      let allAgentsHTML = '';
      
      agents.forEach((agent, index) => {
        const agentTickets = tickets.filter(t => {
          const ticketDate = new Date(t.createdAt);
          return (
            (t.agent_id === agent._id || t.assignedTo === agent._id) &&
            ticketDate >= startDate &&
            ticketDate <= endDate
          );
        });

        const resolvedTickets = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const openTickets = agentTickets.filter(t => t.status === 'open').length;
        const pendingTickets = agentTickets.filter(t => t.status === 'pending').length;
        const escalatedTickets = agentTickets.filter(t => t.status === 'escalated').length;
        const resolutionRate = agentTickets.length > 0 
          ? Math.round((resolvedTickets / agentTickets.length) * 100)
          : 0;

        const ticketsWithRating = agentTickets.filter(t => t.qaRating && t.qaRating > 0);
        const avgQARating = ticketsWithRating.length > 0
          ? (ticketsWithRating.reduce((sum, t) => sum + t.qaRating, 0) / ticketsWithRating.length).toFixed(1)
          : 'N/A';

        allAgentsHTML += `
          <div style="page-break-inside: avoid; margin-bottom: 30px; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #4F46E5; padding-bottom: 15px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; margin-right: 15px;">
                ${agent.name?.charAt(0) || 'A'}
              </div>
              <div style="flex: 1;">
                <h3 style="margin: 0; font-size: 22px; color: #111827;">${agent.name}</h3>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${agent.email}</p>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; ${agent.is_active ? 'background: #d1fae5; color: #065f46;' : 'background: #f3f4f6; color: #6b7280;'}">
                  ${agent.is_active ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 15px;">
              <div style="text-align: center; padding: 15px; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Total Queries</div>
                <div style="font-size: 28px; font-weight: bold;">${agentTickets.length}</div>
              </div>
              <div style="text-align: center; padding: 15px; border-radius: 10px; background: linear-gradient(135deg, #84fab0 0%, #10b981 100%); color: white;">
                <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Resolved</div>
                <div style="font-size: 28px; font-weight: bold;">${resolvedTickets}</div>
              </div>
              <div style="text-align: center; padding: 15px; border-radius: 10px; background: linear-gradient(135deg, #fbc2eb 0%, #ef4444 100%); color: white;">
                <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Escalated</div>
                <div style="font-size: 28px; font-weight: bold;">${escalatedTickets}</div>
              </div>
              <div style="text-align: center; padding: 15px; border-radius: 10px; background: linear-gradient(135deg, #a8edea 0%, #06b6d4 100%); color: white;">
                <div style="font-size: 12px; margin-bottom: 5px; opacity: 0.9;">Resolution Rate</div>
                <div style="font-size: 28px; font-weight: bold;">${resolutionRate}%</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Open</div>
                <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${openTickets}</div>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Pending</div>
                <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${pendingTickets}</div>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">QA Rating</div>
                <div style="font-size: 20px; font-weight: bold; color: #eab308;">${avgQARating}⭐</div>
              </div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Status</div>
                <div style="font-size: 16px; font-weight: bold; color: ${agent.is_active ? '#10b981' : '#6b7280'};">${agent.is_active ? 'Active' : 'Offline'}</div>
              </div>
            </div>
          </div>
          ${index < agents.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
        `;
      });

      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>All Agents Performance Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background: #f8f9fa; }
            .header { text-align: center; border-bottom: 4px solid #4F46E5; padding-bottom: 25px; margin-bottom: 35px; background: white; padding: 40px; border-radius: 12px; }
            .header h1 { color: #4F46E5; margin: 0; font-size: 42px; text-transform: uppercase; letter-spacing: 2px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 18px; }
            .summary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 35px; text-align: center; }
            .summary h2 { font-size: 28px; margin-bottom: 20px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
            .summary-card { background: rgba(255, 255, 255, 0.2); padding: 20px; border-radius: 10px; }
            .summary-card .label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
            .summary-card .value { font-size: 32px; font-weight: bold; }
            @media print {
              body { background: white; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 All Agents Performance Report</h1>
            <p><strong>Period:</strong> ${periodText} (${period.toUpperCase()})</p>
            <p><strong>Generated:</strong> ${format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
            <p><strong>Total Agents:</strong> ${agents.length}</p>
          </div>
          
          <div class="summary">
            <h2>Overall Summary</h2>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="label">Total Agents</div>
                <div class="value">${agents.length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Active Agents</div>
                <div class="value">${agents.filter(a => a.is_active).length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Total Tickets</div>
                <div class="value">${tickets.filter(t => {
                  const ticketDate = new Date(t.createdAt);
                  return ticketDate >= startDate && ticketDate <= endDate;
                }).length}</div>
              </div>
              <div class="summary-card">
                <div class="label">Period</div>
                <div class="value" style="font-size: 20px;">${period.toUpperCase()}</div>
              </div>
            </div>
          </div>
          
          ${allAgentsHTML}
          
          <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 13px; padding: 20px; border-top: 2px solid #e5e7eb;">
            <p><strong>Report Generated by TL Dashboard</strong></p>
            <p>This is an automated report. For queries, contact your system administrator.</p>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF
      const printWindow = window.open('', '', 'width=900,height=650');
      printWindow.document.write(fullHTML);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast.success(`All agents ${period} report generated!`, { id: toastId });
      }, 500);

    } catch (error) {
      console.error('Error generating all agents PDF:', error);
      toast.error('Failed to generate PDF report', { id: toastId });
    }
  };

  const handleDownloadPDF = async (agent, period) => {
    const toastId = toast.loading(`Generating ${period} PDF report for ${agent.name}...`);

    try {
      // Calculate date range
      const now = new Date();
      let startDate, endDate;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else if (period === 'weekly') {
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      // Filter agent tickets by date range
      const agentTickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return (
          (t.agent_id === agent._id || t.assignedTo === agent._id) &&
          ticketDate >= startDate &&
          ticketDate <= endDate
        );
      });

      const resolvedTickets = agentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      const openTickets = agentTickets.filter(t => t.status === 'open').length;
      const pendingTickets = agentTickets.filter(t => t.status === 'pending').length;
      const resolutionRate = agentTickets.length > 0 
        ? Math.round((resolvedTickets / agentTickets.length) * 100)
        : 0;

      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Agent Performance Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #4F46E5; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .agent-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
            .agent-info h2 { font-size: 28px; margin-bottom: 10px; }
            .agent-info p { font-size: 16px; opacity: 0.95; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .info-table td { padding: 14px 0; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
            .info-table td:first-child { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; }
            .info-table td:last-child { color: #1F2937; font-size: 16px; font-weight: 600; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 35px; }
            .metric-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #3b82f6; padding: 20px; border-radius: 8px; }
            .metric-card.green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981; }
            .metric-card.orange { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left-color: #f59e0b; }
            .metric-card.purple { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left-color: #a855f7; }
            .metric-card h3 { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
            .metric-card p { font-size: 32px; font-weight: bold; color: #1f2937; }
            .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; }
            .performance-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .performance-summary p { margin: 10px 0; color: #374151; font-size: 15px; line-height: 1.8; }
            .performance-summary strong { color: #1f2937; font-weight: 600; }
            .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
            .footer p { margin: 0; font-weight: 500; }
            .footer p:last-child { margin-top: 8px; font-size: 12px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 10px; }
            .badge.daily { background: #dbeafe; color: #1e40af; }
            .badge.monthly { background: #fce7f3; color: #9f1239; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Agent Performance Report</h1>
              <p>Comprehensive Performance Analysis - ${period.charAt(0).toUpperCase() + period.slice(1)} Report <span class="badge ${period}">${period.toUpperCase()}</span></p>
            </div>

            <div class="agent-info">
              <h2>${agent.name}</h2>
              <p>${agent.email} | Employee ID: ${agent.employee_id || 'N/A'}</p>
            </div>

            <table class="info-table">
              <tr>
                <td>Report Period:</td>
                <td>${period === 'daily' ? format(now, 'dd MMM yyyy') : format(startDate, 'dd MMM yyyy') + ' - ' + format(endDate, 'dd MMM yyyy')}</td>
              </tr>
              <tr>
                <td>Generated On:</td>
                <td>${format(now, 'dd MMM yyyy, hh:mm a')}</td>
              </tr>
              <tr>
                <td>Report Type:</td>
                <td>${period === 'daily' ? 'Daily Performance Report' : 'Monthly Performance Report'}</td>
              </tr>
              <tr>
                <td>Agent Status:</td>
                <td>${agent.is_active ? '🟢 Online' : '🔴 Offline'}</td>
              </tr>
            </table>

            <h2 class="section-title">Performance Metrics</h2>
            <div class="metrics">
              <div class="metric-card">
                <h3>Total Tickets</h3>
                <p>${agentTickets.length}</p>
              </div>
              <div class="metric-card green">
                <h3>Resolved Tickets</h3>
                <p>${resolvedTickets}</p>
              </div>
              <div class="metric-card orange">
                <h3>Pending Tickets</h3>
                <p>${pendingTickets}</p>
              </div>
              <div class="metric-card purple">
                <h3>Resolution Rate</h3>
                <p>${resolutionRate}%</p>
              </div>
            </div>

            <h2 class="section-title">Performance Summary</h2>
            <div class="performance-summary">
              <p><strong>Ticket Handling:</strong> Processed ${agentTickets.length} tickets during this ${period} period.</p>
              <p><strong>Resolution Efficiency:</strong> Successfully resolved ${resolvedTickets} tickets with a ${resolutionRate}% resolution rate.</p>
              <p><strong>Open Items:</strong> Currently ${openTickets} tickets are open and ${pendingTickets} are pending action.</p>
              <p><strong>Performance Status:</strong> ${resolutionRate >= 80 ? '✅ Excellent Performance' : resolutionRate >= 60 ? '⚠️ Good Performance' : '❌ Needs Improvement'}</p>
            </div>

            <div class="footer">
              <p>Report Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}</p>
              <p>© ${new Date().getFullYear()} CRM System - Professional Performance Report (TL Panel)</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([pdfHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent.name.replace(/\s+/g, '_')}_${period}_report_${format(now, 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: `${period.charAt(0).toUpperCase() + period.slice(1)} report downloaded successfully!`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.update(toastId, {
        render: `Failed to generate ${period} report`,
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (employeesLoading || ticketsLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Agent Performance Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View detailed performance metrics and download daily or monthly reports
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Download All Agents Reports */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border-2 border-purple-200 dark:border-purple-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-1">
                📥 Download All Agents Performance Reports
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400">
                Generate comprehensive PDF reports for all {agents.length} agents
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownloadAllAgentsPDF('daily')}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg hover:shadow-xl"
              >
                <FileDown size={18} />
                Daily Report
              </button>
              <button
                onClick={() => handleDownloadAllAgentsPDF('weekly')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg hover:shadow-xl"
              >
                <Calendar size={18} />
                Weekly Report
              </button>
              <button
                onClick={() => handleDownloadAllAgentsPDF('monthly')}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg hover:shadow-xl"
              >
                <Calendar size={18} />
                Monthly Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
            bg-white dark:bg-slate-700 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
            bg-white dark:bg-slate-700 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        >
          <option value="name">Sort by Name</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Agents</p>
          <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {agents.length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Currently Active</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {agents.filter(a => a.is_active).length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
          <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {tickets.length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
          <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">
            {agents.filter(a => !a.is_active).length}
          </h3>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {filteredAgents.map((agent) => (
          <AgentDetailCard
            key={agent._id}
            agent={agent}
            tickets={tickets}
            onDownloadPDF={handleDownloadPDF}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No agents found matching your search.
        </div>
      )}
    </div>
  );
};

export default AgentPerformanceDetail;
