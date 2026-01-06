import React, { useMemo, useContext, useState } from 'react';
import { CircularProgress } from '@mui/material';
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
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, trend }) => (
  <div
    onClick={onClick}
    className={`p-3 rounded-lg shadow-md flex flex-col transition-all duration-300 
      ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : 'cursor-default'}
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 backdrop-blur-sm`}
  >
    <div className="flex items-start justify-between mb-2">
      <div>
        <h4 className={`text-3xl font-bold mb-1 ${color}`}>
          {value}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </p>
        {subtext && <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{subtext}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20 flex-shrink-0`}>
        <Icon size={20} className={color} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-xs mt-1">
        <TrendingUp size={12} className={trend > 0 ? 'text-green-500' : 'text-red-500'} />
        <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
          {trend > 0 ? '+' : ''}{trend}% from last month
        </span>
      </div>
    )}
  </div>
);

const ChartContainer = ({ title, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
      <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
      {title}
    </h3>
    {children}
  </div>
);

// Gauge Component for CSAT/Score metrics
const GaugeCard = ({ title, value, max = 100, color = "blue", subtitle }) => {
  const percentage = (value / max) * 100;
  const rotation = (percentage / 100) * 180 - 90;
  
  const getColor = () => {
    if (percentage >= 80) return { main: '#14b8a6', light: '#d1fae5', dark: '#0d9488' };
    if (percentage >= 60) return { main: '#f59e0b', light: '#fef3c7', dark: '#92400e' };
    return { main: '#ef4444', light: '#fee2e2', dark: '#991b1b' };
  };
  
  const colors = getColor();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3">{title}</h3>
      <div className="relative flex items-center justify-center">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div className="w-36 h-18 border-8 border-gray-200 dark:border-gray-700 rounded-t-full"></div>
          </div>
          {/* Progress arc */}
          <div 
            className="absolute inset-0 flex items-end justify-center transition-all duration-1000"
            style={{ 
              clipPath: `polygon(0 100%, 100% 100%, 100% 0, ${50 + percentage/2}% 0, ${50 - percentage/2}% 0, 0 0)` 
            }}
          >
            <div 
              className="w-36 h-18 border-8 rounded-t-full transition-all duration-1000"
              style={{ borderColor: colors.main }}
            ></div>
          </div>
          {/* Needle */}
          <div className="absolute inset-0 flex items-end justify-center">
            <div 
              className="absolute bottom-0 w-1 h-16 origin-bottom transition-all duration-1000"
              style={{ 
                background: `linear-gradient(to top, ${colors.main}, white)`,
                transform: `rotate(${rotation}deg)`,
                boxShadow: `0 0 10px ${colors.main}`
              }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg"></div>
            </div>
            <div className="absolute bottom-0 w-4 h-4 rounded-full" style={{ backgroundColor: colors.main }}></div>
          </div>
        </div>
      </div>
      <div className="text-center mt-1">
        <div className="text-3xl font-bold" style={{ color: colors.main }}>{value}%</div>
        {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span>80%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// Time metric card
const TimeMetricCard = ({ label, value, unit }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</h3>
    <div className="flex items-baseline gap-1.5">
      <div className="text-4xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xl font-medium text-gray-500 dark:text-gray-400">{unit}</div>
    </div>
    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">First response time</div>
  </div>
);

// Ticket count card with alert
const TicketCountCard = ({ value, label, showAlert }) => (
  <div className="relative bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <div className="text-5xl font-bold text-gray-900 dark:text-white mb-1.5">{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    {showAlert && (
      <div className="absolute bottom-3 right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
        <AlertCircle className="text-white" size={24} />
      </div>
    )}
  </div>
);

// Top performers list
const TopPerformersList = ({ title, data, scoreKey = "score" }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
          <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
          <span className="text-gray-900 dark:text-white font-bold text-lg">{item[scoreKey]}</span>
        </div>
      ))}
    </div>
  </div>
);

// Status bar chart
const StatusBarChart = ({ title, data }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
            <span className="text-gray-900 dark:text-white font-bold">{item.value}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                backgroundColor: item.color || '#3b82f6'
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Agent scores list
const AgentScoresList = ({ title, data }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-2">
          <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
          <div className="flex items-center gap-3">
            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-teal-500"
                style={{ width: `${item.score}%` }}
              ></div>
            </div>
            <span className="text-gray-900 dark:text-white font-bold w-12 text-right">{item.score}%</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';
  const [activeTab, setActiveTab] = useState('agents');

  // Get organization name from token/localStorage
  const [organizationName, setOrganizationName] = React.useState('');
  
  React.useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        // If organization info is in token, use it
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

  // Extract data from admin stats
  const agentStats = statsData.agent || {};
  const qaStats = statsData.qa || {};
  const overallStats = statsData.overall || {};
  const systemHealth = statsData.systemHealth || {};

  // Prepare chart data
  const teamDistributionData = useMemo(
    () => [
      { name: 'Agents', value: systemHealth.agentCount || 0, fill: '#6366f1' },
      { name: 'QA', value: systemHealth.qaCount || 0, fill: '#f59e0b' },
      { name: 'Customers', value: systemHealth.customerCount || 0, fill: '#8b5cf6' },
    ],
    [systemHealth]
  );

  const queryStatusData = useMemo(
    () => [
      { name: 'Open', value: overallStats.openQueries || 0, fill: '#3b82f6' },
      { name: 'Resolved', value: overallStats.resolvedQueries || 0, fill: '#10b981' },
    ],
    [overallStats]
  );

  const agentActivityData = useMemo(
    () => [
      { name: 'Active', value: systemHealth.activeAgents || 0, fill: '#10b981' },
      { name: 'Inactive', value: (systemHealth.agentCount || 0) - (systemHealth.activeAgents || 0), fill: '#6b7280' },
    ],
    [systemHealth]
  );

  const qaActivityData = useMemo(
    () => [
      { name: 'Active', value: systemHealth.activeQA || 0, fill: '#f59e0b' },
      { name: 'Inactive', value: (systemHealth.qaCount || 0) - (systemHealth.activeQA || 0), fill: '#6b7280' },
    ],
    [systemHealth]
  );

  const userAvailabilityData = useMemo(
    () => [
      { name: 'Online', value: systemHealth.activeUsers || 0, fill: '#10b981' },
      { name: 'Offline', value: systemHealth.inactiveUsers || 0, fill: '#6b7280' },
    ],
    [systemHealth]
  );

  const communicationData = useMemo(
    () => [
      { name: 'Chats', value: overallStats.totalChats || 0, fill: '#6366f1' },
      { name: 'Calls', value: overallStats.totalCalls || 0, fill: '#f59e0b' },
    ],
    [overallStats]
  );

  const chartColors = isDark
    ? { line: '#60a5fa', grid: '#334155', text: '#e2e8f0' }
    : { line: '#3b82f6', grid: '#e5e7eb', text: '#374151' };

  const ticketStats = ticketStatsData?.data || {};
  const ticketData = ticketStats.ticketStats || {};
  const priorityStats = ticketStats.priorityStats || {};
  const agentStatsTicket = ticketStats.agentStats || {};

  // Refresh handlers with separate loading states
  const [isRefreshingAgent, setIsRefreshingAgent] = React.useState(false);
  const [isRefreshingQuery, setIsRefreshingQuery] = React.useState(false);
  const [isRefreshingTicket, setIsRefreshingTicket] = React.useState(false);
  
  const handleRefreshAgentStats = async () => {
    setIsRefreshingAgent(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingAgent(false), 500);
  };

  const handleRefreshQueryStats = async () => {
    setIsRefreshingQuery(true);
    await refetchAdminStats();
    setTimeout(() => setIsRefreshingQuery(false), 500);
  };

  const handleRefreshTicketStats = async () => {
    setIsRefreshingTicket(true);
    await refetchTicketStats();
    setTimeout(() => setIsRefreshingTicket(false), 500);
  };

  // Prepare real data for top performers from API only
  const topAgentSolvers = useMemo(() => 
    agentStats.topAgents?.slice(0, 8).map(agent => ({
      name: agent.name || agent.alias || 'Unknown',
      count: agent.resolvedToday || agent.totalResolved || 0
    })) || [],
    [agentStats.topAgents]
  );

  const agentScoresData = useMemo(() =>
    agentStats.topAgents?.slice(0, 9).map(agent => ({
      name: agent.name || agent.alias || 'Unknown',
      score: agent.successRate || agent.approvalRate || 0
    })) || [],
    [agentStats.topAgents]
  );

  // Ticket volume data for 7 days from actual API data
  const ticketVolumeData = useMemo(() => {
    if (ticketStats.dailyTrend && ticketStats.dailyTrend.length > 0) {
      return ticketStats.dailyTrend.map(day => ({
        day: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: day.count || 0
      }));
    }
    return [];
  }, [ticketStats.dailyTrend]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-2 md:p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          {organizationName && (
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg border border-violet-300 dark:border-violet-700">
              <Building2 size={20} className="text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{organizationName}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">Real-time system overview with live analytics</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-3 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'agents'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Agent Stats
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`px-3 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'queries'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MessageCircle size={16} className="inline mr-2" />
              Query Stats
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-3 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Mail size={16} className="inline mr-2" />
              Email Ticket Stats
            </button>
          </div>
        </div>
      </div>

      {/* Agent Stats Tab */}
      {activeTab === 'agents' && (
        <>
          {/* Refresh Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Agent Statistics</h2>
            <button
              onClick={handleRefreshAgentStats}
              disabled={isRefreshingAgent}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={isRefreshingAgent ? 'animate-spin' : ''} />
              <span>{isRefreshingAgent ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {(statsLoading || isRefreshingAgent) ? (
            /* Beautiful Loading Skeleton */
            <div className="space-y-4 animate-pulse">
              {/* Top Row Skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                    <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded w-1/2"></div>
                  </div>
                ))}
              </div>

              {/* Second Row Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-1"></div>
                      </div>
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Third Row Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                    <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="flex justify-between items-center">
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                    <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Top Row - Compact Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* CSAT Gauge - Compact */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">CSAT this month</h3>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{agentStats.csatScore || 0}%</div>
            </div>
            
            {/* Today Response Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Avg Response Time</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{agentStats.avgFirstResponseTime || agentStats.avgResponseTime || 0}<span className="text-lg">m</span></div>
            </div>
            
            {/* Resolution Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Avg Resolution Time</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{agentStats.avgFullResolutionTime || 0}<span className="text-lg">h</span></div>
            </div>
            
            {/* Unassigned Tickets */}
            <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Unassigned tickets</h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{agentStats.totalPendingQueries || 0}</div>
              {agentStats.totalPendingQueries > 20 && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-white" size={14} />
                </div>
              )}
            </div>
          </div>

          {/* Second Row - Agent Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Total Agents"
              value={systemHealth.agentCount || 0}
              icon={Users}
              color="text-indigo-600 dark:text-indigo-400"
              subtext={`${systemHealth.activeAgents || 0} currently active`}
            />

            <StatCard
              title="Queries Resolved Today"
              value={agentStats.resolvedToday || 0}
              icon={CheckCircle}
              color="text-green-600 dark:text-green-400"
              subtext="Agent team"
            />

            <StatCard
              title="Active Chats"
              value={agentStats.totalActiveChats || 0}
              icon={MessageCircle}
              color="text-blue-600 dark:text-blue-400"
              subtext="In progress"
            />

            <StatCard
              title="Avg Response Time"
              value={`${agentStats.avgResponseTime || 0}m`}
              icon={Clock}
              color="text-amber-600 dark:text-amber-400"
              subtext="Team average"
            />
          </div>

          {/* Third Row - Top Performers and Agent Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Top Ticket Solvers */}
            <TopPerformersList 
              title="Top ticket solvers this week"
              data={topAgentSolvers}
              scoreKey="count"
            />
            
            {/* Agent Scores */}
            <AgentScoresList 
              title="Agent scores"
              data={agentScoresData}
            />
          </div>

          {/* Agent Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <ChartContainer title="Agent Activity Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={agentActivityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {agentActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDark ? '#e2e8f0' : '#1f2937',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer title="QA Team Activity Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={qaActivityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qaActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDark ? '#e2e8f0' : '#1f2937',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
            </>
          )}
        </>
      )}

      {/* Communication (calls removed) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Emails Sent"
          value={agentStats.emailsSent}
          icon={Send}
          color="text-rose-600 dark:text-rose-400"
          subtext="By agent team"
        />

        <StatCard
          title="Avg Response Time"
          value={`${agentStats.avgResponseTime}m`}
          icon={Zap}
          color="text-yellow-600 dark:text-yellow-400"
          subtext="Minutes to respond"
        />

        <StatCard
          title="High Priority Queries"
          value={agentStats.highPriorityQueries}
          icon={AlertCircle}
          color="text-red-600 dark:text-red-400"
          subtext="Pending assignment"
        />
      </div> */}

      {/* Priority & QA Metrics (feedback removed) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="High Priority Queries"
          value={agentStats.highPriorityQueries}
          icon={AlertCircle}
          color="text-red-600 dark:text-red-400"
          subtext="Pending assignment"
        />

        <StatCard
          title="QA Approval Rate"
          value={`${qaStats.approvalRate}%`}
          icon={CheckCircle}
          color="text-green-600 dark:text-green-400"
          subtext="Of reviewed items"
        />

        <StatCard
          title="QA Tickets Reviewed"
          value={qaStats.totalTicketsReviewed}
          icon={BarChart3}
          color="text-purple-600 dark:text-purple-400"
          subtext="Total processed"
        />
      </div> */}

      {/* Queries Stats Tab */}
      {activeTab === 'queries' && (
        <>
          {/* Refresh Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Query Statistics</h2>
            <button
              onClick={handleRefreshQueryStats}
              disabled={isRefreshingQuery}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              <RefreshCw size={18} className={isRefreshingQuery ? 'animate-spin' : ''} />
              <span>{isRefreshingQuery ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {(statsLoading || isRefreshingQuery) ? (
            /* Beautiful Loading Skeleton for Query Stats */
            <div className="space-y-4 animate-pulse">
              {/* Conversations Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-50">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-1/3"></div>
                  </div>
                ))}
              </div>

              {/* Agent Status Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-50">
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-1/3"></div>
                  </div>
                ))}
              </div>

              {/* SLA Performance Skeleton */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 bg-gray-400 dark:bg-gray-500 rounded w-1/4"></div>
                  <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 mx-auto w-3/4"></div>
                      <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded w-1/2 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation Trends Skeleton */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 backdrop-blur-sm bg-opacity-50">
                <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Open Conversations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Open</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.openQueries || 0}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Awaiting Response</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.awaitingResponse || 0}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Unassigned</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.totalPendingQueries || 0}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Pending</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.pendingQueries || 0}</div>
            </div>
          </div>

          {/* Agent Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Online</h3>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{systemHealth.activeAgents || 0}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Offline</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.max(0, (systemHealth.agentCount || 0) - (systemHealth.activeAgents || 0))}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Away</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.activityStatus?.onBreak || 0}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
              <h3 className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Reassigning</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">0</div>
            </div>
          </div>

          {/* SLA Performance Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">SLA Performance (Last 30 days)</h3>
              <select className="px-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white">
                <option>Last 30 days</option>
                <option>Last 7 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            
            {/* SLA Metrics - Single Row */}
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">First Response Met</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">First Response Breached</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Response Met</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Response Breached</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolution Met</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolution Breached</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg First Response Time</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0s</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Next Response Time</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0s</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Resolution Time</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">0s</div>
              </div>
            </div>
          </div>

          {/* Conversation Trends */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conversation Trends</h3>
              <select className="px-4 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white">
                <option>Last 90 days</option>
                <option>Last 30 days</option>
                <option>Last 7 days</option>
              </select>
            </div>
            
            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overallStats.conversationTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="date" stroke={chartColors.text} />
                  <YAxis stroke={chartColors.text} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="new" stroke="#cbd5e1" strokeWidth={2} name="New conversations" />
                  <Line type="monotone" dataKey="resolved" stroke="#06b6d4" strokeWidth={2} name="Resolved conversations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">New conversations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Resolved conversations</span>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatCard
              title="Total Queries"
              value={overallStats.totalQueries || 0}
              icon={HelpCircle}
              color="text-purple-600 dark:text-purple-400"
              subtext="All customer inquiries"
            />
            <StatCard
              title="Resolved Queries"
              value={overallStats.resolvedQueries || 0}
              icon={CheckCircle}
              color="text-green-600 dark:text-green-400"
              subtext={`${
                overallStats.totalQueries > 0
                  ? Math.round((overallStats.resolvedQueries / overallStats.totalQueries) * 100)
                  : 0
              }% resolution rate`}
            />
            <StatCard
              title="Avg Response Time"
              value={`${agentStats.avgResponseTime || 0}m`}
              icon={Clock}
              color="text-blue-600 dark:text-blue-400"
              subtext="Team average"
            />
          </div>
            </>
          )}
        </>
      )}

      {/* Email Ticket Stats Tab */}
      {activeTab === 'tickets' && (
        <>
              {/* Refresh Button */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Ticket Statistics</h2>
                <button
                  onClick={handleRefreshTicketStats}
                  disabled={isRefreshingTicket}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  <RefreshCw size={18} className={isRefreshingTicket ? 'animate-spin' : ''} />
                  <span>{isRefreshingTicket ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>

              {(ticketStatsLoading || isRefreshingTicket) ? (
                /* Beautiful Loading Skeleton for Email Tickets */
                <div className="space-y-4 animate-pulse">
                  {/* Top Row Skeleton */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                        <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>

                  {/* Second Row Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-1"></div>
                          </div>
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Priority Breakdown Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                            <div className="h-6 bg-gray-400 dark:bg-gray-500 rounded w-1/3"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                        <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-4"></div>
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* Large Chart Skeleton */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-50">
                        <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mb-4"></div>
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Top Row - Compact Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {/* CSAT - Compact */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">CSAT this month</h3>
                  <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{ticketStats.csatScore || 0}%</div>
                </div>
                
                {/* Avg Response Time */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Avg Response Time</h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{agentStatsTicket.avgFirstResponseTime || agentStatsTicket.avgResponseTime || 0}<span className="text-lg">m</span></div>
                </div>
                
                {/* Resolution Time */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Avg Resolution Time</h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{agentStatsTicket.avgResolutionTime || 0}<span className="text-lg">h</span></div>
                </div>
                
                {/* Unassigned Tickets */}
                <div className="relative bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Unassigned tickets</h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{ticketData.unassigned || 0}</div>
                  {(ticketData.unassigned || 0) > 20 && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="text-white" size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Second Row - Ticket Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard
                  title="Total Tickets"
                  value={ticketData.total || 0}
                  icon={Mail}
                  color="text-blue-600 dark:text-blue-400"
                  subtext="All email tickets"
                />
                <StatCard
                  title="Open Tickets"
                  value={ticketData.open || 0}
                  icon={AlertCircle}
                  color="text-orange-600 dark:text-orange-400"
                  subtext="Awaiting response"
                />
                <StatCard
                  title="In Progress"
                  value={ticketData.inProgress || 0}
                  icon={Clock}
                  color="text-yellow-600 dark:text-yellow-400"
                  subtext="Being worked on"
                />
                <StatCard
                  title="Resolved Today"
                  value={agentStatsTicket.resolvedToday || 0}
                  icon={CheckCircle}
                  color="text-green-600 dark:text-green-400"
                  subtext="Successfully closed"
                />
              </div>

              {/* Third Row - Priority Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">High Priority</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{priorityStats.high || 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Urgent tickets requiring immediate attention</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <Info size={20} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">Medium Priority</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{priorityStats.medium || 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Standard tickets with normal processing</div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircle size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xs text-gray-500 dark:text-gray-400">Low Priority</h3>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{priorityStats.low || 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Low urgency tickets can be processed later</div>
                </div>
              </div>

              {/* Fourth Row - Top Performers and Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Top Ticket Solvers */}
                <TopPerformersList 
                  title="Top ticket solvers this week"
                  data={topAgentSolvers}
                  scoreKey="count"
                />
                
                {/* Tickets by Status */}
                <StatusBarChart 
                  title="Tickets by status this week"
                  data={[
                    { name: 'Open', value: ticketData.open || 0, color: '#3b82f6' },
                    { name: 'Pending', value: ticketData.pending || 0, color: '#f59e0b' },
                    { name: 'Resolved', value: ticketData.resolved || 0, color: '#10b981' },
                    { name: 'Closed: Resolved', value: ticketData.closed || 0, color: '#14b8a6' },
                  ]}
                />

                {/* QA This Week */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">QA this week</h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Avg. team score</h3>
                    <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{qaStats.approvalRate || 0}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quality assurance</div>
                  </div>
                </div>
              </div>

              {/* Fifth Row - Ticket Volume Chart and Agent Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Ticket Volume Line Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Ticket volume this week</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ticketVolumeData}>
                      <defs>
                        <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                      <XAxis dataKey="day" stroke={chartColors.text} />
                      <YAxis stroke={chartColors.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: isDark ? '#e5e7eb' : '#1f2937',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#14b8a6" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#ticketGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent Scores */}
                <AgentScoresList 
                  title="Agent scores"
                  data={agentScoresData}
                />
              </div>

              {/* Widget User Stats */}
              {ticketStats.widgetUserStats && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={18} className="text-teal-600 dark:text-teal-400" />
                    Widget User Activity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                      <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mb-1.5">Total Widget Users</p>
                      <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                        {ticketStats.widgetUserStats.totalUsers || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mb-1.5">Active Users (24h)</p>
                      <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                        {ticketStats.widgetUserStats.activeUsersLast24Hours || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1.5">New Users (7d)</p>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {ticketStats.widgetUserStats.newUsersLast7Days || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Status Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Agent Activity Details */}
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
            Agent Team Activity Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Currently Active</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Working on queries</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {agentStats.activityStatus?.currentlyActive || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">On Break</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Taking a break</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {agentStats.activityStatus?.onBreak || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Offline</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Not logged in</p>
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {agentStats.activityStatus?.offline || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Avg Active Time</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Per agent</p>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {agentStats.activityStatus?.avgActiveTime || '0h 0m'}
              </p>
            </div>
          </div>
        </div>

        {/* QA Activity Details */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-amber-600 dark:text-amber-400" />
            QA Team Activity Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Currently Active</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Reviewing tickets</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {qaStats.activityStatus?.currentlyActive || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">On Break</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Taking a break</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {qaStats.activityStatus?.onBreak || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Offline</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Not logged in</p>
              </div>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {qaStats.activityStatus?.offline || 0}
              </p>
            </div>

            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Avg Active Time</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Per QA member</p>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {qaStats.activityStatus?.avgActiveTime || '0h 0m'}
              </p>
            </div>
          </div>
                </div>
              </div>

              {/* User Availability */}
              <div className="mb-4">
        <ChartContainer title="Overall User Availability">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userAvailabilityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userAvailabilityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDark ? '#e2e8f0' : '#1f2937',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
              </div>
                </>
              )}
        </>
      )}

      {/* Communication Channels */}
      {/* <div className="mb-8">
        <ChartContainer title="Communication Channels Overview">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={communicationData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis dataKey="name" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  border: isDark ? '1px solid #475569' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: isDark ? '#e2e8f0' : '#1f2937',
                }}
              />
              <Bar dataKey="value" fill={chartColors.line} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div> */}

      {/* Individual Agent Performance Cards */}
      {/* <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Users size={24} className="text-blue-600 dark:text-blue-400" />
          Agent Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentStats.topAgents && agentStats.topAgents.length > 0 ? (
            agentStats.topAgents.slice(0, 6).map((agent, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{agent.email}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {agent.status || 'offline'}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Resolved Today</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{agent.resolvedToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{agent.avgResponseTime}m</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Active Chats</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{agent.activeChats}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-600 dark:text-gray-400">
              Loading agent performance data...
            </div>
          )}
        </div>
      </div> */}

      {/* Individual QA Performance Cards */}
      {/* <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <CheckCircle size={24} className="text-amber-600 dark:text-amber-400" />
          QA Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qaStats.topQA && qaStats.topQA.length > 0 ? (
            qaStats.topQA.slice(0, 6).map((qa, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{qa.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{qa.email}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {qa.status || 'offline'}
                  </span>
                </div>

                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Approved Today</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{qa.approvedToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Approval Rate</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{qa.approvalRate}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Pending Reviews</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{qa.pendingReviews}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Escalations</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{qa.escalationsHandled}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-gray-600 dark:text-gray-400">
              Loading QA performance data...
            </div>
          )}
        </div>
      </div> */}

      {/* System Summary Cards */}
      {(activeTab === 'agents' || activeTab === 'queries') && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-slate-700 backdrop-blur-sm mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600 dark:text-blue-400" />
            System Summary & KPIs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">Query Resolution Rate</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {overallStats.totalQueries > 0
                  ? Math.round((overallStats.resolvedQueries / overallStats.totalQueries) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {overallStats.resolvedQueries} of {overallStats.totalQueries} resolved
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-2">System Availability</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {systemHealth.totalUsers > 0
                  ? Math.round((systemHealth.activeUsers / systemHealth.totalUsers) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                {systemHealth.activeUsers} of {systemHealth.totalUsers} online
              </p>
            </div>

            {/* Removed Avg Customer Rating card (customer feedback not required) */}

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-2">QA Approval Rate</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {qaStats.approvalRate || 0}%
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                {qaStats.approvedToday || 0} approved today
              </p>
            </div>

            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold mb-2">Avg Response Time</p>
              <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {agentStats.avgResponseTime || 0}m
              </p>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">
                Agent team average
              </p>
            </div>

            {/* Calls Made Today card removed */}

            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Emails Sent Today</p>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                {agentStats.emailsSent || 0}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3">
                Agent team total
              </p>
            </div>

            <div className="p-5 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold mb-3">High Priority Queries</p>
              <p className="text-3xl font-bold text-teal-700 dark:text-teal-300">
                {agentStats.highPriorityQueries || 0}
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-3">
                Pending assignment
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
