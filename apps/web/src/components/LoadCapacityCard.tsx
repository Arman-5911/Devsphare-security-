'use client';

import React from 'react';
import { LoadCapacityDetails } from '@devsphere/shared';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
  loadData?: LoadCapacityDetails;
}

export function LoadCapacityCard({ loadData }: Props) {
  if (!loadData) return null;

  return (
    <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-4 bg-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Mode C — Infrastructure Resilience & Capacity
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                {loadData.virtualUsersTested} Concurrent VUs
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SLO-based stress profiling • p95 latency verification • Automatic circuit breakers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {loadData.circuitBreakerTriggered ? (
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Circuit Breaker Tripped
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> SLOs Maintained
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/40 border-b border-slate-800 text-center font-mono">
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase font-sans">Throughput (RPS)</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{(loadData.requestsPerSecond || 0).toFixed(1)} req/s</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase font-sans">p95 Latency</div>
          <div className={`text-xl font-bold mt-1 ${loadData.p95LatencyMs > 2000 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {loadData.p95LatencyMs} ms
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase font-sans">p99 Latency</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{loadData.p99LatencyMs} ms</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase font-sans">Error Rate</div>
          <div className={`text-xl font-bold mt-1 ${loadData.errorRatePercent > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {(loadData.errorRatePercent || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Defensible Capacity Statement */}
      <div className="p-5 bg-slate-950/70 text-xs">
        <div className="text-slate-400 uppercase tracking-wider text-[11px] font-semibold mb-1">
          Defensible Capacity Assessment
        </div>
        <div className="text-slate-200 font-sans leading-relaxed text-sm bg-purple-950/30 border border-purple-500/20 p-3.5 rounded-lg">
          &ldquo;{loadData.capacityStatement}&rdquo;
        </div>
      </div>
    </div>
  );
}
