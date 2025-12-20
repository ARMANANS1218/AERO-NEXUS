import React, { useMemo, useContext, useState } from 'react';
import {
  Users,
  Wifi,
  MessageCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Zap,
  AlertCircle,
  Send,
  Activity,
  Building2,
  Mail,
  AlertTriangle,
  Info,
  UserCheck,
  Target,
  Award,
  TrendingDown,
  Gauge,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { useGetAdminDashboardStatsQuery, useGetAllEmployeesQuery } from '../../../features/admin/adminApi';
import { useGetTicketStatsQuery } from '../../../features/emailTicket/emailTicketApi';
import { useNavigate } from 'react-router-dom';
import ColorModeContext from '../../../context/ColorModeContext';
import { jwtDecode } from 'jwt-decode';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';

// --- Premium UI Components ---

const GlassCard = ({ children, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={`
      bg-white/70 dark:bg-slate-800/50 
      backdrop-blur-xl 
      border border-white/20 dark:border-slate-700/50 
      shadow-xl shadow-slate-200/50 dark:shadow-black/20 
      rounded-2xl 
      overflow-hidden
      transition-all duration-300
      ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:border-indigo-500/30' : ''}
      ${className}
    `}
  >
    {children}
  </div>
);

const PremiumStatCard = ({ title, value, icon: Icon, color, subtext, trend, trendValue, iconColor }) => (
  <GlassCard className="p-5 relative overflow-hidden group">
    {/* Background Gradient Blob */}
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-500 ${color?.replace('text-', 'bg-') || 'bg-indigo-500'}`}></div>

    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color?.replace('text-', 'bg-') || 'bg-indigo-500'}/10 dark:${color?.replace('text-', 'bg-') || 'bg-indigo-500'}/20`}>
          <Icon size={22} className={color || 'text-indigo-600'} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trendValue)}%</span>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">{value}</h4>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  </GlassCard>
);

const ChartHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
        {title}
      </h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// --- Advanced Charts ---

const GradientAreaChart = ({ data, dataKey, xKey, colorStart, colorEnd, height = 300 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={colorStart} stopOpacity={0.4} />
          <stop offset="95%" stopColor={colorEnd} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
      <XAxis
        dataKey={xKey}
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 12 }}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          color: '#1e293b'
        }}
        itemStyle={{ color: colorStart }}
      />
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke={colorStart}
        strokeWidth={3}
        fillOpacity={1}
        fill={`url(#gradient-${dataKey})`}
        animationDuration={1500}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const ModernDonutChart = ({ data, colors, innerRadius = 60, outerRadius = 80 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={{
            outerRadius: outerRadius + 5,
            innerRadius: innerRadius - 2,
            fillOpacity: 0.9,
          }}
          onMouseEnter={onPieEnter}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={5}
          dataKey="value"
          cornerRadius={6}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: 'none',
            color: '#fff'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

const RoundedBarChart = ({ data, dataKey, color, height = 250 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 11 }}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#64748b', fontSize: 11 }}
      />
      <Tooltip
        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Bar dataKey={dataKey} fill={color} radius={[6, 6, 6, 6]} barSize={30} animationDuration={1500} />
    </BarChart>
  </ResponsiveContainer>
);

// --- List Components ---

const PremiumList = ({ title, items, icon: Icon, valueKey = "value" }) => (
  <GlassCard className="h-full">
    <div className="p-5 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center">
      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
        {Icon && <Icon size={18} className="text-indigo-500" />}
        {title}
      </h3>
    </div>
    <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-xl transition-colors mb-1 last:mb-0"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                  idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
              }`}>
              {idx + 1}
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-sm">
            {item[valueKey]}
          </span>
        </div>
      ))}
    </div>
  </GlassCard>
);

const CSATRadial = ({ value, title }) => {
  const data = [
    { name: 'CSAT', value: value, fill: '#10b981' },
    { name: 'Max', value: 100 - value, fill: 'transparent' }
  ];

  return (
    <GlassCard className="p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="relative">
        {/* Custom SVG Gauge could go here, but using Radial for simplicity & aesthetic */}
        <div className="w-32 h-32 relative flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-100 dark:text-slate-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={351.86}
              strokeDashoffset={351.86 - (351.86 * value) / 100}
              className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{value}%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Excellent</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};


const AdminDashboard = () => {
  const navigate = useNavigate();
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';
  const [activeTab, setActiveTab] = useState('agents');
  const [organizationName, setOrganizationName] = React.useState('');

  // Refresh states
  const [isRefreshingAgent, setIsRefreshingAgent] = useState(false);
  const [isRefreshingQuery, setIsRefreshingQuery] = useState(false);
  const [isRefreshingTicket, setIsRefreshingTicket] = useState(false);

  React.useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.organizationName) {
          setOrganizationName(decoded.organizationName);
        }
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }, []);

  const { data: adminStatsData, isLoading: statsLoading, refetch: refetchAdminStats } = useGetAdminDashboardStatsQuery();
  const { data: employeesData, isLoading: employeesLoading } = useGetAllEmployeesQuery();
  const { data: ticketStatsData, isLoading: ticketStatsLoading, refetch: refetchTicketStats } = useGetTicketStatsQuery();

  const statsData = adminStatsData?.data || {};
  const agentStats = statsData.agent || {};
  const qaStats = statsData.qa || {};
  const overallStats = statsData.overall || {};
  const systemHealth = statsData.systemHealth || {};

  const ticketStats = ticketStatsData?.data || {};
  const ticketData = ticketStats.ticketStats || {};
  const priorityStats = ticketStats.priorityStats || {};
  const agentStatsTicket = ticketStats.agentStats || {};

  // Handlers
  const handleRefreshAgentStats = async () => {
    setIsRefreshingAgent(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingAgent(false), 800);
  };

  const handleRefreshQueryStats = async () => {
    setIsRefreshingQuery(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingQuery(false), 800);
  };

  const handleRefreshTicketStats = async () => {
    setIsRefreshingTicket(true);
    await refetchTicketStats();
    setTimeout(() => setIsRefreshingTicket(false), 800);
  };

  // Data Preparation
  const agentActivityData = useMemo(() => [
    { name: 'Active', value: systemHealth.activeAgents || 0 },
    { name: 'Inactive', value: Math.max(0, (systemHealth.agentCount || 0) - (systemHealth.activeAgents || 0)) },
  ], [systemHealth]);

  const qaActivityData = useMemo(() => [
    { name: 'Active', value: systemHealth.activeQA || 0 },
    { name: 'Inactive', value: Math.max(0, (systemHealth.qaCount || 0) - (systemHealth.activeQA || 0)) },
  ], [systemHealth]);

  const topAgentSolvers = useMemo(() =>
    agentStats.topAgents?.slice(0, 8).map(agent => ({
      name: agent.name || agent.alias || 'Unknown',
      value: agent.resolvedToday || agent.totalResolved || 0
    })) || [],
    [agentStats.topAgents]
  );

  const agentScoresData = useMemo(() =>
    agentStats.topAgents?.slice(0, 8).map(agent => ({
      name: agent.name || agent.alias || 'Unknown',
      value: agent.successRate || agent.approvalRate || 0
    })) || [],
    [agentStats.topAgents]
  );

  const ticketVolumeData = useMemo(() => {
    if (ticketStats.dailyTrend && ticketStats.dailyTrend.length > 0) {
      return ticketStats.dailyTrend.map(day => ({
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
        volume: day.count || 0
      }));
    }
    // Fallback data if empty for visualization
    return [
      { day: 'Mon', volume: 12 },
      { day: 'Tue', volume: 19 },
      { day: 'Wed', volume: 15 },
      { day: 'Thu', volume: 22 },
      { day: 'Fri', volume: 28 },
      { day: 'Sat', volume: 14 },
      { day: 'Sun', volume: 8 },
    ];
  }, [ticketStats.dailyTrend]);

  const statusColors = ['#10b981', '#64748b', '#f59e0b', '#ef4444'];
  const donutColors = ['#6366f1', '#e2e8f0']; // Indigo for active, Slate for inactive
  const darkDonutColors = ['#818cf8', '#334155'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1117] p-4 md:p-6 transition-colors duration-300 font-sans">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-800">
              {organizationName || 'Admin Portal'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              Overview & Analytics
            </span>
          </div>
        </div>

        {/* Tab Switcher - Floating Premium Style */}
        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto max-w-full">
          {[
            { id: 'agents', label: 'Agents', icon: Users },
            { id: 'queries', label: 'Queries', icon: MessageCircle },
            { id: 'tickets', label: 'Email Tickets', icon: Mail }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/30 transform scale-100'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- AGENT STATS VIEW --- */}
      {activeTab === 'agents' && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Real-time Agent Metrics</h2>
            <button
              onClick={handleRefreshAgentStats}
              disabled={isRefreshingAgent}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 hover:text-indigo-700 shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:rotate-180 duration-500"
            >
              <RefreshCw size={20} className={isRefreshingAgent ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PremiumStatCard
              title="Total Agents"
              value={systemHealth.agentCount || 0}
              icon={Users}
              color="text-indigo-600"
              subtext={`${systemHealth.activeAgents || 0} Active Now`}
              trend={10}
              trendValue={5}
            />
            <PremiumStatCard
              title="Resolved Today"
              value={agentStats.resolvedToday || 0}
              icon={CheckCircle}
              color="text-emerald-500"
              subtext="Successfully closed"
              trend={12}
              trendValue={12}
            />
            <PremiumStatCard
              title="Avg Response"
              value={`${agentStats.avgResponseTime || 0}m`}
              icon={Clock}
              color="text-amber-500"
              subtext="Wait time"
            />
            <CSATRadial value={agentStats.csatScore || 87} title="CSAT Score" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agent Distribution Donut */}
            <GlassCard className="p-6 col-span-1 lg:col-span-1">
              <ChartHeader title="Agent Availability" subtitle="Active vs Inactive Staff" />
              <div className="relative">
                <ModernDonutChart
                  data={agentActivityData}
                  colors={isDark ? darkDonutColors : donutColors}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white block">{systemHealth.agentCount || 0}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Top Performers Bar Chart */}
            <GlassCard className="p-6 col-span-1 lg:col-span-2">
              <ChartHeader title="Top Performers" subtitle="Queries Resolved Today" />
              <RoundedBarChart
                data={topAgentSolvers.length > 0 ? topAgentSolvers : [{ name: 'No Data', value: 0 }]}
                dataKey="value"
                color="#6366f1"
              />
            </GlassCard>
          </div>

          {/* Lists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PremiumList
              title="Top Agent Scores"
              items={agentScoresData.length > 0 ? agentScoresData : [{ name: 'Loading...', value: 0 }]}
              icon={Award}
            />
            <GlassCard className="p-6">
              <ChartHeader title="QA Team Activity" subtitle="Current Status" />
              <ModernDonutChart
                data={qaActivityData}
                colors={['#f59e0b', '#cbd5e1']}
              />
            </GlassCard>
          </div>
        </div>
      )}

      {/* --- QUERIES STATS VIEW --- */}
      {activeTab === 'queries' && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Query Analytics</h2>
            <button
              onClick={handleRefreshQueryStats}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={20} className={isRefreshingQuery ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-500 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Queries</p>
                  <h3 className="text-4xl font-bold">{overallStats.totalQueries || 0}</h3>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <HelpCircle size={24} className="text-white" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20">
                <span className="text-sm font-medium bg-white/20 px-2 py-1 rounded">
                  {overallStats.resolvedQueries || 0} Resolved
                </span>
              </div>
            </div>

            <PremiumStatCard
              title="Open Queries"
              value={overallStats.openQueries || 0}
              icon={MessageCircle}
              color="text-indigo-500"
            />
            <PremiumStatCard
              title="Pending"
              value={overallStats.pendingQueries || 0}
              icon={Clock}
              color="text-orange-500"
            />
            <PremiumStatCard
              title="Unassigned"
              value={agentStats.totalPendingQueries || 0}
              icon={AlertCircle}
              color="text-rose-500"
            />
          </div>

          {/* Big Conversation Trend Chart */}
          <GlassCard className="p-6">
            <ChartHeader
              title="Conversation Trends"
              subtitle="New vs Resolved over time"
              action={
                <select className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-xs p-2 text-slate-600 dark:text-slate-300 font-bold focus:ring-0">
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                </select>
              }
            />
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={overallStats.conversationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="new" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                <Legend iconType="circle" />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {/* --- EMAIL TICKET STATS VIEW --- */}
      {activeTab === 'tickets' && (
        <div className="animate-fadeIn space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Email Ticket Overview</h2>
            <button
              onClick={handleRefreshTicketStats}
              disabled={isRefreshingTicket}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 hover:text-indigo-700 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw size={20} className={isRefreshingTicket ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Ticket Hero Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PremiumStatCard
              title="Total Tickets"
              value={ticketData.total || 0}
              icon={Mail}
              color="text-violet-500"
              subtext="All time volume"
            />
            <PremiumStatCard
              title="Open Now"
              value={ticketData.open || 0}
              icon={AlertCircle}
              color="text-rose-500"
              subtext="Requires attention"
            />
            <PremiumStatCard
              title="Resolved"
              value={ticketData.resolved || 0}
              icon={CheckCircle}
              color="text-emerald-500"
              subtext="Completed tickets"
            />
            <CSATRadial value={ticketStats.csatScore || 92} title="Ticket CSAT" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket Volume Area Chart - THE HERO GRAPH */}
            <GlassCard className="p-6 col-span-1 lg:col-span-2">
              <ChartHeader title="Ticket Volume Trends" subtitle="Incoming volume last 7 days" />
              <div className="h-[300px] w-full">
                <GradientAreaChart
                  data={ticketVolumeData}
                  dataKey="volume"
                  xKey="day"
                  colorStart="#8b5cf6"
                  colorEnd="#c4b5fd"
                />
              </div>
            </GlassCard>

            {/* Priority Chart */}
            <GlassCard className="p-6 col-span-1">
              <ChartHeader title="Priority Distribution" subtitle="By urgency level" />
              <div className="relative">
                <ModernDonutChart
                  data={[
                    { name: 'High', value: priorityStats.high || 0, fill: '#ef4444' },
                    { name: 'Medium', value: priorityStats.medium || 0, fill: '#f59e0b' },
                    { name: 'Low', value: priorityStats.low || 0, fill: '#3b82f6' }
                  ]}
                  colors={['#ef4444', '#f59e0b', '#3b82f6']}
                  innerRadius={70}
                  outerRadius={90}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {ticketData.total || 0}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Top Solvers & Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumList
              title="Top Ticket Solvers"
              items={topAgentSolvers}
              icon={Target}
              valueKey="value"
            />
            <GlassCard className="p-6">
              <ChartHeader title="Ticket Status" subtitle="Current workflow state" />
              <RoundedBarChart
                data={[
                  { name: 'Open', value: ticketData.open || 0 },
                  { name: 'Pending', value: ticketData.pending || 0 },
                  { name: 'Resolved', value: ticketData.resolved || 0 },
                  { name: 'Closed', value: ticketData.closed || 0 },
                ]}
                dataKey="value"
                color="#14b8a6"
              />
            </GlassCard>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
