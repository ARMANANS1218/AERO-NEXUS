import React, { useState, useContext } from 'react';
import { CircularProgress } from '@mui/material';
import {
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
  ThumbsUp,
} from 'lucide-react';
import { useGetQAPerformanceListQuery } from '../../../features/admin/adminApi';
import ColorModeContext from '../../../context/ColorModeContext';

const QAPerformanceCard = ({ qa, stats, feedbackDetails, isDark }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    break: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-300">
                {qa.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {qa.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{qa.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[qa.status || 'offline']}`}>
              {qa.status || 'offline'}
            </span>
          </div>

          <div className="flex items-center gap-2 mr-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.avgFeedbackRating} ⭐
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stats.feedbackCount} reviews
              </p>
            </div>
            {expanded ? (
              <ChevronUp size={24} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown size={24} className="text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.approvedToday}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Approved Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.rejectedToday}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Rejected Today</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pendingReviews}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.approvalRate}%
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Approval Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.escalationsHandled}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Escalations</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-6 bg-gray-50 dark:bg-slate-700/50 space-y-6">
          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-1">
                Total Tickets Reviewed
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.ticketsReviewed}
              </p>
            </div>

            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-1">
                Avg Review Time
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.avgReviewTime}m
              </p>
            </div>

            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-1">
                Total Escalations
              </p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.escalationsHandled}
              </p>
            </div>
          </div>

          {/* Feedback Section */}
          {feedbackDetails && feedbackDetails.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-600 dark:text-yellow-400" />
                Customer Feedback ({feedbackDetails.length})
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {feedbackDetails.map((feedback, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {feedback.customerName || 'Anonymous'}
                      </p>
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                        {feedback.feedbackRating} ⭐
                      </span>
                    </div>
                    {feedback.feedbackComment && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        "{feedback.feedbackComment}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(feedback.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!feedbackDetails || feedbackDetails.length === 0) && (
            <div className="p-6 text-center bg-gray-100 dark:bg-slate-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">No customer feedback available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const QAPerformance = () => {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  const { data: performanceData, isLoading } = useGetQAPerformanceListQuery();
  const qaMembers = performanceData?.data || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <CircularProgress className="text-amber-600 dark:text-amber-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading QA performance data...</p>
        </div>
      </div>
    );
  }

  const totalApprovedToday = qaMembers.reduce((sum, q) => sum + q.stats.approvedToday, 0);
  const totalRejectedToday = qaMembers.reduce((sum, q) => sum + q.stats.rejectedToday, 0);
  const avgApprovalRate = qaMembers.length > 0 
    ? (qaMembers.reduce((sum, q) => sum + q.stats.approvalRate, 0) / qaMembers.length).toFixed(1)
    : 0;
  const avgRating = qaMembers.length > 0 
    ? (qaMembers.reduce((sum, q) => sum + q.stats.avgFeedbackRating, 0) / qaMembers.length).toFixed(2)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 p-2 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
          QA Team Performance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Individual performance metrics and customer feedback for all QA members
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Total QA Members
          </p>
          <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
            {qaMembers.length}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Avg Approval Rate (Actual Data)
          </p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {avgApprovalRate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Total Approved Today
          </p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {totalApprovedToday}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Avg Feedback Rating (Actual Data)
          </p>
          <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
            {avgRating} ⭐
          </p>
        </div>
      </div>

      {/* Individual QA Member Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 size={24} />
          Individual QA Member Details
        </h2>
        {qaMembers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="text-gray-600 dark:text-gray-400">No QA members found.</p>
          </div>
        ) : (
          qaMembers.map((qaData, idx) => (
            <QAPerformanceCard
              key={idx}
              qa={qaData.qa}
              stats={qaData.stats}
              feedbackDetails={qaData.feedbackDetails}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default QAPerformance;
