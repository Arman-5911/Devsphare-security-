'use client';

import React from 'react';
import { RedirectAnalysis } from '@devsphere/shared';
import { GitCommit, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RedirectChainCardProps {
  redirects?: RedirectAnalysis;
}

export function RedirectChainCard({ redirects }: RedirectChainCardProps) {
  if (!redirects) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Network & Redirect Hops</h3>
            <p className="text-xs text-slate-400 font-mono">
              HTTP-to-HTTPS Enforcement & Route Flow
            </p>
          </div>
        </div>

        <div>
          {redirects.isHttpToHttpsRedirect ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> HTTPS Enforced
            </span>
          ) : redirects.initialUrl.startsWith('http://') ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> No Auto-HTTPS Redirect
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-800 border border-white/10">
              Direct Destination
            </span>
          )}
        </div>
      </div>

      {/* Redirect Chain Flow Diagram */}
      {redirects.redirectChain.length > 0 ? (
        <div className="space-y-2 pt-2">
          {redirects.redirectChain.map((hop, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs font-mono"
            >
              <span className="w-6 h-6 rounded-full bg-blue-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-[11px]">
                {hop.hopNumber}
              </span>

              <div className="flex-1 truncate">
                <span className="text-slate-300 truncate block">{hop.url}</span>
              </div>

              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                HTTP {hop.statusCode}
              </span>

              <span className="text-slate-500 text-[11px]">{hop.durationMs}ms</span>
            </div>
          ))}

          {/* Final Hop */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[11px]">
              &check;
            </span>
            <div className="flex-1 truncate">
              <span className="text-white font-semibold truncate block">
                {redirects.finalUrl}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
              TERMINAL
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 text-xs text-slate-400 font-mono">
          Single request landed directly at target without intermediate hops.
        </div>
      )}
    </div>
  );
}
