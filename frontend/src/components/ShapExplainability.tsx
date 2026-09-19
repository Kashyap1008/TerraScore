import React from 'react';
import { computeShapExplainer, type ShapReport } from '../utils/shapExplainer';

interface ShapExplainabilityProps {
  score: number;
  grade: string;
  preset: string;
  factors: { key: string; label: string; raw: number; contribution?: number; explanation?: string }[];
  onClose?: () => void;
}

export default function ShapExplainability({
  score,
  grade,
  preset,
  factors,
  onClose,
}: ShapExplainabilityProps) {
  const report: ShapReport = computeShapExplainer(score, preset, factors);

  return (
    <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-2xl p-5 text-slate-800 font-sans max-w-lg w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>🧠 SHAP ATTRIBUTION & DECISION RATIONALE</span>
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 font-mono text-sm px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Summary Score Baseline vs Local Score */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-500">Metro Baseline Score</div>
          <div className="text-sm font-bold text-slate-700 font-mono">{report.baseValue} / 100</div>
        </div>

        <div className="text-center px-3">
          <span className="text-xs font-mono font-bold text-slate-400">&rarr;</span>
          <div
            className={`text-xs font-mono font-extrabold ${
              report.netDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {report.netDelta >= 0 ? `+${report.netDelta}` : report.netDelta} pts
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase font-mono font-semibold text-slate-500">Evaluated Site Score</div>
          <div className="text-base font-extrabold text-slate-900 font-mono flex items-center gap-1.5 justify-end">
            <span>{score}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-xs">
              {grade}
            </span>
          </div>
        </div>
      </div>

      {/* Industry Fit Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          Industry Fit ({preset.toUpperCase()}):
        </span>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          ✨ {report.industryFitBadge}
        </span>
      </div>

      {/* Executive Plain-English Business Case */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 mb-4 text-xs text-emerald-950 leading-relaxed">
        <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
          <span>💼 Executive Investment Summary:</span>
        </div>
        <p>{report.executiveVerdict}</p>
      </div>

      {/* SHAP Factor Contribution Breakdown */}
      <div className="space-y-3 mb-4">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
          Factor Attribution vs Metro Average:
        </div>

        {report.factors.map((f) => {
          const barWidth = Math.min(100, Math.max(8, (Math.abs(f.contributionPoints) / 20) * 100));
          return (
            <div key={f.key} className="bg-white border border-slate-100 rounded-lg p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={f.isPositive ? 'text-emerald-600' : 'text-rose-500'}>
                    {f.isPositive ? '▲' : '▼'}
                  </span>
                  {f.label}
                </span>
                <span
                  className={`font-mono font-bold text-xs ${
                    f.isPositive ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {f.contributionPoints >= 0 ? `+${f.contributionPoints}` : f.contributionPoints} pts
                </span>
              </div>

              {/* Force Contribution Bar */}
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5 flex">
                <div
                  className={`h-full rounded-full ${
                    f.isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-600 leading-snug">{f.explanation}</div>
            </div>
          );
        })}
      </div>

      {/* Key Strengths & Risks bullet points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="font-bold text-emerald-800 mb-1">✅ Core Tailwinds:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
            {report.strengths.slice(0, 2).map((s, i) => (
              <li key={i} className="truncate" title={s}>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="font-bold text-amber-800 mb-1">⚠️ Headwinds / Trade-offs:</div>
          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
            {report.risks.length > 0 ? (
              report.risks.slice(0, 2).map((r, i) => (
                <li key={i} className="truncate" title={r}>
                  {r}
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No significant headwinds detected.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
