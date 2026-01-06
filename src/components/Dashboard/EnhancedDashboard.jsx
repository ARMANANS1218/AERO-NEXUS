import React, { useContext } from 'react';
import { 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mail,
  TrendingUp,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ColorModeContext from '../../context/ColorModeContext';
import RecentEscalations from '../Escalations/RecentEscalations';
import { useGetAgentFeedbackQuery } from '../../features/dashboard/dashboardApi';
import { CircularProgress } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function EnhancedDashboard({ userRole = 'Agent', dashboardStats = {}, weeklyData = [] }) {
  const colorMode = useContext(ColorModeContext);
  const isDark = colorMode?.mode === 'dark';

  // Fetch feedback data only for agents
  const { data: feedbackData, isLoading: feedbackLoading } = useGetAgentFeedbackQuery(undefined, {
    skip: userRole !== 'Agent',
  });

  // Debug: Log feedback data
  React.useEffect(() => {
    console.log('=== FEEDBACK DATA DEBUG ===');
    console.log('Full API Response:', feedbackData);
    console.log('Data nested object:', feedbackData?.data);
    if (feedbackData?.data) {
      console.log('Trend Array:', feedbackData.data.trend);
      console.log('Trend Length:', feedbackData.data.trend?.length);
      feedbackData.data.trend?.forEach((day, idx) => {
        console.log(`  ${idx}. ${day.day} (${day.date}): ${day.avgRating} ⭐`);
      });
      console.log('Overall Average:', feedbackData.data.overallAverage);
      console.log('Total Feedback Count:', feedbackData.data.totalFeedbackCount);
    }
    console.log('=========================');
  }, [feedbackData]);

  const stats = dashboardStats || {};
  const feedback = feedbackData?.data || {};

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

      {/* Split Layout for Agent - Left: Main Dashboard, Right: Feedback */}
      {userRole === 'Agent' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Main Dashboard (Wider - 8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <StatCard 
                icon={<CheckCircle className="w-6 h-6" />}
                label="Resolved Today"
                value={stats.resolvedToday || 0}
                color="green"
                isDark={isDark}
              />
              <StatCard 
                icon={<TrendingUp className="w-6 h-6" />}
                label="Total Resolved"
                value={stats.totalResolvedQueries || 0}
                color="blue"
                isDark={isDark}
              />
              <StatCard 
                icon={<AlertCircle className="w-6 h-6" />}
                label="Pending Queries"
                value={stats.pendingQueries || 0}
                color="amber"
                isDark={isDark}
              />
              <StatCard 
                icon={<MessageCircle className="w-6 h-6" />}
                label="Active Chats"
                value={stats.activeChats || 0}
                color="indigo"
                isDark={isDark}
              />
            </div>

            {/* Performance Summary */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Performance Summary
              </h3>
              <div className="space-y-3">
                <SummaryRow 
                  label="Total Queries Handled" 
                  value={stats.totalResolvedQueries || 0}
                  isDark={isDark}
                />
                {/* <SummaryRow 
                  label="High Priority Queries"
                  value={stats.highPriorityQueries || 0}
                  isDark={isDark}
                /> */}
              </div>
            </div>

            {/* Weekly Performance Chart */}
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Weekly Performance
              </h3>
              {weeklyData && weeklyData.length > 0 ? (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                  <Bar
                    data={{
                      labels: weeklyData.map(item => item.day),
                      datasets: [
                        {
                          label: 'Queries Resolved',
                          data: weeklyData.map(item => item.value || 0),
                          backgroundColor: weeklyData.map((item, index) => {
                            const value = item.value || 0;
                            if (value === 0) return isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.8)';
                            return isDark 
                              ? `rgba(59, 130, 246, ${0.5 + (index * 0.08)})` 
                              : `rgba(37, 99, 235, ${0.5 + (index * 0.08)})`;
                          }),
                          borderColor: weeklyData.map(item => {
                            const value = item.value || 0;
                            if (value === 0) return isDark ? 'rgba(75, 85, 99, 0.8)' : 'rgba(209, 213, 219, 1)';
                            return isDark ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)';
                          }),
                          borderWidth: 2,
                          borderRadius: 8,
                          borderSkipped: false,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart',
                        delay: (context) => {
                          return context.dataIndex * 100;
                        }
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          labels: {
                            color: isDark ? '#d1d5db' : '#374151',
                            font: {
                              size: 12,
                              weight: 500
                            },
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        },
                        tooltip: {
                          backgroundColor: isDark ? '#1f2937' : '#fff',
                          titleColor: isDark ? '#fff' : '#111827',
                          bodyColor: isDark ? '#d1d5db' : '#374151',
                          borderColor: isDark ? '#374151' : '#e5e7eb',
                          borderWidth: 1,
                          padding: 12,
                          displayColors: true,
                          callbacks: {
                            label: function(context) {
                              const value = context.parsed.y;
                              return `Resolved: ${value} ${value === 1 ? 'query' : 'queries'}`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 5,
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 11
                            }
                          },
                          grid: {
                            color: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
                            drawBorder: false
                          }
                        },
                        x: {
                          ticks: {
                            color: isDark ? '#9ca3af' : '#6b7280',
                            font: {
                              size: 11,
                              weight: 500
                            }
                          },
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                    height={250}
                  />
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>No weekly performance data available</p>
                </div>
              )}
            </div>

            {/* Customer Feedback Chart - Simplified to Show Data */}
            {feedbackLoading ? (
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex justify-center items-center py-8">
                  <CircularProgress size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            ) : feedbackData && feedbackData.status && feedbackData.data ? (
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Customer Feedback (Last 7 Days)
                  </h3>
                  {feedbackData.data.overallAverage > 0 && (
                    <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <span className={`text-sm font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        Overall: {feedbackData.data.overallAverage} ⭐
                      </span>
                    </div>
                  )}
                </div>
                {feedbackData.data.trend && feedbackData.data.trend.length > 0 ? (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    {/* Bar Chart - Daily Average Rating */}
                    <Bar
                      data={{
                        labels: feedbackData.data.trend.map(d => d.day),
                        datasets: [
                          {
                            label: 'Average Customer Rating',
                            data: feedbackData.data.trend.map(d => d.avgRating || 0),
                            backgroundColor: feedbackData.data.trend.map(d => 
                              d.avgRating ? (isDark ? 'rgba(59, 130, 246, 0.9)' : 'rgba(37, 99, 235, 0.9)') : (isDark ? 'rgba(107, 114, 128, 0.4)' : 'rgba(209, 213, 219, 0.6)')
                            ),
                            borderColor: feedbackData.data.trend.map(d => 
                              d.avgRating ? (isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)') : (isDark ? 'rgb(107, 114, 128)' : 'rgb(156, 163, 175)')
                            ),
                            borderWidth: 2,
                            borderRadius: 8,
                            barThickness: 50,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        animation: {
                          duration: 1500,
                          easing: 'easeInOutQuart',
                          delay: (context) => context.dataIndex * 80,
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            labels: {
                              color: isDark ? '#e5e7eb' : '#374151',
                              font: {
                                size: 14,
                                weight: 600
                              },
                              padding: 20,
                              usePointStyle: true,
                              pointStyle: 'rectRounded',
                            }
                          },
                          tooltip: {
                            enabled: true,
                            backgroundColor: isDark ? '#1f2937' : '#fff',
                            titleColor: isDark ? '#fff' : '#111827',
                            bodyColor: isDark ? '#d1d5db' : '#374151',
                            borderColor: isDark ? '#4b5563' : '#e5e7eb',
                            borderWidth: 2,
                            padding: 16,
                            displayColors: true,
                            titleFont: {
                              size: 14,
                              weight: 'bold'
                            },
                            bodyFont: {
                              size: 13
                            },
                            callbacks: {
                              title: function(context) {
                                return context[0].label + ' - Customer Feedback';
                              },
                              label: function(context) {
                                const value = context.parsed.y;
                                if (!value || value === 0) {
                                  return 'No feedback received';
                                }
                                return `Average Rating: ${value.toFixed(2)} ⭐ out of 5`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            min: 0,
                            max: 5,
                            ticks: {
                              stepSize: 1,
                              color: isDark ? '#9ca3af' : '#6b7280',
                              font: { 
                                size: 13,
                                weight: 600
                              },
                              callback: function(value) {
                                return value + ' ⭐';
                              }
                            },
                            grid: {
                              color: isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(229, 231, 235, 0.8)',
                              drawBorder: false,
                              lineWidth: 1,
                            },
                            title: {
                              display: true,
                              text: 'Rating (out of 5)',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              font: {
                                size: 12,
                                weight: 600
                              }
                            }
                          },
                          x: {
                            ticks: {
                              color: isDark ? '#e5e7eb' : '#111827',
                              font: { 
                                size: 14,
                                weight: 700
                              }
                            },
                            grid: {
                              display: false,
                              drawBorder: false
                            },
                            title: {
                              display: true,
                              text: 'Day of Week',
                              color: isDark ? '#9ca3af' : '#6b7280',
                              font: {
                                size: 12,
                                weight: 600
                              }
                            }
                          }
                        }
                      }}
                      height={320}
                    />
                  </div>
                ) : (
                  <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>No feedback data in last 7 days</p>
                    <p className="text-xs mt-2">Total feedback received: {feedbackData.data.totalFeedbackCount || 0}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>No feedback data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Customer Feedback (Thinner - 4 columns) */}
          <div className="lg:col-span-4">
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm sticky top-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Customer Feedback
              </h3>
              
              {feedbackLoading ? (
                <div className="flex justify-center items-center py-8">
                  <CircularProgress size={32} className="text-blue-600 dark:text-blue-400" />
                </div>
              ) : feedbackData && feedbackData.data && feedbackData.data.recentFeedback && feedbackData.data.recentFeedback.length > 0 ? (
                <div className="space-y-4">
                  {/* Recent Feedback Items */}
                  {feedbackData.data.recentFeedback.slice(0, 5).map((item, index) => {
                    const timeAgo = item.submittedAt 
                      ? Math.floor((new Date() - new Date(item.submittedAt)) / 60000) 
                      : 0;
                    const timeText = timeAgo < 60 
                      ? `${timeAgo} minute${timeAgo !== 1 ? 's' : ''} ago`
                      : timeAgo < 1440
                      ? `${Math.floor(timeAgo / 60)} hour${Math.floor(timeAgo / 60) !== 1 ? 's' : ''} ago`
                      : `${Math.floor(timeAgo / 1440)} day${Math.floor(timeAgo / 1440) !== 1 ? 's' : ''} ago`;

                    return (
                      <div key={index} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`text-lg ${star <= (item.rating || 0) ? 'text-yellow-500' : 'text-gray-400'}`}>
                                {star <= (item.rating || 0) ? '⭐' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item.rating}/5
                          </span>
                        </div>
                        <span className={`text-xs block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {timeText}
                        </span>
                        {item.comment && (
                          <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'} italic`}>
                            "{item.comment}"
                          </p>
                        )}
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          Customer: {item.customerName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-sm">No customer feedback available yet</p>
                  <p className="text-xs mt-2">Feedback will appear here once customers rate your service</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* QA/TL Dashboard Layout (unchanged) */
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-8">
            <StatCard 
              icon={<CheckCircle className="w-6 h-6" />}
              label={userRole === 'TL' ? 'Team Approved Today' : 'Approved Today'}
              value={stats.resolvedToday || 0}
              color="green"
              isDark={isDark}
            />
            <StatCard 
              icon={<TrendingUp className="w-6 h-6" />}
              label="Total Resolved"
              value={stats.totalResolvedQueries || 0}
              color="blue"
              isDark={isDark}
            />
            <StatCard 
              icon={<AlertCircle className="w-6 h-6" />}
              label={userRole === 'TL' ? 'Team Pending Reviews' : 'Pending Reviews'}
              value={stats.pendingQueries || 0}
              color="amber"
              isDark={isDark}
            />
            <StatCard 
              icon={<MessageCircle className="w-6 h-6" />}
              label={userRole === 'TL' ? 'Team Active Reviews' : 'Active Reviews'}
              value={stats.activeChats || 0}
              color="indigo"
              isDark={isDark}
            />
          </div>

          {/* Additional Activity Stats - Only for QA/TL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-6 mb-8">
            <ActivityCard 
              icon={<Mail className="w-5 h-5" />}
              label={userRole === 'TL' ? 'Team Reviewed Today' : 'Reviewed Today'}
              value={stats.queriesReviewedToday || 0}
              color="blue"
              isDark={isDark}
            />
            <ActivityCard 
              icon={<Clock className="w-5 h-5" />}
              label={userRole === 'TL' ? 'Team Total Processed' : 'Total Processed'}
              value={stats.totalTicketsProcessed || 0}
              color="purple"
              isDark={isDark}
            />
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
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
                  label={userRole === 'TL' ? 'Team Approval Rate' : 'Approval Rate'}
                  value={`${stats.approvalRate || 0}%`}
                  isDark={isDark}
                />
              </div>
            </div>
          </div>

          {/* Recent Escalations for QA/TL */}
          <div className="mb-8">
            <RecentEscalations limit={8} isDark={isDark} />
          </div>

          {/* Weekly Performance Chart */}
          {weeklyData && weeklyData.length > 0 && (
            <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Weekly Reviews
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
        </>
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
