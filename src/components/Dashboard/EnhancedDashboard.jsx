import React, { useContext } from 'react';
import { 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mail,
  TrendingUp,
} from 'lucide-react';
import ColorModeContext from '../../context/ColorModeContext';
import RecentEscalations from '../Escalations/RecentEscalations';

export default function EnhancedDashboard({ userRole = 'Agent', dashboardStats = {}, weeklyData = [] }) {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const stats = dashboardStats || {};

  return (
    <div className="p-2 md:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {userRole === 'Agent' ? 'Agent Dashboard' : userRole === 'TL' ? 'TL Dashboard' : 'QA Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {userRole === 'Agent'
            ? "Track your performance, queries, and customer feedback"
            : userRole === 'TL'
              ? "TL Overview - Team performance and customer feedback"
              : "Quality Assurance Overview - Your performance and customer feedback"}
        </p>
      </div>

      {/* Main Stats Grid - Same for both Agent and QA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
        {/* Resolved/Approved Today */}
        <StatCard 
          icon={<CheckCircle className="w-6 h-6" />}
          label={userRole === 'Agent' ? 'Resolved Today' : userRole === 'TL' ? 'Team Approved Today' : 'Approved Today'}
          value={stats.resolvedToday || 0}
          color="green"
          isDark={isDark}
        />

        {/* Total Resolved */}
        <StatCard 
          icon={<TrendingUp className="w-6 h-6" />}
          label="Total Resolved"
          value={stats.totalResolvedQueries || 0}
          color="blue"
          isDark={isDark}
        />

        {/* Pending Queries/Items */}
        <StatCard 
          icon={<AlertCircle className="w-6 h-6" />}
          label={userRole === 'Agent' ? 'Pending Queries' : userRole === 'TL' ? 'Team Pending Reviews' : 'Pending Reviews'}
          value={stats.pendingQueries || 0}
          color="amber"
          isDark={isDark}
        />

        {/* Active Chats/Items */}
        <StatCard 
          icon={<MessageCircle className="w-6 h-6" />}
          label={userRole === 'Agent' ? 'Active Chats' : userRole === 'TL' ? 'Team Active Reviews' : 'Active Reviews'}
          value={stats.activeChats || 0}
          color="indigo"
          isDark={isDark}
        />
      </div>

      {/* Additional Activity Stats (calls removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-6 mb-8">
        {/* Emails / Reviews */}
        <ActivityCard 
          icon={<Mail className="w-5 h-5" />}
          label={userRole === 'Agent' ? 'Emails Sent' : userRole === 'TL' ? 'Team Reviewed Today' : 'Reviewed Today'}
          value={userRole === 'Agent' ? (stats.emailsSent || 0) : (stats.queriesReviewedToday || 0)}
          color="blue"
          isDark={isDark}
        />

        {/* Response / Processed */}
        <ActivityCard 
          icon={<Clock className="w-5 h-5" />}
          label={userRole === 'Agent' ? 'Avg Response (m)' : userRole === 'TL' ? 'Team Total Processed' : 'Total Processed'}
          value={userRole === 'Agent' ? `${stats.avgResponseTime || 0}m` : (stats.totalTicketsProcessed || 0)}
          color="purple"
          isDark={isDark}
        />
      </div>

      {/* Performance Summary (Feedback removed per requirement) */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Performance Summary
          </h3>

          <div className="space-y-3">
            <SummaryRow 
              label="Total Queries Handled" 
              value={stats.totalResolvedQueries || 0}
              isDark={isDark}
            />
            <SummaryRow 
              label={userRole === 'Agent' ? 'High Priority Queries' : userRole === 'TL' ? 'Team Approval Rate' : 'Approval Rate'}
              value={userRole === 'Agent' ? (stats.highPriorityQueries || 0) : `${stats.approvalRate || 0}%`}
              isDark={isDark}
            />
            {/* Call duration removed per requirement */}
          </div>
        </div>
      </div>

      {/* Recent Escalations for QA/TL */}
      {['QA', 'TL'].includes(userRole) && (
        <div className="mb-8">
          <RecentEscalations limit={8} isDark={isDark} />
        </div>
      )}

      {/* Weekly Performance Chart if available */}
      {weeklyData && weeklyData.length > 0 && (
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {['QA', 'TL'].includes(userRole) ? 'Weekly Reviews' : 'Weekly Performance'}
          </h3>

          <div className="space-y-2">
            {weeklyData.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day.day}
                </span>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div className={`h-2 rounded-full flex-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${Math.min((day.value / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} w-8 text-right`}>
                    {day.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color, isDark }) {
  const colorMap = {
    blue: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600',
    green: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600',
    amber: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600',
    red: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600',
    indigo: isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
    purple: isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600',
  };

  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <h3 className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-full ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ icon, label, value, color, isDark }) {
  const colorMap = {
    green: isDark ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-300',
    blue: isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-300',
    purple: isDark ? 'bg-purple-900/20 border-purple-600' : 'bg-purple-50 border-purple-300',
    indigo: isDark ? 'bg-indigo-900/20 border-indigo-600' : 'bg-indigo-50 border-indigo-300',
    red: isDark ? 'bg-red-900/20 border-red-600' : 'bg-red-50 border-red-300',
  };

  return (
    <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <h3 className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </h3>
        </div>
        <div className={`p-2 rounded-full text-${color}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Summary Row Component
function SummaryRow({ label, value, isDark }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
