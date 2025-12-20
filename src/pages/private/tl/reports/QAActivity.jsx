import React, { useState, useEffect } from 'react';
import { CircularProgress, Avatar } from '@mui/material';
import { Clock, LogIn, LogOut, Coffee, Briefcase, FileDown, Calendar, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetAllEmployeesQuery } from '../../../../features/admin/adminApi';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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
  Filler
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

const QAActivity = () => {
  const { data: employeesData, isLoading, refetch } = useGetAllEmployeesQuery();
  const [filterDate, setFilterDate] = useState('today');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedQAId, setExpandedQAId] = useState(null);
  const [qaHistory, setQAHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Data refreshed successfully!');
  };

  const qaMembers = employeesData?.data?.filter(emp => emp.role === 'QA') || [];

  // Fetch 30-day history for a QA
  const fetch30DayHistory = async (qaId) => {
    if (qaHistory[qaId]) {
      // Already loaded, just toggle expand
      setExpandedQAId(expandedQAId === qaId ? null : qaId);
      return;
    }

    setLoadingHistory(prev => ({ ...prev, [qaId]: true }));
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${qaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.status && result.data) {
        setQAHistory(prev => ({ ...prev, [qaId]: result.data }));
        setExpandedQAId(qaId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory(prev => ({ ...prev, [qaId]: false }));
    }
  };

  const handleRowClick = (qaId) => {
    if (expandedQAId === qaId) {
      setExpandedQAId(null);
    } else {
      fetch30DayHistory(qaId);
    }
  };

  // Calculate real activity data from QA data
  const qaWithActivity = qaMembers.map(qa => {
    const loginTime = qa.login_time ? new Date(qa.login_time) : null;
    const now = new Date();
    
    // Calculate total break duration in minutes
    let totalBreakDuration = 0;
    let totalBreaks = 0;
    if (qa.breakLogs && qa.breakLogs.length > 0) {
      totalBreaks = qa.breakLogs.length;
      totalBreakDuration = qa.breakLogs.reduce((total, log) => {
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
      // No login time available
      logoutTime = null;
      activeTime = 0;
    } else if (qa.is_active) {
      // QA is currently ONLINE - calculate time from login to now
      logoutTime = null; // Show "-" since they haven't logged out yet
      const totalTimeInMs = now - loginTime;
      const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);
      
      // For active QAs, if on break, we still count total time minus completed breaks
      // The current break (if any) duration is already in breakLogs
      activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
    } else {
      // QA is OFFLINE - use logout_time if available
      logoutTime = qa.logout_time ? new Date(qa.logout_time) : null;
      
      if (logoutTime) {
        const totalTimeInMs = logoutTime - loginTime;
        const totalTimeInMinutes = Math.floor(totalTimeInMs / 60000);
        activeTime = Math.max(0, totalTimeInMinutes - totalBreakDuration);
      } else {
        // Offline but no logout_time - shouldn't happen but handle it
        activeTime = 0;
      }
    }
    
    // TODO: Get actual evaluationsCompleted from database
    const evaluationsCompleted = 0;
    
    return {
      ...qa,
      activity: {
        loginTime,
        logoutTime,
        totalBreaks,
        breakDuration: totalBreakDuration,
        activeTime,
        evaluationsCompleted
      }
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

  // Download individual QA PDF
  const handleDownloadQAPDF = async (qa, period) => {
    const toastId = toast.loading(`Generating ${qa.name}'s ${period} report...`);

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

      // Generate PDF HTML for individual QA
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${qa.name} - ${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #9333ea; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #9333ea; margin: 0; font-size: 32px; }
            .header h2 { color: #1f2937; margin: 10px 0 0 0; font-size: 24px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .info-section { background: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
            .info-row:last-child { border-bottom: none; }
            .info-label { font-weight: 600; color: #374151; }
            .info-value { color: #1f2937; font-weight: 500; }
            .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }
            .status-badge.active { background: #d1fae5; color: #065f46; }
            .status-badge.break { background: #fef3c7; color: #92400e; }
            .status-badge.offline { background: #f3f4f6; color: #374151; }
            .section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 30px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
            .activity-details { background: #f9fafb; padding: 20px; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #6b7280; font-size: 14px; display: flex; align-items: center; gap: 8px; }
            .detail-value { font-size: 18px; font-weight: 700; }
            .detail-value.green { color: #10b981; }
            .detail-value.purple { color: #9333ea; }
            .detail-value.amber { color: #f59e0b; }
            .detail-value.red { color: #ef4444; }
            .detail-value.blue { color: #3b82f6; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${qa.name}</h1>
              <h2>${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report</h2>
              <p>${periodLabel}</p>
            </div>

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Employee ID:</span>
                <span class="info-value">${qa.employee_id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${qa.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">${qa.role}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Current Status:</span>
                <span class="info-value">
                  <span class="status-badge ${qa.is_active ? (qa.workStatus === 'break' ? 'break' : 'active') : 'offline'}">
                    ${qa.is_active ? (qa.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline'}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Report Generated:</span>
                <span class="info-value">${format(now, 'dd MMM yyyy, hh:mm a')}</span>
              </div>
            </div>

            <h3 class="section-title">Activity Details</h3>
            <div class="activity-details">
              <div class="detail-row">
                <span class="detail-label">🔓 Login Time</span>
                <span class="detail-value green">${formatTime(qa.activity.loginTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🔒 Logout Time</span>
                <span class="detail-value red">${formatTime(qa.activity.logoutTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ Online Time</span>
                <span class="detail-value purple">${formatDuration(qa.activity.activeTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">✅ Evaluations Completed</span>
                <span class="detail-value blue">${qa.activity.evaluationsCompleted}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">☕ Total Breaks</span>
                <span class="detail-value">${qa.activity.totalBreaks}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏸️ Break Duration</span>
                <span class="detail-value amber">${formatDuration(qa.activity.breakDuration)}</span>
              </div>
            </div>

            <h3 class="section-title">Productivity Averages</h3>
            <div class="activity-details">
              <div class="detail-row">
                <span class="detail-label">📊 Daily Average</span>
                <span class="detail-value green">${formatDuration(qa.activity.activeTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📈 Weekly Average (Projected)</span>
                <span class="detail-value purple">${formatDuration(Math.round(qa.activity.activeTime * 7))}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📉 Monthly Average (Projected)</span>
                <span class="detail-value">${formatDuration(Math.round(qa.activity.activeTime * 30))}</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>Confidential Report</strong> - Generated by CRM System</p>
              <p>This report contains confidential information and is intended for internal use only.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(pdfHTML);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        toast.dismiss(toastId);
        toast.success(`${qa.name}'s ${period} report generated!`);
      }, 500);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleDownloadPDF = async (period) => {
    const toastId = toast.loading(`Generating ${period} QA activity report...`);

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
      const totalQA = qaWithActivity.length;
      const activeQA = qaWithActivity.filter(qa => qa.is_active).length;
      const onBreak = qaWithActivity.filter(qa => qa.workStatus === 'break').length;
      const offline = qaWithActivity.filter(qa => !qa.is_active).length;
      const avgActiveTime = Math.round(
        qaWithActivity.reduce((acc, qa) => acc + qa.activity.activeTime, 0) / totalQA
      );
      const totalEvaluations = qaWithActivity.reduce((acc, qa) => acc + qa.activity.evaluationsCompleted, 0);

      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>QA Activity Report - ${period}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #8b5cf6; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-bottom: 35px; }
            .summary-card { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-left: 5px solid #8b5cf6; padding: 20px; border-radius: 8px; text-align: center; }
            .summary-card.green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981; }
            .summary-card.orange { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left-color: #f59e0b; }
            .summary-card.gray { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left-color: #6b7280; }
            .summary-card.blue { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left-color: #3b82f6; }
            .summary-card h3 { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
            .summary-card p { font-size: 32px; font-weight: bold; color: #1f2937; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .info-table td { padding: 14px 0; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
            .info-table td:first-child { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; }
            .info-table td:last-child { color: #1F2937; font-size: 16px; font-weight: 600; }
            .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; }
            .activity-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .activity-table thead { background: #faf5ff; }
            .activity-table th { padding: 12px; text-align: left; font-size: 12px; color: #374151; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
            .activity-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .status-badge.active { background: #d1fae5; color: #065f46; }
            .status-badge.break { background: #fef3c7; color: #92400e; }
            .status-badge.offline { background: #f3f4f6; color: #374151; }
            .footer { margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
            .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 10px; }
            .badge.daily { background: #dbeafe; color: #1e40af; }
            .badge.monthly { background: #fce7f3; color: #9f1239; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>QA Activity Report</h1>
              <p>Quality Assurance Work Hours & Activity - ${period.charAt(0).toUpperCase() + period.slice(1)} Report <span class="badge ${period}">${period.toUpperCase()}</span></p>
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
                <td>${period === 'daily' ? 'Daily QA Activity Report' : 'Monthly QA Activity Report'}</td>
              </tr>
            </table>

            <h2 class="section-title">Activity Summary</h2>
            <div class="summary">
              <div class="summary-card green">
                <h3>Currently Online</h3>
                <p>${activeQA}</p>
              </div>
              <div class="summary-card orange">
                <h3>On Break</h3>
                <p>${onBreak}</p>
              </div>
              <div class="summary-card gray">
                <h3>Offline</h3>
                <p>${offline}</p>
              </div>
              <div class="summary-card blue">
                <h3>Avg Online Time</h3>
                <p>${formatDuration(avgActiveTime)}</p>
              </div>
              <div class="summary-card">
                <h3>Total Evaluations</h3>
                <p>${totalEvaluations}</p>
              </div>
            </div>

            <h2 class="section-title">QA Activity Details</h2>
            <table class="activity-table">
              <thead>
                <tr>
                  <th>QA Name</th>
                  <th>Status</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Online Time</th>
                  <th>Evaluations</th>
                  <th>Breaks</th>
                  <th>Break Duration</th>
                  <th>Daily Avg</th>
                  <th>Weekly Avg</th>
                  <th>Monthly Avg</th>
                </tr>
              </thead>
              <tbody>
                ${qaWithActivity.map(qa => `
                  <tr>
                    <td><strong>${qa.name}</strong><br/><small style="color: #6b7280;">${qa.email}</small></td>
                    <td>
                      <span class="status-badge ${qa.is_active ? (qa.workStatus === 'break' ? 'break' : 'active') : 'offline'}">
                        ${qa.is_active ? (qa.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline'}
                      </span>
                    </td>
                    <td>${formatTime(qa.activity.loginTime)}</td>
                    <td>${formatTime(qa.activity.logoutTime)}</td>
                    <td><strong style="color: #8b5cf6;">${formatDuration(qa.activity.activeTime)}</strong></td>
                    <td><strong style="color: #3b82f6;">${qa.activity.evaluationsCompleted}</strong></td>
                    <td>${qa.activity.totalBreaks}</td>
                    <td style="color: #f59e0b;"><strong>${formatDuration(qa.activity.breakDuration)}</strong></td>
                    <td style="color: #10b981;"><strong>${formatDuration(qa.activity.activeTime)}</strong></td>
                    <td style="color: #3b82f6;"><strong>${formatDuration(Math.round(qa.activity.activeTime * 7))}</strong></td>
                    <td style="color: #8b5cf6;"><strong>${formatDuration(Math.round(qa.activity.activeTime * 30))}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Report Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}</p>
              <p>© ${new Date().getFullYear()} CRM System - Professional QA Activity Report (TL Panel)</p>
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
      link.download = `qa_activity_${period}_report_${format(now, 'yyyy-MM-dd')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.update(toastId, {
        render: `${period.charAt(0).toUpperCase() + period.slice(1)} QA activity report downloaded successfully!`,
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
            QA Activity
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track QA work hours, evaluations, and activity status
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
            onClick={() => handleDownloadPDF('daily')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileDown size={16} />
            Daily
          </button>
          <button
            onClick={() => handleDownloadPDF('weekly')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Calendar size={16} />
            Weekly
          </button>
          <button
            onClick={() => handleDownloadPDF('monthly')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Calendar size={16} />
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
            focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
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
                {qaMembers.filter(qa => qa.is_active).length}
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
                {qaMembers.filter(qa => qa.workStatus === 'break').length}
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
                {qaMembers.filter(qa => !qa.is_active).length}
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
              <h3 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {formatDuration(Math.round(qaWithActivity.reduce((acc, qa) => acc + qa.activity.activeTime, 0) / qaMembers.length) || 0)}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Clock className="text-purple-600 dark:text-purple-400" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-2 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            QA Activity Details
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  QA Member
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
                  Evaluations
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
              {qaWithActivity.map((qa) => (
                <React.Fragment key={qa._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={qa.profileImage}
                          alt={qa.name}
                          className="w-10 h-10 bg-purple-500"
                        >
                          {qa.name.charAt(0)}
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {qa.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {qa.employee_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        qa.is_active 
                          ? qa.workStatus === 'break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                      }`}>
                        {qa.is_active 
                          ? qa.workStatus === 'break' ? 'On Break' : 'Online'
                          : 'Offline'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <LogIn size={16} className="text-green-600 dark:text-green-400" />
                        {formatTime(qa.activity.loginTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <LogOut size={16} className="text-red-600 dark:text-red-400" />
                        {formatTime(qa.activity.logoutTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-purple-600 dark:text-purple-400">
                      {formatDuration(qa.activity.activeTime)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-blue-600 dark:text-blue-400 text-center">
                      {qa.activity.evaluationsCompleted}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center">
                      {qa.activity.totalBreaks}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                      {formatDuration(qa.activity.breakDuration)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQAPDF(qa, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQAPDF(qa, 'weekly');
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadQAPDF(qa, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(qa._id);
                          }}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          title="View 30-Day History"
                        >
                          {expandedQAId === qa._id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expandable Section */}
                  {expandedQAId === qa._id && (
                    <tr>
                      <td colSpan="9" className="px-6 py-6 bg-gray-50 dark:bg-slate-900/50">
                        {loadingHistory[qa._id] ? (
                          <div className="flex justify-center py-8">
                            <CircularProgress size={40} />
                          </div>
                        ) : qaHistory[qa._id] ? (
                          <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Last 30 Days Activity - {qa.name}
                            </h3>
                            
                            {/* Chart */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
                              <Line
                                data={{
                                  labels: qaHistory[qa._id].map(day => 
                                    format(new Date(day.date), 'MMM dd')
                                  ).reverse(),
                                  datasets: [{
                                    label: 'Online Time (minutes)',
                                    data: qaHistory[qa._id].map(day => day.totalOnlineTime).reverse(),
                                    borderColor: 'rgb(147, 51, 234)',
                                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    pointRadius: 4,
                                    pointHoverRadius: 6
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      display: false
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          const minutes = context.parsed.y;
                                          const hours = Math.floor(minutes / 60);
                                          const mins = Math.round(minutes % 60);
                                          return `Online Time: ${hours}h ${mins}m`;
                                        }
                                      }
                                    }
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      ticks: {
                                        callback: function(value) {
                                          const hours = Math.floor(value / 60);
                                          return `${hours}h`;
                                        }
                                      },
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)'
                                      }
                                    },
                                    x: {
                                      grid: {
                                        color: 'rgba(148, 163, 184, 0.1)'
                                      }
                                    }
                                  }
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
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Date</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Login</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Logout</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Online Time</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Breaks</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Break Time</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {qaHistory[qa._id].map((day, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                          {format(new Date(day.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {day.loginTime ? format(new Date(day.loginTime), 'hh:mm a') : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {day.logoutTime ? format(new Date(day.logoutTime), 'hh:mm a') : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-purple-600 dark:text-purple-400">
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

export default QAActivity;
