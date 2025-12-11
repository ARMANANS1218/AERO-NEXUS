import React, { useContext } from 'react';
import { 
  Mail, Users, Clock, CheckCircle, AlertCircle, AlertTriangle, 
  Info, TrendingUp, BarChart3, Activity, Zap, UserCheck, Building2
} from 'lucide-react';
import { useGetTicketStatsQuery } from '../../../features/emailTicket/emailTicketApi';
import ColorModeContext from '../../../context/ColorModeContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, bgColor, subtext, trend, loading }) => (
  <div className={`${bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300`}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <h3 className={`text-3xl font-bold ${color}`}>
          {loading ? '...' : value}
        </h3>
        {subtext && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtext}</p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
        <Icon size={24} className={color} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-xs">
        <TrendingUp size={12} className={trend > 0 ? 'text-green-500' : 'text-red-500'} />
        <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-500 dark:text-gray-400">vs last week</span>
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, icon: Icon, color }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon size={20} className={color} />
    </div>
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
  </div>
);

const ChartCard = ({ title, children, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
    {loading ? (
      <div className="h-64 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    ) : (
      children
    )}
  </div>
);

const EmailTicketDashboard = () => {
  const { mode } = useContext(ColorModeContext);
  const isDark = mode === 'dark';
  
  const { data: statsData, isLoading, error } = useGetTicketStatsQuery(undefined, {
    pollingInterval: 30000 // Refresh every 30 seconds
  });

  const stats = statsData?.data || {};
  const ticketStats = stats.ticketStats || {};
  const priorityStats = stats.priorityStats || {};
  const categoryStats = stats.categoryStats || [];
  const agentStats = stats.agentStats || {};
  const performanceStats = stats.performanceStats || {};
  const userStats = stats.userStats || {};

  // Prepare chart data
  const statusChartData = [
    { name: 'Open', value: ticketStats.open || 0, fill: '#3b82f6' },
    { name: 'Pending', value: ticketStats.pending || 0, fill: '#f59e0b' },
    { name: 'Closed', value: ticketStats.closed || 0, fill: '#10b981' }
  ];

  const priorityChartData = [
    { name: 'High', value: priorityStats.high || 0, fill: '#ef4444' },
    { name: 'Medium', value: priorityStats.medium || 0, fill: '#f59e0b' },
    { name: 'Low', value: priorityStats.low || 0, fill: '#10b981' }
  ];

  const categoryChartData = categoryStats.map(cat => ({
    name: cat.category,
    value: cat.count
  }));

  const trendData = (performanceStats.last7DaysTrend || []).map(item => ({
    date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tickets: item.count
  }));

  const chartColors = isDark
    ? { line: '#60a5fa', grid: '#374151', text: '#e5e7eb' }
    : { line: '#3b82f6', grid: '#e5e7eb', text: '#374151' };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to load statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">{error.message || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Email Ticket Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Real-time email ticketing system analytics and performance metrics</p>
      </div>

      {/* ============================== */}
      {/* TICKET STATISTICS */}
      {/* ============================== */}
      <div className="mb-8">
        <SectionHeader title="Ticket Statistics" icon={Mail} color="text-blue-600 dark:text-blue-400" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Tickets"
            value={ticketStats.total || 0}
            icon={Mail}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="All time"
            loading={isLoading}
          />
          
          <StatCard
            title="Open Tickets"
            value={ticketStats.open || 0}
            icon={AlertCircle}
            color="text-blue-500 dark:text-blue-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Active conversations"
            loading={isLoading}
          />
          
          <StatCard
            title="Pending Tickets"
            value={ticketStats.pending || 0}
            icon={Clock}
            color="text-yellow-600 dark:text-yellow-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Awaiting response"
            loading={isLoading}
          />
          
          <StatCard
            title="Closed Tickets"
            value={ticketStats.closed || 0}
            icon={CheckCircle}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Resolved"
            loading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Today's Tickets"
            value={ticketStats.today || 0}
            icon={TrendingUp}
            color="text-indigo-600 dark:text-indigo-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Created today"
            loading={isLoading}
          />
          
          <StatCard
            title="Unassigned"
            value={ticketStats.unassigned || 0}
            icon={AlertTriangle}
            color="text-orange-600 dark:text-orange-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Needs assignment"
            loading={isLoading}
          />
          
          <StatCard
            title="Avg Response Time"
            value={`${performanceStats.avgResponseTime || 0}m`}
            icon={Zap}
            color="text-purple-600 dark:text-purple-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="First response"
            loading={isLoading}
          />
        </div>
      </div>

      {/* ============================== */}
      {/* PRIORITY BREAKDOWN */}
      {/* ============================== */}
      <div className="mb-8">
        <SectionHeader title="Priority Breakdown" icon={AlertTriangle} color="text-red-600 dark:text-red-400" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="High Priority"
            value={priorityStats.high || 0}
            icon={AlertCircle}
            color="text-red-600 dark:text-red-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Urgent attention needed"
            loading={isLoading}
          />
          
          <StatCard
            title="Medium Priority"
            value={priorityStats.medium || 0}
            icon={AlertTriangle}
            color="text-yellow-600 dark:text-yellow-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Normal priority"
            loading={isLoading}
          />
          
          <StatCard
            title="Low Priority"
            value={priorityStats.low || 0}
            icon={Info}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Can wait"
            loading={isLoading}
          />
        </div>
      </div>

      {/* ============================== */}
      {/* AGENT STATISTICS */}
      {/* ============================== */}
      <div className="mb-8">
        <SectionHeader title="Agent Statistics" icon={Users} color="text-indigo-600 dark:text-indigo-400" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Agents"
            value={agentStats.totalAgents || 0}
            icon={Users}
            color="text-indigo-600 dark:text-indigo-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Agent role"
            loading={isLoading}
          />
          
          <StatCard
            title="QA Team"
            value={agentStats.totalQA || 0}
            icon={UserCheck}
            color="text-purple-600 dark:text-purple-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Quality assurance"
            loading={isLoading}
          />
          
          <StatCard
            title="Team Leads"
            value={agentStats.totalTL || 0}
            icon={Building2}
            color="text-cyan-600 dark:text-cyan-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="TL role"
            loading={isLoading}
          />
          
          <StatCard
            title="Online Now"
            value={agentStats.onlineAgents || 0}
            icon={Activity}
            color="text-green-600 dark:text-green-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Currently active"
            loading={isLoading}
          />
        </div>
      </div>

      {/* ============================== */}
      {/* USER STATISTICS */}
      {/* ============================== */}
      <div className="mb-8">
        <SectionHeader title="Widget User Statistics" icon={Users} color="text-teal-600 dark:text-teal-400" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Widget Users"
            value={userStats.totalWidgetUsers || 0}
            icon={Users}
            color="text-teal-600 dark:text-teal-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Unique users from integrated websites"
            loading={isLoading}
          />
          
          <StatCard
            title="Avg Tickets Per User"
            value={userStats.totalWidgetUsers > 0 ? ((ticketStats.total || 0) / userStats.totalWidgetUsers).toFixed(1) : '0'}
            icon={BarChart3}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-white dark:bg-gray-800"
            subtext="Engagement metric"
            loading={isLoading}
          />
        </div>
      </div>

      {/* ============================== */}
      {/* CHARTS AND VISUALIZATIONS */}
      {/* ============================== */}
      <div className="mb-8">
        <SectionHeader title="Visual Analytics" icon={BarChart3} color="text-violet-600 dark:text-violet-400" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ticket Status Distribution */}
          <ChartCard title="Ticket Status Distribution" loading={isLoading}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Priority Distribution */}
          <ChartCard title="Priority Distribution" loading={isLoading}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Category Breakdown */}
        {categoryChartData.length > 0 && (
          <div className="mb-6">
            <ChartCard title="Tickets by Category" loading={isLoading}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: isDark ? '#e5e7eb' : '#374151'
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* 7-Day Trend */}
        {trendData.length > 0 && (
          <div>
            <ChartCard title="Ticket Volume Trend (Last 7 Days)" loading={isLoading}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="date" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: isDark ? '#e5e7eb' : '#374151'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tickets" 
                    stroke={chartColors.line} 
                    strokeWidth={3}
                    dot={{ fill: chartColors.line, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* TOP PERFORMERS */}
      {/* ============================== */}
      {agentStats.topPerformers && agentStats.topPerformers.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Top Performing Agents" icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" />
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Open</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closed</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resolution Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {agentStats.topPerformers.map((performer, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {performer.agent.name}
                        </div>
                        {performer.agent.alias && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {performer.agent.alias}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {performer.agent.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-gray-100 font-semibold">
                        {performer.totalTickets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 dark:text-blue-400">
                        {performer.openTickets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 dark:text-green-400">
                        {performer.closedTickets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          performer.resolutionRate >= 80 ? 'text-green-600 dark:text-green-400' :
                          performer.resolutionRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {performer.resolutionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Last updated: {stats.timestamp ? new Date(stats.timestamp).toLocaleString() : 'Loading...'}
      </div>
    </div>
  );
};

export default EmailTicketDashboard;
