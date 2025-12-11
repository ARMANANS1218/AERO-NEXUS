import React from 'react';
import { useListAggregatesQuery, useLazyExportXlsxQuery, useListEvaluationsQuery } from '../../features/qa/qaEvaluationApi';
import { Download, RefreshCw, Trophy, ChevronDown, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import DetailedAgentChart from '../../components/qa/DetailedAgentChart';
import html2pdf from 'html2pdf.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement);

export default function AgentRatings() {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [evaluatorRole, setEvaluatorRole] = React.useState('');
  const [reportPeriod, setReportPeriod] = React.useState('');
  const [expandedAgentId, setExpandedAgentId] = React.useState(null);
  const { data, isLoading, refetch } = useListAggregatesQuery({ from: from || undefined, to: to || undefined, evaluatorRole: evaluatorRole || undefined });
  const [selectedAgentXlsx, setSelectedAgentXlsx] = React.useState(null);
  const [xlsxFilename, setXlsxFilename] = React.useState('query_evaluations.xlsx');
  const [triggerXlsx, { data: xlsxBlob, isFetching: isDownloadingXlsx }] = useLazyExportXlsxQuery();

  React.useEffect(() => {
    if (xlsxBlob instanceof Blob) {
      const url = URL.createObjectURL(xlsxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = xlsxFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('Excel report downloaded successfully!');
    }
  }, [xlsxBlob, xlsxFilename]);

  // Auto-refetch when filters change
  React.useEffect(() => {
    refetch();
  }, [from, to, evaluatorRole, refetch]);

  const handleExportXlsx = (agentId, agentName) => {
    const base = agentId && agentName ? `Query_Evaluations_${agentName.replace(/[^a-z0-9]+/gi,'_')}.xlsx` : 'Query_Evaluations_All.xlsx';
    toast.loading(agentId && agentName ? `Generating Excel report for ${agentName}...` : 'Generating Excel report for all agents...');
    setXlsxFilename(base);
    setSelectedAgentXlsx(agentId || null);
    triggerXlsx({ agentId: agentId || undefined, from: from || undefined, to: to || undefined });
  };

  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleDownloadAgentPDF = async (agentId, agentName, reportPeriod) => {
    const toastId = toast.loading(`Generating ${capitalizeText(reportPeriod)} PDF report for ${agentName}...`);
    try {
      // Calculate date range based on report period
      const now = new Date();
      let startDate;
      
      if (reportPeriod === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (reportPeriod === 'weekly') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      } else if (reportPeriod === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Fetch evaluations for this agent
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/v1/qa/list?agentId=${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch evaluations: ${response.status}`);
      }
      
      const result = await response.json();
      let evaluations = result?.data || [];
      
      // Filter evaluations by date range
      if (startDate) {
        evaluations = evaluations.filter(ev => new Date(ev.createdAt) >= startDate);
      }
      
      if (evaluations.length === 0) {
        toast.update(toastId, { render: `No evaluations found for ${agentName} in the ${reportPeriod} period.`, type: 'warning', isLoading: false, autoClose: 3000 });
        return;
      }

    const avgScore = evaluations.length > 0 
      ? (evaluations.reduce((sum, ev) => sum + ev.totalWeightedScore, 0) / evaluations.length).toFixed(2)
      : 0;
    const highestScore = evaluations.length > 0 
      ? Math.max(...evaluations.map(ev => ev.totalWeightedScore)).toFixed(2)
      : 0;
    const performanceCategory = avgScore >= 81 ? 'Excellent' : avgScore >= 61 ? 'Good' : avgScore >= 41 ? 'Average' : avgScore >= 21 ? 'Poor' : 'Very Poor';

    const evaluationRows = evaluations.map(ev => `
      <tr style="background: ${evaluations.indexOf(ev) % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}; border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 2px; color: #374151; white-space: nowrap; font-size: 7px;">${ev.petitionId || 'N/A'}</td>
        <td style="padding: 2px; color: #374151; white-space: nowrap; font-size: 7px;">${capitalizeText(ev.evaluatedBy?.name || ev.evaluator?.name || ev.evaluatorName || 'N/A')}</td>
        <td style="padding: 2px; color: #374151; white-space: nowrap; font-size: 7px;">${ev.createdAt ? format(new Date(ev.createdAt), 'dd MMM yyyy') : 'N/A'}</td>
        <td style="padding: 2px; font-weight: bold; color: #1F2937; text-align: center; white-space: nowrap; font-size: 7px;">${ev.totalWeightedScore?.toFixed(2)}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${capitalizeText(ev.performanceCategory || ev.result || 'N/A')}</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.greeting?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.probing?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.accuracy?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.resolution?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.processAdherence?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.compliance?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.grammar?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.tone?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.personalization?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.flow?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.toolEfficiency?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.tagging?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.escalation?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; text-align: center; white-space: nowrap; font-size: 7px;">${ev.documentation?.score || 0}%</td>
        <td style="padding: 2px; color: #374151; font-size: 6px; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">${ev.remarks || '-'}</td>
        <td style="padding: 2px; color: #374151; font-size: 6px; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">${ev.coachingArea || '-'}</td>
      </tr>
    `).join('');

    // First page - Summary
    const summaryPage = `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333; page-break-after: always;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 4px solid #4F46E5; padding-bottom: 25px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 1px;">Agent Performance Report</h1>
          <p style="margin: 15px 0 0 0; color: #666; font-size: 16px;">Comprehensive Evaluation Summary - ${capitalizeText(reportPeriod)} Report</p>
        </div>

        <!-- Agent Information -->
        <div style="background: #F3F4F6; padding: 30px; border-radius: 10px; margin-bottom: 40px; border-left: 5px solid #4F46E5;">
          <h2 style="color: #1F2937; margin: 0 0 25px 0; font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 12px;">Agent Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 14px 0; font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px; width: 35%;">Agent Name:</td>
              <td style="padding: 14px 0; color: #1F2937; font-size: 16px; font-weight: 600;">${capitalizeText(agentName)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px;">Report Period:</td>
              <td style="padding: 14px 0; color: #1F2937; font-size: 16px; font-weight: 600;">${reportPeriod ? capitalizeText(reportPeriod) : 'All Time'}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; font-weight: bold; color: #374151; text-transform: uppercase; font-size: 14px;">Generated On:</td>
              <td style="padding: 14px 0; color: #1F2937; font-size: 16px; font-weight: 600;">${format(new Date(), 'dd MMM yyyy, hh:mm a')}</td>
            </tr>
          </table>
        </div>

        <!-- Performance Summary -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1F2937; margin: 0 0 25px 0; font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 12px;">Performance Summary</h2>
          <div style="display: flex; justify-content: space-around; margin-top: 25px; gap: 15px;">
            <div style="text-align: center; background: #EEF2FF; padding: 30px; border-radius: 10px; flex: 1; border-top: 4px solid #4F46E5;">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Total Evaluations</p>
              <p style="margin: 15px 0 0 0; color: #4F46E5; font-size: 42px; font-weight: bold;">${evaluations.length}</p>
            </div>
            <div style="text-align: center; background: #F0FDF4; padding: 30px; border-radius: 10px; flex: 1; border-top: 4px solid #059669;">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Average Score</p>
              <p style="margin: 15px 0 0 0; color: #059669; font-size: 42px; font-weight: bold;">${avgScore}%</p>
            </div>
            <div style="text-align: center; background: #FEF3C7; padding: 30px; border-radius: 10px; flex: 1; border-top: 4px solid #D97706;">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Highest Score</p>
              <p style="margin: 15px 0 0 0; color: #D97706; font-size: 42px; font-weight: bold;">${highestScore}%</p>
            </div>
            <div style="text-align: center; background: #DBEAFE; padding: 30px; border-radius: 10px; flex: 1; border-top: 4px solid #1E40AF;">
              <p style="margin: 0; color: #6B7280; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Performance</p>
              <p style="margin: 15px 0 0 0; color: #1E40AF; font-size: 26px; font-weight: bold; text-transform: capitalize;">${capitalizeText(performanceCategory)}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 100px; padding-top: 25px; border-top: 3px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 13px;">
          <p style="margin: 0; font-weight: 500;">Report Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
          <p style="margin: 8px 0 0 0; font-size: 12px;">© ${new Date().getFullYear()} CRM System - Professional Performance Report</p>
        </div>
      </div>
    `;

    // Second page - Detailed Evaluations Table
    const evaluationsPage = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <!-- Header for page 2 -->
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #4F46E5; padding-bottom: 15px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 24px; text-transform: uppercase;">Detailed Evaluations</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">${capitalizeText(agentName)} - ${capitalizeText(reportPeriod)} Report</p>
        </div>

        <!-- Detailed Evaluations Table -->
        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 7px;">
            <thead>
              <tr style="background: #4F46E5; color: white;">
                <th style="padding: 3px 2px; text-align: left; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Petition ID</th>
                <th style="padding: 3px 2px; text-align: left; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Evaluated By</th>
                <th style="padding: 3px 2px; text-align: left; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Date</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Total</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Performance</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Greeting</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Probing</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Accuracy</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Resolution</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Process</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Compliance</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Grammar</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Tone</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Personal.</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Flow</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Tool Eff.</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Tagging</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Escalation</th>
                <th style="padding: 3px 2px; text-align: center; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Doc.</th>
                <th style="padding: 3px 2px; text-align: left; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Remarks</th>
                <th style="padding: 3px 2px; text-align: left; text-transform: uppercase; white-space: nowrap; font-size: 7px;">Coaching</th>
              </tr>
            </thead>
            <tbody>
              ${evaluationRows || '<tr><td colspan="18" style="padding: 20px; text-align: center; color: #6B7280;">No evaluations available</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 10px;">
          <p style="margin: 0;">Page 2 - Detailed Evaluations</p>
        </div>
      </div>
    `;

    // Combine both pages in one container
    const combinedDiv = document.createElement('div');
    combinedDiv.innerHTML = summaryPage + evaluationsPage;
    document.body.appendChild(combinedDiv);

    const options = {
      margin: [8, 3, 8, 3],
      filename: `Agent_Performance_Report_${agentName.replace(/[^a-z0-9]+/gi, '_')}_${capitalizeText(reportPeriod)}_${format(new Date(), 'yyyyMMdd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

      html2pdf().from(combinedDiv).set(options).save().then(() => {
        document.body.removeChild(combinedDiv);
        toast.update(toastId, { render: `PDF report downloaded successfully!`, type: 'success', isLoading: false, autoClose: 3000 });
      }).catch((error) => {
        console.error('Error generating PDF:', error);
        if (document.body.contains(combinedDiv)) {
          document.body.removeChild(combinedDiv);
        }
        toast.update(toastId, { render: 'Failed to generate PDF. Please try again.', type: 'error', isLoading: false, autoClose: 3000 });
      });
    } catch (error) {
      console.error('Error in handleDownloadAgentPDF:', error);
      toast.update(toastId, { render: `Error downloading PDF: ${error.message}`, type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  const aggregates = data?.data || [];
  const topAgent = aggregates[0];

  // Prepare chart data
  const agentNames = aggregates.map(a => a.agentName);
  const avgScores = aggregates.map(a => a.avgScore);
  const counts = aggregates.map(a => a.count);

  const barChartData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Avg Score',
        data: avgScores,
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Evaluations Count',
        data: counts,
        backgroundColor: [
          'rgba(255, 193, 7, 0.7)',
          'rgba(33, 150, 243, 0.7)',
          'rgba(76, 175, 80, 0.7)',
          'rgba(244, 67, 54, 0.7)',
          'rgba(156, 39, 176, 0.7)',
          'rgba(255, 87, 34, 0.7)',
        ],
        borderColor: [
          'rgba(255, 193, 7, 1)',
          'rgba(33, 150, 243, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)',
          'rgba(156, 39, 176, 1)',
          'rgba(255, 87, 34, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(107, 114, 128, 1)',
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'rgba(107, 114, 128, 1)' },
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
      },
      x: {
        ticks: { color: 'rgba(107, 114, 128, 1)' },
        grid: { color: 'rgba(229, 231, 235, 0.5)' },
      },
    },
  };

  return (
    <div className="p-2 w-full">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Agent Weightage Aggregates
        </h1>
        <div className="flex gap-1 flex-wrap items-center">
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
              Report Period
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-medium"
            >
              <option value="">Custom Range</option>
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Evaluator Role
            </label>
            <select
              value={evaluatorRole}
              onChange={(e) => setEvaluatorRole(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Roles</option>
              <option value="Agent">Agent</option>
              <option value="QA">QA</option>
              <option value="TL">TL (Team Lead)</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-950 dark:hover:bg-gray-600 rounded text-sm text-gray-900 dark:text-gray-100"
          >
            <RefreshCw size={16} /> Apply
          </button>
          <button
            onClick={() => handleExportXlsx(null)}
            disabled={isDownloadingXlsx}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
          >
            <Download size={18} />
            {isDownloadingXlsx && !selectedAgentXlsx
              ? "Exporting…"
              : "Export All Excel"}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-950 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </div>

      {topAgent && (
        <div className="mb-2 p-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-lg flex items-center gap-1 shadow">
          <Trophy size={20} />
          <div>
            <p className="text-sm font-semibold">Top Performer: {capitalizeText(topAgent.agentName)}</p>
            <p className="text-xs opacity-90">
              Avg Score: {topAgent.avgScore}% | Evaluations: {topAgent.count}
            </p>
          </div>
        </div>
      )}

      {/* Performance Charts Section */}
      {!isLoading && aggregates.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-1.5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Average Score by Agent</h3>
            <Bar data={barChartData} options={chartOptions} />
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-1.5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Evaluation Distribution</h3>
            <div className="flex justify-center">
              <div style={{ maxWidth: '250px', width: '100%' }}>
                <Doughnut data={doughnutChartData} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(107, 114, 128, 1)' } } } }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow w-full">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                Agent
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                Evals
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                Avg %
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                High
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                Category
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-tight">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Loading Aggregates…
                </td>
              </tr>
            )}
            {!isLoading && aggregates.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No Evaluations Yet.
                </td>
              </tr>
            )}
            {aggregates.map((row) => {
              const performanceCategory = row.avgScore >= 81 ? 'Excellent' : 
                                         row.avgScore >= 61 ? 'Good' : 
                                         row.avgScore >= 41 ? 'Average' : 
                                         row.avgScore >= 21 ? 'Poor' : 'Very Poor';
              const categoryColor = row.avgScore >= 81 ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 
                                   row.avgScore >= 61 ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 
                                   row.avgScore >= 41 ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : 
                                   row.avgScore >= 21 ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30' : 
                                   'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
              
              return (
              <React.Fragment key={row._id}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setExpandedAgentId(expandedAgentId === row._id ? null : row._id)}
                >
                  <td className="px-2 py-1.5 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    <ChevronDown size={14} className={`transform transition ${expandedAgentId === row._id ? 'rotate-180' : ''}`} />
                    {capitalizeText(row.agentName)}
                  </td>
                  <td className="px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 font-medium">{row.count}</td>
                  <td className="px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 font-semibold">{row.avgScore}%</td>
                  <td className="px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 font-semibold">{row.maxScore || row.avgScore}%</td>
                  <td className="px-2 py-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${categoryColor}`}>
                      {capitalizeText(performanceCategory)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadAgentPDF(row._id, row.agentName, 'daily'); }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 whitespace-nowrap font-medium"
                        title="Download Daily PDF Report"
                      >
                        <FileText size={10} />
                        Daily
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadAgentPDF(row._id, row.agentName, 'weekly'); }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded border border-orange-200 whitespace-nowrap font-medium"
                        title="Download Weekly PDF Report"
                      >
                        <FileText size={10} />
                        Weekly
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadAgentPDF(row._id, row.agentName, 'monthly'); }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 whitespace-nowrap font-medium"
                        title="Download Monthly PDF Report"
                      >
                        <FileText size={10} />
                        Monthly
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportXlsx(row._id, row.agentName); }}
                        disabled={isDownloadingXlsx && selectedAgentXlsx === row._id}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 disabled:opacity-50 whitespace-nowrap font-medium"
                        title="Download Excel Report"
                      >
                        <Download size={10} />
                        <span>
                          {isDownloadingXlsx && selectedAgentXlsx === row._id
                            ? "Exp…"
                            : "Excel"}
                        </span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedAgentId(expandedAgentId === row._id ? null : row._id); }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 whitespace-nowrap font-medium"
                        title="View Details"
                      >
                        <ChevronDown size={10} className={`transform transition ${expandedAgentId === row._id ? 'rotate-180' : ''}`} />
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedAgentId === row._id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-2">
                      <DetailedAgentChart
                        agentId={row._id}
                        agentName={row.agentName}
                        onClose={() => setExpandedAgentId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
