'use client';

import React from 'react';
import { SecurityHeadersAnalysis } from '@devsphere/shared';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface HeadersScorecardProps {
  headers?: SecurityHeadersAnalysis;
}

export function HeadersScorecard({ headers }: HeadersScorecardProps) {
  if (!headers || !headers.items) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'optimal':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Optimal
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> Suboptimal
          </span>
        );
      case 'critical':
      case 'missing':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <XCircle className="w-3 h-3" /> Missing
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full border border-slate-500/20">
            <Info className="w-3 h-3" /> Informational
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">HTTP Security Headers</h3>
          <p className="text-xs text-slate-400 font-mono">Defense-in-depth Browser Directives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {headers.items.map((item) => (
          <div
            key={item.name}
            className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-mono text-xs font-semibold text-white truncate">
                  {item.name}
                </span>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {item.feedback}
              </p>
            </div>

            {item.value && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 font-mono block mb-0.5">Value:</span>
                <p className="text-[10px] font-mono text-cyan-300 bg-slate-900/80 p-1.5 rounded border border-white/5 truncate" title={item.value}>
                  {item.value}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
