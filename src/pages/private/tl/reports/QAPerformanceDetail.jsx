import React, { useState, useMemo } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { ChevronDown, ChevronUp, FileDown, Calendar, RefreshCw } from 'lucide-react';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import { toast } from 'react-toastify';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const QADetailCard = ({ qa, isDark, onDownloadPDF }) => {
  const [expanded, setExpanded] = useState(false);

  // Mock QA metrics (replace with real API data)
  const evaluations = Math.floor(Math.random() * 50) + 10;
  const avgScore = (Math.random() * 2 + 3).toFixed(1);
  const completionRate = Math.floor(Math.random() * 30) + 70;
  const feedbackGiven = Math.floor(Math.random() * 40) + 20;
  const activeHours = Math.floor(Math.random() * 8) + 4;

  const performanceData = [
    { name: 'Mon', evaluations: evaluations * 0.8, feedback: feedbackGiven * 0.7 },
    { name: 'Tue', evaluations: evaluations * 0.9, feedback: feedbackGiven * 0.9 },
    { name: 'Wed', evaluations: evaluations, feedback: feedbackGiven },
    { name: 'Thu', evaluations: evaluations * 1.1, feedback: feedbackGiven * 1.1 },
    { name: 'Fri', evaluations: evaluations * 0.95, feedback: feedbackGiven * 0.8 },
  ];

  const scoreDistribution = [
    { name: 'Excellent (4-5)', value: 45, fill: '#10b981' },
    { name: 'Good (3-4)', value: 35, fill: '#3b82f6' },
    { name: 'Fair (2-3)', value: 15, fill: '#f59e0b' },
    { name: 'Poor (<2)', value: 5, fill: '#ef4444' },
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
            src={qa.profileImage}
            alt={qa.name}
            className="w-12 h-12"
            sx={{ bgcolor: '#8b5cf6' }}
          >
            {qa.name?.charAt(0)}
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {qa.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {qa.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Evaluations</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {evaluations}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {avgScore}⭐
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Completion</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {completionRate}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Feedback</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {feedbackGiven}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              qa.is_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
            }`}>
              {qa.is_active ? 'Online' : 'Offline'}
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
          <div className="flex gap-3 mb-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPDF(qa, 'daily');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <FileDown size={16} />
              Daily Report PDF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPDF(qa, 'monthly');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Calendar size={16} />
              Monthly Report PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Stats */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Evaluations</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {evaluations}
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {avgScore}⭐
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {completionRate}%
                  </p>
                </div>

                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Hours</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {activeHours}h
                  </p>
                </div>
              </div>

              {/* Weekly Performance Chart */}
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Weekly Activity</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={performanceData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="evaluations" fill="#8b5cf6" />
                    <Bar dataKey="feedback" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h4>
              
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={scoreDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.value}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {scoreDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QAPerformanceDetail = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  const qaMembers = useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter(emp => emp.role === 'QA');
  }, [employeesData]);

  const filteredQA = useMemo(() => {
    let filtered = qaMembers.filter(qa =>
      qa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return b.is_active - a.is_active;
      return 0;
    });

    return filtered;
  }, [qaMembers, searchTerm, sortBy]);

  const handleDownloadPDF = async (qa, period) => {
    const toastId = toast.loading(`Generating ${period} PDF report for ${qa.name}...`);

    try {
      const now = new Date();
      let startDate, endDate;

      if (period === 'daily') {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else if (period === 'monthly') {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }

      const evaluations = Math.floor(Math.random() * 50) + 10;
      const avgScore = (Math.random() * 2 + 3).toFixed(1);
      const completionRate = Math.floor(Math.random() * 30) + 70;
      const feedbackGiven = Math.floor(Math.random() * 40) + 20;

      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>QA Performance Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #8b5cf6; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .qa-info { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
            .qa-info h2 { font-size: 28px; margin-bottom: 10px; }
            .qa-info p { font-size: 16px; opacity: 0.95; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .info-table td { padding: 14px 0; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
            .info-table td:first-child { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; }
            .info-table td:last-child { color: #1F2937; font-size: 16px; font-weight: 600; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 35px; }
            .metric-card { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 5px solid #8b5cf6; padding: 20px; border-radius: 8px; }
            .metric-card.green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981; }
            .metric-card.blue { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left-color: #3b82f6; }
            .metric-card.orange { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left-color: #f59e0b; }
            .metric-card h3 { color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; font-weight: 600; }
            .metric-card p { font-size: 32px; font-weight: bold; color: #1f2937; }
            .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; }
            .performance-summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .performance-summary p { margin: 10px 0; color: #374151; font-size: 15px; line-height: 1.8; }
            .performance-summary strong { color: #1f2937; font-weight: 600; }
            .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 10px; }
            .badge.daily { background: #dbeafe; color: #1e40af; }
            .badge.monthly { background: #fce7f3; color: #9f1239; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QA Performance Report</h1>
              <p>Quality Assurance Analysis - ${period.charAt(0).toUpperCase() + period.slice(1)} Report <span class="badge ${period}">${period.toUpperCase()}</span></p>
            </div>

            <div class="qa-info">
              <h2>${qa.name}</h2>
              <p>${qa.email} | Employee ID: ${qa.employee_id || 'N/A'}</p>
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
                <td>${period === 'daily' ? 'Daily QA Report' : 'Monthly QA Report'}</td>
              </tr>
              <tr>
                <td>QA Status:</td>
                <td>${qa.is_active ? '🟢 Online' : '🔴 Offline'}</td>
              </tr>
            </table>

            <h2 class="section-title">Performance Metrics</h2>
            <div class="metrics">
              <div class="metric-card">
                <h3>Total Evaluations</h3>
                <p>${evaluations}</p>
              </div>
              <div class="metric-card green">
                <h3>Average Score</h3>
                <p>${avgScore}⭐</p>
              </div>
              <div class="metric-card blue">
                <h3>Completion Rate</h3>
                <p>${completionRate}%</p>
              </div>
              <div class="metric-card orange">
                <h3>Feedback Given</h3>
                <p>${feedbackGiven}</p>
              </div>
            </div>

            <h2 class="section-title">Performance Summary</h2>
            <div class="performance-summary">
              <p><strong>Evaluation Activity:</strong> Completed ${evaluations} agent evaluations during this ${period} period.</p>
              <p><strong>Quality Score:</strong> Maintained an average evaluation score of ${avgScore} stars across all assessments.</p>
              <p><strong>Completion Efficiency:</strong> Achieved ${completionRate}% task completion rate with ${feedbackGiven} feedback entries.</p>
              <p><strong>Performance Status:</strong> ${parseFloat(avgScore) >= 4 ? '✅ Excellent Performance' : parseFloat(avgScore) >= 3 ? '⚠️ Good Performance' : '❌ Needs Improvement'}</p>
            </div>

            <div class="footer">
              <p>Report Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}</p>
              <p>© ${new Date().getFullYear()} CRM System - Professional QA Report (TL Panel)</p>
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
      link.download = `${qa.name.replace(/\s+/g, '_')}_QA_${period}_report_${format(now, 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: `${period.charAt(0).toUpperCase() + period.slice(1)} QA report downloaded successfully!`,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <CircularProgress className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            QA Performance Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View detailed QA performance metrics and download daily or monthly reports
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
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
            focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 
            bg-white dark:bg-slate-700 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
        >
          <option value="name">Sort by Name</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total QA Members</p>
          <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {qaMembers.length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Currently Active</p>
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {qaMembers.filter(qa => qa.is_active).length}
          </h3>
        </div>
        <div className="p-6 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Offline</p>
          <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">
            {qaMembers.filter(qa => !qa.is_active).length}
          </h3>
        </div>
      </div>

      {/* QA List */}
      <div className="space-y-4">
        {filteredQA.map((qa) => (
          <QADetailCard
            key={qa._id}
            qa={qa}
            onDownloadPDF={handleDownloadPDF}
          />
        ))}
      </div>

      {filteredQA.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No QA members found matching your search.
        </div>
      )}
    </div>
  );
};

export default QAPerformanceDetail;
