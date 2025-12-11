import React, { useMemo, useState } from 'react';
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
  { key: 'toolEfficiency', label: 'Tool Navigation', weight: 5, category: 'System & Compliance' },
  { key: 'tagging', label: 'Tagging Accuracy', weight: 5, category: 'System & Compliance' },
  { key: 'escalation', label: 'Escalation Handling', weight: 5, category: 'System & Compliance' },
  
  // Documentation (10%)
  { key: 'documentation', label: 'Documentation Quality', weight: 10, category: 'Documentation' }
];

export default function RateQueryModal({ petitionId, onClose, readOnly = false, existingData = null }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{readOnly ? 'View Query Weightage' : 'Set Query Weightage'}</h2>
          <button className="text-gray-600 hover:text-black" onClick={() => onClose?.(false)}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Group metrics by category */}
          {['Chat Handling', 'Soft Skills', 'System & Compliance', 'Documentation'].map((category) => {
            const categoryMetrics = METRICS.filter(m => m.category === category && !m.hidden);
            const categoryWeight = categoryMetrics.reduce((sum, m) => sum + m.weight, 0);
            return (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">
                  {category} ({categoryWeight}%)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {categoryMetrics.map((m) => (
                    <label key={m.key} className="flex items-center justify-between gap-3 border rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-sm font-medium">{m.label} ({m.weight}%)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          step={1}
                          value={scores[m.key] ?? ''}
                          onChange={(e) => handleChange(m.key, e.target.value)}
                          className="w-16 border rounded px-2 py-1 text-right"
                          placeholder="1-10"
                          required
                          disabled={readOnly}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} disabled={readOnly} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Coaching Area</label>
              <textarea value={coachingArea} onChange={(e) => setCoachingArea(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} disabled={readOnly} />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t pt-3 mt-3">
            <div className="flex items-center justify-end gap-2">
              <div className="text-lg font-semibold">
                Total Weightage: <span className="text-indigo-600">{total}%</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-sm text-gray-600">Performance:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                performanceCategory === 'Excellent' ? 'bg-green-600' :
                performanceCategory === 'Good' ? 'bg-blue-600' :
                performanceCategory === 'Average' ? 'bg-yellow-600' :
                performanceCategory === 'Poor' ? 'bg-orange-600' :
                'bg-red-600'
              }`}>
                {performanceCategory}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-right">
              0-20%: Very Poor | 21-40%: Poor | 41-60%: Average | 61-80%: Good | 81-100%: Excellent
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2 rounded border" onClick={() => onClose?.(false)}>
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button type="submit" disabled={isLoading} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">
                {isLoading ? 'Saving…' : 'Save Weightage'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
