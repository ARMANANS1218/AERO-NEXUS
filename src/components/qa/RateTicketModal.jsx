import React, { useMemo, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useRateTicketMutation } from '../../features/qa/qaTicketEvaluationApi';

const METRICS = [
  // Communication & Language Quality (15%)
  { key: 'grammarSpelling', label: 'Grammar & Spelling', weight: 5, category: 'Communication & Language' },
  { key: 'sentenceStructure', label: 'Sentence Structure & Clarity', weight: 3, category: 'Communication & Language' },
  { key: 'professionalLanguage', label: 'Professional Language', weight: 4, category: 'Communication & Language' },
  { key: 'toneCourtesy', label: 'Polite & Customer-Friendly Tone', weight: 3, category: 'Communication & Language' },
  
  // Greeting & Closing (10%)
  { key: 'properGreeting', label: 'Proper Greeting Used', weight: 3, category: 'Greeting & Closing' },
  { key: 'personalization', label: 'Correct Personalization', weight: 3, category: 'Greeting & Closing' },
  { key: 'standardClosing', label: 'Standard Closing & Signature', weight: 2, category: 'Greeting & Closing' },
  { key: 'brandTone', label: 'Brand Tone Compliance', weight: 2, category: 'Greeting & Closing' },
  
  // Issue Understanding (15%)
  { key: 'issueIdentified', label: 'Issue Clearly Identified', weight: 5, category: 'Issue Understanding' },
  { key: 'issueAcknowledged', label: 'Issue Properly Acknowledged', weight: 5, category: 'Issue Understanding' },
  { key: 'noAssumptions', label: 'No Assumptions Made', weight: 5, category: 'Issue Understanding' },
  
  // Resolution Accuracy & Completeness (25%)
  { key: 'correctResolution', label: 'Correct Resolution Provided', weight: 8, category: 'Resolution & Accuracy' },
  { key: 'allQueriesAddressed', label: 'All Customer Queries Addressed', weight: 6, category: 'Resolution & Accuracy' },
  { key: 'sopCompliance', label: 'SOP / KB Compliance', weight: 6, category: 'Resolution & Accuracy' },
  { key: 'firstContactResolution', label: 'First Contact Resolution', weight: 5, category: 'Resolution & Accuracy' },
  
  // Empathy & Ownership (15%)
  { key: 'empathyStatement', label: 'Empathy Statement Used', weight: 5, category: 'Empathy & Ownership' },
  { key: 'ownershipTaken', label: 'Ownership Taken', weight: 5, category: 'Empathy & Ownership' },
  { key: 'reassuranceProvided', label: 'Reassurance Provided', weight: 5, category: 'Empathy & Ownership' },
  
  // Formatting & Readability (10%)
  { key: 'properFormatting', label: 'Proper Formatting', weight: 4, category: 'Formatting & Readability' },
  { key: 'readableStructure', label: 'Easy-to-Read Structure', weight: 3, category: 'Formatting & Readability' },
  { key: 'noOverFormatting', label: 'No Over-Formatting', weight: 3, category: 'Formatting & Readability' },
  
  // Compliance & Security (10%)
  { key: 'dataPrivacy', label: 'Data Privacy Maintained', weight: 4, category: 'Compliance & Security' },
  { key: 'authenticationFollowed', label: 'Authentication Followed', weight: 3, category: 'Compliance & Security' },
  { key: 'policyAdherence', label: 'Policy & Compliance Adherence', weight: 3, category: 'Compliance & Security' },
];

export default function RateTicketModal({ ticketId, onClose, readOnly = false, existingData = null, isOpen = false }) {
  // Normalize incoming existing scores
  const initialScores = React.useMemo(() => {
    const src = existingData?.scores || {};
    const out = {};
    Object.entries(src).forEach(([k, v]) => {
      const num = Number(v);
      if (Number.isFinite(num)) {
        out[k] = num > 10 ? Math.round(num / 10) : num;
      }
    });
    return out;
  }, [existingData]);

  const [scores, setScores] = useState(initialScores);
  const [remarks, setRemarks] = useState(existingData?.remarks || '');
  const [coachingArea, setCoachingArea] = useState(existingData?.coachingArea || '');
  const [criticalErrors, setCriticalErrors] = useState(existingData?.criticalErrors || {
    incorrectInfo: false,
    dataPrivacyBreach: false,
    rudeLanguage: false,
    processDeviation: false,
    wrongResolution: false
  });
  
  const [rateTicket, { isLoading }] = useRateTicketMutation();

  const total = useMemo(() => {
    let weightedTotal = 0;
    METRICS.forEach((m) => {
      const raw = Number(scores[m.key]) || 0;
      const clamped = Math.max(1, Math.min(10, raw));
      const ratio = clamped / 10;
      weightedTotal += ratio * m.weight;
    });
    return weightedTotal.toFixed(2);
  }, [scores]);

  const performanceCategory = useMemo(() => {
    const score = Number(total);
    if (score >= 95) return 'Excellent';
    if (score >= 85) return 'Good';
    if (score >= 75) return 'Needs Improvement';
    return 'Fail';
  }, [total]);

  const hasCriticalError = useMemo(() => {
    return Object.values(criticalErrors).some(v => v === true);
  }, [criticalErrors]);

  const handleChange = (key, value) => {
    if (readOnly) return;
    const v = Math.max(1, Math.min(10, Number(value)));
    setScores((prev) => ({ ...prev, [key]: v }));
  };

  const handleCriticalErrorChange = (key, checked) => {
    if (readOnly) return;
    setCriticalErrors(prev => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ticketId,
      scores,
      remarks,
      coachingArea,
      criticalErrors,
      hasCriticalError,
      totalScore: Number(total),
      performanceCategory
    };

    try {
      await rateTicket(payload).unwrap();
      onClose?.(true);
    } catch (err) {
      console.error('Rate error', err);
      alert(err?.data?.message || 'Failed to rate ticket');
    }
  };

  return (
    <>
      {/* Sliding panel from right - No backdrop */}
      <div 
        className={`fixed top-0 right-0 h-screen bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ width: '420px', maxWidth: '86vw', transform: isOpen ? 'translateX(0)' : 'translateX(110%)' }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-700 to-slate-600">
          <div className="flex items-center gap-3">
            <button 
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
              onClick={() => onClose?.(false)}
              title="Close panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {readOnly ? 'View Email Ticket Evaluation' : 'Set Email Ticket Weightage'}
            </h2>
          </div>
          <button 
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white"
            onClick={() => onClose?.(false)}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Metrics */}
          {['Communication & Language', 'Greeting & Closing', 'Issue Understanding', 'Resolution & Accuracy', 'Empathy & Ownership', 'Formatting & Readability', 'Compliance & Security'].map((category) => {
            const categoryMetrics = METRICS.filter(m => m.category === category);
            const categoryWeight = categoryMetrics.reduce((sum, m) => sum + m.weight, 0);
            return (
              <div key={category} className="space-y-1 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span>{category}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({categoryWeight}%)</span>
                </div>
                <div className="space-y-1">
                  {categoryMetrics.map((m) => (
                    <div key={m.key} className="flex items-center gap-3">
                      <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                        {m.label} <span className="text-gray-500 dark:text-gray-400">({m.weight}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={1}
                          value={scores[m.key] ?? ''}
                          onChange={(e) => handleChange(m.key, e.target.value)}
                          className="w-18 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-right bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent"
                          placeholder="1-10"
                          required
                          disabled={readOnly}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Critical Errors */}
          <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm font-semibold text-red-600 dark:text-red-400">Critical Error Check (Any "Yes" = Automatic Fail)</div>
            <div className="space-y-1">
              {[
                { key: 'incorrectInfo', label: 'Incorrect / Misleading Information' },
                { key: 'dataPrivacyBreach', label: 'Data Privacy Breach' },
                { key: 'rudeLanguage', label: 'Rude / Unprofessional Language' },
                { key: 'processDeviation', label: 'Process Deviation' },
                { key: 'wrongResolution', label: 'Wrong Resolution' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={criticalErrors[key] || false}
                    onChange={(e) => handleCriticalErrorChange(key, e.target.checked)}
                    disabled={readOnly}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent resize-none"
                rows={3}
                disabled={readOnly}
                placeholder="Enter remarks about the agent's email response..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Coaching Area / Corrective Action</label>
              <textarea
                value={coachingArea}
                onChange={(e) => setCoachingArea(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent resize-none"
                rows={3}
                disabled={readOnly}
                placeholder="Specify areas where coaching is required..."
              />
            </div>
          </div>

          {/* Performance Summary */}
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-800 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Score:</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{total}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quality Band:</span>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                performanceCategory === 'Excellent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' :
                performanceCategory === 'Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' :
                performanceCategory === 'Needs Improvement' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
              }`}>
                {performanceCategory}
              </span>
            </div>
            {hasCriticalError && (
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">⚠️ Critical Error Detected</div>
            )}
            <div className="text-[11px] text-gray-500 dark:text-gray-400">
              95-100%: Excellent | 85-94%: Good | 75-84%: Needs Improvement | &lt;75%: Fail
            </div>
          </div>
        </form>

        {/* Footer with action buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              onClick={() => onClose?.(false)}
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button 
                type="submit" 
                disabled={isLoading} 
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all font-medium shadow-md"
                onClick={handleSubmit}
              >
                {isLoading ? 'Saving…' : 'Save Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
