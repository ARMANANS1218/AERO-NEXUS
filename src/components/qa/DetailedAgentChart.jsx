import React from 'react';
import { useListEvaluationsQuery } from '../../features/qa/qaEvaluationApi';
import { Bar, Line } from 'react-chartjs-2';
import { ChevronUp, Edit } from 'lucide-react';
import { format } from 'date-fns';
import RateQueryModal from '../qa/RateQueryModal';

export default function DetailedAgentChart({ agentId, agentName, onClose }) {
  const { data, isLoading, refetch } = useListEvaluationsQuery({ agentId });
  const evaluations = data?.data || [];
  const [selectedEvaluation, setSelectedEvaluation] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const capitalizeText = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const handleEditEvaluation = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setShowEditModal(true);
  };

  const handleDownloadPDF_REMOVED = (evaluation) => {
    const performanceCategory = evaluation.performanceCategory || evaluation.result || 'N/A';
    
    const pdfContent = `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #4F46E5; padding-bottom: 20px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 28px; text-transform: uppercase;">Query Evaluation Report</h1>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Professional Performance Assessment</p>
        </div>

        <!-- Agent Information -->
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Agent Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; text-transform: uppercase;">Agent Name:</td>
              <td style="padding: 8px 0; color: #1F2937;">${capitalizeText(agentName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; text-transform: uppercase;">Petition ID:</td>
              <td style="padding: 8px 0; color: #1F2937;">${evaluation.petitionId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; text-transform: uppercase;">Evaluated By:</td>
              <td style="padding: 8px 0; color: #1F2937;">${capitalizeText(evaluation.evaluatedBy?.name || evaluation.evaluator?.name || evaluation.evaluatorName || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; text-transform: uppercase;">Date:</td>
              <td style="padding: 8px 0; color: #1F2937;">${evaluation.createdAt ? format(new Date(evaluation.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Performance Summary -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Performance Summary</h2>
          <div style="display: flex; justify-content: space-around; margin-top: 20px;">
            <div style="text-align: center; background: #EEF2FF; padding: 20px; border-radius: 8px; flex: 1; margin: 0 10px;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Total Score</p>
              <p style="margin: 10px 0 0 0; color: #4F46E5; font-size: 32px; font-weight: bold;">${evaluation.totalWeightedScore?.toFixed(2)}%</p>
            </div>
            <div style="text-align: center; background: #F0FDF4; padding: 20px; border-radius: 8px; flex: 1; margin: 0 10px;">
              <p style="margin: 0; color: #6B7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Performance Category</p>
              <p style="margin: 10px 0 0 0; color: #059669; font-size: 20px; font-weight: bold; text-transform: capitalize;">${capitalizeText(performanceCategory)}</p>
            </div>
          </div>
        </div>

        <!-- Detailed Metrics -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Detailed Metrics Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #4F46E5; color: white;">
                <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Metric</th>
                <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase;">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Greeting & Introduction</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.greeting?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Probing & Understanding</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.probing?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Accuracy of Information</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.accuracy?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Resolution / FCR</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.resolution?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Process Adherence</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.processAdherence?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Compliance</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.compliance?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Grammar & Spelling</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.grammar?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Tone & Empathy</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.tone?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Personalization</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.personalization?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Chat Flow & Response Time</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.flow?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Tool Navigation</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.toolEfficiency?.score || 0}%</td>
              </tr>
              <tr style="background: #FFFFFF; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Escalation Handling</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.escalation?.score || 0}%</td>
              </tr>
              <tr style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 10px; font-weight: 600; color: #374151; text-transform: capitalize;">Documentation Quality</td>
                <td style="padding: 10px; text-align: center; font-weight: bold; color: #1F2937;">${evaluation.documentation?.score || 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Feedback Section -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #1F2937; margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">Evaluator Feedback</h2>
          <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; color: #92400E; font-weight: bold; font-size: 12px; text-transform: uppercase;">Remarks:</p>
            <p style="margin: 8px 0 0 0; color: #78350F; line-height: 1.6;">${capitalizeText(evaluation.remarks || 'No remarks provided')}</p>
          </div>
          <div style="background: #DBEAFE; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; color: #1E3A8A; font-weight: bold; font-size: 12px; text-transform: uppercase;">Coaching Area:</p>
            <p style="margin: 8px 0 0 0; color: #1E40AF; line-height: 1.6;">${capitalizeText(evaluation.coachingArea || 'No coaching area specified')}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
          <p style="margin: 0;">This report was generated on ${format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} CRM System - Professional Evaluation Report</p>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfContent;
    document.body.appendChild(tempDiv);

    const options = {
      margin: 10,
      filename: `Evaluation_Report_${evaluation.petitionId}_${format(new Date(), 'yyyyMMdd')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // This function is no longer used - kept for reference only
    // Replaced with Edit button that opens RateQueryModal
  };

  // Calculate metric averages
  const metricKeys = [
    'greeting',
    'probing',
    'accuracy',
    'resolution',
    'processAdherence',
    'compliance',
    'grammar',
    'tone',
    'personalization',
    'flow',
    'toolEfficiency',
    'escalation',
    'documentation',
  ];

  const metricAverages = metricKeys.map((metric) => {
    const scores = evaluations
      .map((ev) => ev[metric]?.score || 0)
      .filter((s) => s > 0);
    return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
  });

  // Prepare chart data for metrics breakdown
  const metricsChartData = {
    labels: metricKeys.map((m) => m.charAt(0).toUpperCase() + m.slice(1)),
    datasets: [
      {
        label: `${agentName} - Metric Scores`,
        data: metricAverages,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Timeline data - evaluations over time
  const sortedEvals = [...evaluations].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const timelineLabels = sortedEvals.map((ev, idx) => `Eval ${idx + 1}`);
  const timelineScores = sortedEvals.map((ev) => ev.totalWeightedScore);

  const timelineChartData = {
    labels: timelineLabels,
    datasets: [
      {
        label: 'Score Trend',
        data: timelineScores,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
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
    <div className="mt-1 p-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Detailed Performance: {capitalizeText(agentName)}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ChevronUp size={20} />
        </button>
      </div>

      {isLoading && <p className="text-center text-gray-500 dark:text-gray-400">Loading Evaluations…</p>}

      {!isLoading && evaluations.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">No Evaluations For This Agent.</p>
      )}

      {!isLoading && evaluations.length > 0 && (
        <div className="space-y-1.5">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Total Evals</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-300">{evaluations.length}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Avg Score</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-300">
                {(evaluations.reduce((sum, ev) => sum + ev.totalWeightedScore, 0) / evaluations.length).toFixed(2)}%
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-2 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">High Score</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-300">
                {Math.max(...evaluations.map((ev) => ev.totalWeightedScore)).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-1.5">
            {/* Metrics Breakdown - Full Width */}
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5" style={{ height: '250px' }}>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1.5 uppercase">Avg Metric Scores</h4>
              <div style={{ height: 'calc(100% - 30px)' }}>
                <Line data={metricsChartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>

          {/* Detailed Evaluations Table */}
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-1.5 py-1.5 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-600">
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">All Evaluations</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-gray-100 dark:bg-gray-950">
                  <tr>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">ID</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">By</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Score</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Perf</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Greet</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Prob</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Acc</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Res</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Proc</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Comp</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Gram</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Tone</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Pers</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Flow</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Tool</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Esc</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Doc</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Remarks</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Coach</th>
                    <th className="px-1 py-1 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {evaluations.map((ev) => {
                    const performanceCategory = ev.performanceCategory || ev.result || 'N/A';
                    const categoryColor = performanceCategory === 'Excellent' ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 
                                         performanceCategory === 'Good' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 
                                         performanceCategory === 'Average' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' : 
                                         performanceCategory === 'Poor' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' : 
                                         'text-red-600 bg-red-50 dark:bg-red-900/30';
                    
                    return (
                      <tr key={ev._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-1 py-1 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100">
                          {ev.petitionId || 'N/A'}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          {capitalizeText(ev.evaluatedBy?.name || ev.evaluator?.name || ev.evaluatorName || 'N/A')}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-100">
                          {ev.totalWeightedScore?.toFixed(2)}%
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${categoryColor}`}>
                            {capitalizeText(performanceCategory)}
                          </span>
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.greeting?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.probing?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.accuracy?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.resolution?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.processAdherence?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.compliance?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.grammar?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.tone?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.personalization?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.flow?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.toolEfficiency?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.escalation?.score || 0}%</td>
                        <td className="px-1 py-1 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">{ev.documentation?.score || 0}%</td>
                        <td className="px-1 py-1 text-xs text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {capitalizeText(ev.remarks || 'N/A')}
                        </td>
                        <td className="px-1 py-1 text-xs text-gray-900 dark:text-gray-100 max-w-xs truncate">
                          {capitalizeText(ev.coachingArea || 'N/A')}
                        </td>
                        <td className="px-1 py-1 whitespace-nowrap">
                          <button
                            onClick={() => handleEditEvaluation(ev)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 font-medium"
                            title="Edit Evaluation"
                          >
                            <Edit size={12} />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Evaluation Modal */}
      {showEditModal && selectedEvaluation && (
        <RateQueryModal
          petitionId={selectedEvaluation.petitionId}
          readOnly={false}
          existingData={selectedEvaluation}
          onClose={(saved) => {
            setShowEditModal(false);
            setSelectedEvaluation(null);
            if (saved) {
              refetch();
            }
          }}
        />
      )}
    </div>
  );
}
