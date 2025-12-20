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

  const agents = employeesData?.data?.filter(emp => emp.role === 'Agent') || [];

  // Fetch 30-day history for an agent
  const fetch30DayHistory = async (agentId) => {
    if (agentHistory[agentId]) {
      // Already loaded, just toggle expand
      setExpandedAgentId(expandedAgentId === agentId ? null : agentId);
      return;
    }

    setLoadingHistory(prev => ({ ...prev, [agentId]: true }));
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/user/activity/30-days/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.status && result.data) {
        setAgentHistory(prev => ({ ...prev, [agentId]: result.data }));
        setExpandedAgentId(agentId);
      } else {
        toast.error('Failed to load activity history');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error loading activity history');
    } finally {
      setLoadingHistory(prev => ({ ...prev, [agentId]: false }));
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
  const agentsWithActivity = agents.map(agent => {
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
        activeTime
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

  // Download individual agent PDF
  const handleDownloadAgentPDF = async (agent, period) => {
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

      // Generate PDF HTML for individual agent
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${agent.name} - ${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #3b82f6; margin: 0; font-size: 32px; }
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
            .detail-value.blue { color: #3b82f6; }
            .detail-value.amber { color: #f59e0b; }
            .detail-value.red { color: #ef4444; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${agent.name}</h1>
              <h2>${period.charAt(0).toUpperCase() + period.slice(1)} Activity Report</h2>
              <p>${periodLabel}</p>
            </div>

            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Employee ID:</span>
                <span class="info-value">${agent.employee_id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${agent.email}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">${agent.role}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Current Status:</span>
                <span class="info-value">
                  <span class="status-badge ${agent.is_active ? (agent.workStatus === 'break' ? 'break' : 'active') : 'offline'}">
                    ${agent.is_active ? (agent.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline'}
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
                <span class="detail-value green">${formatTime(agent.activity.loginTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🔒 Logout Time</span>
                <span class="detail-value red">${formatTime(agent.activity.logoutTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ Online Time</span>
                <span class="detail-value blue">${formatDuration(agent.activity.activeTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">☕ Total Breaks</span>
                <span class="detail-value">${agent.activity.totalBreaks}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏸️ Break Duration</span>
                <span class="detail-value amber">${formatDuration(agent.activity.breakDuration)}</span>
              </div>
            </div>

            <h3 class="section-title">Productivity Averages</h3>
            <div class="activity-details">
              <div class="detail-row">
                <span class="detail-label">📊 Daily Average</span>
                <span class="detail-value green">${formatDuration(agent.activity.activeTime)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📈 Weekly Average (Projected)</span>
                <span class="detail-value blue">${formatDuration(Math.round(agent.activity.activeTime * 7))}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📉 Monthly Average (Projected)</span>
                <span class="detail-value">${formatDuration(Math.round(agent.activity.activeTime * 30))}</span>
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
        toast.success(`${agent.name}'s ${period} report generated!`);
      }, 500);

    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss(toastId);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleDownloadPDF = async (period) => {
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
      const activeAgents = agentsWithActivity.filter(a => a.is_active).length;
      const onBreak = agentsWithActivity.filter(a => a.workStatus === 'break').length;
      const offline = agentsWithActivity.filter(a => !a.is_active).length;
      const avgActiveTime = Math.round(
        agentsWithActivity.reduce((acc, a) => acc + a.activity.activeTime, 0) / totalAgents
      );

      // Generate PDF HTML
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Agent Activity Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8f9fa; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 25px; margin-bottom: 35px; }
            .header h1 { color: #10b981; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px; }
            .header p { margin: 15px 0 0 0; color: #666; font-size: 16px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 35px; }
            .summary-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #3b82f6; padding: 20px; border-radius: 8px; text-align: center; }
            .summary-card.green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left-color: #10b981; }
            .summary-card.orange { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-left-color: #f59e0b; }
            .summary-card.gray { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left-color: #6b7280; }
            .summary-card h3 { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
            .summary-card p { font-size: 32px; font-weight: bold; color: #1f2937; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            .info-table td { padding: 14px 0; font-size: 15px; border-bottom: 1px solid #e5e7eb; }
            .info-table td:first-child { font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; }
            .info-table td:last-child { color: #1F2937; font-size: 16px; font-weight: 600; }
            .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 35px 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; text-transform: uppercase; }
            .activity-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .activity-table thead { background: #f3f4f6; }
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
              <h1>Agent Activity Report</h1>
              <p>Work Hours & Activity Tracking - ${period.charAt(0).toUpperCase() + period.slice(1)} Report <span class="badge ${period}">${period.toUpperCase()}</span></p>
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
                <td>${period === 'daily' ? 'Daily Activity Report' : 'Monthly Activity Report'}</td>
              </tr>
            </table>

            <h2 class="section-title">Activity Summary</h2>
            <div class="summary">
              <div class="summary-card green">
                <h3>Currently Online</h3>
                <p>${activeAgents}</p>
              </div>
              <div class="summary-card orange">
                <h3>On Break</h3>
                <p>${onBreak}</p>
              </div>
              <div class="summary-card gray">
                <h3>Offline</h3>
                <p>${offline}</p>
              </div>
              <div class="summary-card">
                <h3>Avg Online Time</h3>
                <p>${formatDuration(avgActiveTime)}</p>
              </div>
            </div>

            <h2 class="section-title">Agent Activity Details</h2>
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Status</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Online Time</th>
                  <th>Breaks</th>
                  <th>Break Duration</th>
                  <th>Daily Avg</th>
                  <th>Weekly Avg</th>
                  <th>Monthly Avg</th>
                </tr>
              </thead>
              <tbody>
                ${agentsWithActivity.map(agent => `
                  <tr>
                    <td><strong>${agent.name}</strong><br/><small style="color: #6b7280;">${agent.email}</small></td>
                    <td>
                      <span class="status-badge ${agent.is_active ? (agent.workStatus === 'break' ? 'break' : 'active') : 'offline'}">
                        ${agent.is_active ? (agent.workStatus === 'break' ? 'On Break' : 'Online') : 'Offline'}
                      </span>
                    </td>
                    <td>${formatTime(agent.activity.loginTime)}</td>
                    <td>${formatTime(agent.activity.logoutTime)}</td>
                    <td><strong style="color: #3b82f6;">${formatDuration(agent.activity.activeTime)}</strong></td>
                    <td>${agent.activity.totalBreaks}</td>
                    <td style="color: #f59e0b;"><strong>${formatDuration(agent.activity.breakDuration)}</strong></td>
                    <td style="color: #10b981;"><strong>${formatDuration(agent.activity.activeTime)}</strong></td>
                    <td style="color: #3b82f6;"><strong>${formatDuration(Math.round(agent.activity.activeTime * 7))}</strong></td>
                    <td style="color: #8b5cf6;"><strong>${formatDuration(Math.round(agent.activity.activeTime * 30))}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>Report Generated: ${format(now, 'dd MMM yyyy, hh:mm a')}</p>
              <p>© ${new Date().getFullYear()} CRM System - Professional Activity Report (TL Panel)</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Create and download PDF using print dialog
      const printWindow = window.open('', '', 'width=1000,height=700');
      printWindow.document.write(pdfHTML);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast.dismiss(toastId);
        toast.success(`${period.charAt(0).toUpperCase() + period.slice(1)} activity report generated!`);
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Agent Activity
          </h1>
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
                {agents.filter(a => a.is_active).length}
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
                {agents.filter(a => a.workStatus === 'break').length}
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
                {agents.filter(a => !a.is_active).length}
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
                {formatDuration(Math.round(agentsWithActivity.reduce((acc, a) => acc + a.activity.activeTime, 0) / agents.length) || 0)}
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activity Details
          </h2>
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
                          <p className="font-medium text-gray-900 dark:text-white">
                            {agent.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {agent.employee_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        agent.is_active 
                          ? agent.workStatus === 'break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400'
                      }`}>
                        {agent.is_active 
                          ? agent.workStatus === 'break' ? 'On Break' : 'Online'
                          : 'Offline'
                        }
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
                            handleDownloadAgentPDF(agent, 'daily');
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Download Daily Report"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentPDF(agent, 'weekly');
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Download Weekly Report"
                        >
                          <FileDown size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAgentPDF(agent, 'monthly');
                          }}
                          className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                          title="Download Monthly Report"
                        >
                          <FileDown size={16} />
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
                                  labels: agentHistory[agent._id].map(day => 
                                    format(new Date(day.date), 'MMM dd')
                                  ).reverse(),
                                  datasets: [{
                                    label: 'Online Time (minutes)',
                                    data: agentHistory[agent._id].map(day => day.totalOnlineTime).reverse(),
                                    borderColor: 'rgb(59, 130, 246)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                                    {agentHistory[agent._id].map((day, idx) => (
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
