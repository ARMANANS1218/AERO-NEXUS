import React, { useMemo, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { useRateQueryMutation } from '../../features/qa/qaEvaluationApi';

const METRICS = [
  // Chat Handling Parameters (55%)
  { key: 'greeting', label: 'Greeting & Introduction', weight: 5, category: 'Chat Handling' },
  { key: 'probing', label: 'Probing & Understanding', weight: 10, category: 'Chat Handling' },
  { key: 'accuracy', label: 'Accuracy of Information', weight: 15, category: 'Chat Handling' },
  { key: 'resolution', label: 'Resolution / FCR', weight: 10, category: 'Chat Handling' },
  { key: 'processAdherence', label: 'Process/CRM Adherence', weight: 10, category: 'Chat Handling' },
  { key: 'compliance', label: 'Compliance/Policy', weight: 5, category: 'Chat Handling' },
  { key: 'closure', label: 'Closure & Summary', weight: 0, category: 'Chat Handling', hidden: true }, // Hidden field with 0 weight for backend compatibility
  
  // Soft Skills / Communication (20%)
  { key: 'grammar', label: 'Grammar & Spelling', weight: 5, category: 'Soft Skills' },
  { key: 'tone', label: 'Tone & Empathy', weight: 5, category: 'Soft Skills' },
  { key: 'personalization', label: 'Personalization', weight: 5, category: 'Soft Skills' },
  { key: 'flow', label: 'Chat Flow & Response Time', weight: 5, category: 'Soft Skills' },
  
  // System & Process Compliance (15%)
  { key: 'toolEfficiency', label: 'Tool Navigation', weight: 7.5, category: 'System & Compliance' },
  { key: 'escalation', label: 'Escalation Handling', weight: 7.5, category: 'System & Compliance' },
  
  // Documentation (10%)
  { key: 'documentation', label: 'Documentation Quality', weight: 10, category: 'Documentation' }
];

export default function RateQueryModal({ petitionId, onClose, readOnly = false, existingData = null, isOpen = false }) {
  // Normalize incoming existing scores (backend stores %). Convert >10 values to 1-10 scale for display.
  const initialScores = React.useMemo(() => {
    const src = existingData?.scores || {};
    const out = {};
    Object.entries(src).forEach(([k, v]) => {
      const num = Number(v);
      if (Number.isFinite(num)) {
        out[k] = num > 10 ? Math.round(num / 10) : num; // 85% -> 9 (approx)
      }
    });
    return out;
  }, [existingData]);
  const [scores, setScores] = useState(initialScores);
  const [remarks, setRemarks] = useState(existingData?.remarks || '');
  const [coachingArea, setCoachingArea] = useState(existingData?.coachingArea || '');
  // CSAT removed from weightage calculation; keep optional state if needed but excluded from payload
  const [csat, setCsat] = useState('');
  const [rateQuery, { isLoading } ] = useRateQueryMutation();

  const total = useMemo(() => {
    // Calculate weighted total based on 1-10 inputs (auto-converted to %)
    // Each metric input x in [1..10] -> percent = (x/10)*100
    let weightedTotal = 0;
    METRICS.forEach((m) => {
      const raw = Number(scores[m.key]) || 0;
      const clamped = Math.max(1, Math.min(10, raw));
      const ratio = clamped / 10; // 0.1..1
      weightedTotal += ratio * m.weight;
    });
    return weightedTotal.toFixed(2);
  }, [scores]);

  const performanceCategory = useMemo(() => {
    const score = Number(total);
    if (score >= 81) return 'Excellent';
    if (score >= 61) return 'Good';
    if (score >= 41) return 'Average';
    if (score >= 21) return 'Poor';
    return 'Very Poor';
  }, [total]);

  const handleChange = (key, value) => {
    if (readOnly) return; // Prevent changes in read-only mode
    const v = Math.max(1, Math.min(10, Number(value)));
    setScores((prev) => ({ ...prev, [key]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure closure field is included with 0 value for backend compatibility
    const scoresWithClosure = {
      ...scores,
      closure: 0 // Hidden field with 0 weight
    };
    const payload = {
      petitionId,
      // Send 1-10 values; backend will convert to percentages
      scores: scoresWithClosure,
      remarks,
      coachingArea,
      // csat excluded from backend payload per updated requirement
    };
    try {
      await rateQuery(payload).unwrap();
      onClose?.(true);
    } catch (err) {
      console.error('Rate error', err);
      alert(err?.data?.message || 'Failed to rate query');
    }
  };

  return (
    <>
      {/* Sliding panel from right - No backdrop overlay */}
      <div 
        className={`fixed top-0 right-0 h-screen bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '420px', maxWidth: '86vw' }}
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
              {readOnly ? 'View Query Weightage' : 'Set Query Weightage'}
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
          {/* Group metrics by category */}
          {['Chat Handling', 'Soft Skills', 'System & Compliance', 'Documentation'].map((category) => {
            const categoryMetrics = METRICS.filter(m => m.category === category && !m.hidden);
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

          {/* Remarks and Coaching Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Remarks
              </label>
              <textarea 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent resize-none text-sm" 
                rows={2} 
                disabled={readOnly}
                placeholder="Enter remarks..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Coaching Area
              </label>
              <textarea 
                value={coachingArea} 
                onChange={(e) => setCoachingArea(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:border-transparent resize-none text-sm" 
                rows={2} 
                disabled={readOnly}
                placeholder="Coaching areas..."
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
                performanceCategory === 'Average' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                performanceCategory === 'Poor' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' :
                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
              }`}>
                {performanceCategory}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
              0-20%: Very Poor | 21-40%: Poor | 41-60%: Average | 61-80%: Good | 81-100%: Excellent
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
                {isLoading ? 'Saving…' : 'Save Weightage'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
