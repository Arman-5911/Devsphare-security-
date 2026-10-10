'use client';

import React from 'react';
import { AccessibilityDetails } from '@devsphere/shared';
import { Eye, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
  a11y?: AccessibilityDetails;
}

export function A11yCard({ a11y }: Props) {
  if (!a11y) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        No accessibility audit data recorded.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Accessibility & WCAG 2.1 AA Standards
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                a11y.score >= 90
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : a11y.score >= 70
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                Score: {a11y.score}/100
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated WCAG 2.1 AA heuristics • Color Contrast • Form Labels • Heading Skipping
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Violations: {a11y.totalViolations || 0}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Rules Checked: {a11y.wcagRulesChecked || 0}
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/40 border-b border-slate-800 text-center">
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Missing Image Alt</div>
          <div className={`text-xl font-bold mt-1 ${a11y.missingAltCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {a11y.missingAltCount || 0}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Contrast Issues</div>
          <div className={`text-xl font-bold mt-1 ${a11y.contrastIssuesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {a11y.contrastIssuesCount || 0}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Form Label Issues</div>
          <div className={`text-xl font-bold mt-1 ${a11y.formLabelIssuesCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {a11y.formLabelIssuesCount || 0}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Heading Skipped</div>
          <div className={`text-xl font-bold mt-1 ${a11y.headingSkippedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {a11y.headingSkippedCount || 0}
          </div>
        </div>
      </div>

      {/* Violations Explorer */}
      <div className="p-5">
        <h4 className="text-xs font-semibold text-slate-200 mb-3">Detected WCAG Non-Compliance Issues</h4>
        {a11y.violations && a11y.violations.length > 0 ? (
          <div className="space-y-2.5 max-h-72 overflow-y-auto">
            {a11y.violations.map((v, i) => (
              <div
                key={i}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      v.impact === 'critical'
                        ? 'bg-rose-500/20 text-rose-300'
                        : v.impact === 'serious'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {v.impact}
                    </span>
                    <span className="font-mono text-cyan-400 font-semibold">{v.id}</span>
                  </div>
                  <p className="text-slate-300">{v.description}</p>
                  {v.nodes && v.nodes.length > 0 && (
                    <div className="font-mono text-[11px] text-slate-500 truncate max-w-md">
                      Selector: {v.nodes[0].target?.join(', ')}
                    </div>
                  )}
                </div>
                {v.helpUrl && (
                  <a
                    href={v.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline shrink-0"
                  >
                    WCAG Docs &rarr;
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span className="text-slate-200 font-medium">No Automated WCAG 2.1 AA Violations Found</span>
            <span>All tested contrast ratios, accessible form names, and image alt tags conform to baseline criteria.</span>
          </div>
        )}
      </div>
    </div>
  );
}
