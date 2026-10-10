'use client';

import React from 'react';
import { X, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ScanFinding } from '@devsphere/shared';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    scanA: { id: string; targetUrl: string; startedAt: string; score: number; grade: string };
    scanB: { id: string; targetUrl: string; startedAt: string; score: number; grade: string };
    scoreDelta: number;
    improved: boolean;
    resolvedFindings: ScanFinding[];
    newFindings: ScanFinding[];
    persistentFindings: ScanFinding[];
  } | null;
}

export function CompareModal({ isOpen, onClose, data }: CompareModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 flex flex-col overflow-hidden bg-[#0A0F1E]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Historical Posture Comparison</h2>
              <p className="text-xs text-slate-400 font-mono">
                Comparative Delta between Scan A and Scan B
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Comparison Summary */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scan A */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Baseline Scan A</span>
              <p className="font-semibold text-white text-xs truncate">{data.scanA.targetUrl}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-cyan-400">{data.scanA.score}/100</span>
                <span className="text-xs font-mono text-slate-400">({data.scanA.grade})</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date(data.scanA.startedAt).toLocaleString()}
              </p>
            </div>

            {/* Delta Card */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Score Delta</span>
              <div className="flex items-center gap-1.5">
                {data.scoreDelta >= 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      +{data.scoreDelta} pts
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <span className="text-2xl font-bold font-mono text-red-400">
                      {data.scoreDelta} pts
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {data.improved ? 'Security posture improved' : 'Security posture regressed'}
              </span>
            </div>

            {/* Scan B */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Recent Scan B</span>
              <p className="font-semibold text-white text-xs truncate">{data.scanB.targetUrl}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-blue-400">{data.scanB.score}/100</span>
                <span className="text-xs font-mono text-slate-400">({data.scanB.grade})</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date(data.scanB.startedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Resolved Findings (Fixed in B) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Resolved Findings ({data.resolvedFindings.length})
            </h4>
            {data.resolvedFindings.length > 0 ? (
              <div className="space-y-2">
                {data.resolvedFindings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-emerald-400 font-bold mr-2">[{f.ruleId}]</span>
                      <span className="text-white font-medium">{f.title}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded">
                      Remediated (+{f.scoreDeduction} pts)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">No prior findings were resolved between these scans.</p>
            )}
          </div>

          {/* New Findings (Introduced in B) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-red-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> New Incongruencies Introduced ({data.newFindings.length})
            </h4>
            {data.newFindings.length > 0 ? (
              <div className="space-y-2">
                {data.newFindings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-red-400 font-bold mr-2">[{f.ruleId}]</span>
                      <span className="text-white font-medium">{f.title}</span>
                    </div>
                    <span className="text-red-400 font-mono text-[11px] bg-red-500/10 px-2 py-0.5 rounded">
                      New (-{f.scoreDeduction} pts)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">No new regressions detected in this scan.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
