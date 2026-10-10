'use client';

import React from 'react';
import { HackRiskDetails } from '@devsphere/shared';
import { ShieldAlert, Crosshair, AlertOctagon, TrendingUp, CheckCircle, Info } from 'lucide-react';

interface Props {
  hackRisk?: HackRiskDetails;
}

export function HackRiskCard({ hackRisk }: Props) {
  if (!hackRisk) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        Insufficient evidence to calculate exploitability posture.
      </div>
    );
  }

  const getExploitColor = (lvl: string) => {
    switch (lvl?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Hack Risk & Exploitability Intelligence
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase font-mono ${getExploitColor(hackRisk.exploitabilityLevel)}`}>
                {hackRisk.exploitabilityLevel} EXPLOITABILITY
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evidence-Based Assessment • CVSS v4.0 & EPSS Correlation • Residual Risk Modeling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">Confidence</span>
            <span className="font-mono text-cyan-400 font-bold">{hackRisk.confidenceLevel}</span>
          </div>
          <div className="text-right pl-3 border-l border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase">Exposure Score</span>
            <span className="font-mono text-purple-400 font-bold">{hackRisk.exposureScore}/100</span>
          </div>

        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/40 border-b border-slate-800 text-center">
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Attack Surface</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {hackRisk.attackSurfaceScore}/100
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Max CVSS Score</div>
          <div className={`text-xl font-bold font-mono mt-1 ${hackRisk.cvssMax && hackRisk.cvssMax >= 7.0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {hackRisk.cvssMax ? hackRisk.cvssMax.toFixed(1) : 'None'}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Business Impact</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-1 uppercase">
            {hackRisk.estimatedBusinessImpact}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Avg EPSS Probability</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {hackRisk.epssAverage ? `${(hackRisk.epssAverage * 100).toFixed(1)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* EPSS Educational Callout */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          <strong>Methodological Transparency:</strong> EPSS (Exploit Prediction Scoring System) estimates the likelihood that a specific software vulnerability will be exploited in the wild over a 30-day window. It does not represent an absolute guarantee of site breach.
        </span>
      </div>

      {/* Attack Vectors & Residual Risk */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400" />
            Identified Attack Surface Vectors
          </h4>
          <div className="space-y-2">
            {hackRisk.keyAttackVectors && hackRisk.keyAttackVectors.length > 0 ? (
              hackRisk.keyAttackVectors.map((vec, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-rose-500/5 border border-rose-500/15 rounded text-xs text-rose-300 font-mono"
                >
                  • {vec}
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded text-slate-500 text-xs">
                No high-confidence external attack vectors identified.
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Residual Risk Analysis & Summary
          </h4>
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed">
            <div className="mb-2 font-medium text-cyan-300">{hackRisk.summary}</div>
            <div className="text-slate-400 font-mono text-[11px] pt-2 border-t border-slate-800">
              Residual Risk: {hackRisk.residualRisk}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
