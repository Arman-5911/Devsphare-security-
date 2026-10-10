'use client';

import React, { useState } from 'react';
import { ScanFinding, FindingSeverity, SecurityCategory } from '@devsphere/shared';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Search,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

interface FindingsListProps {
  findings: ScanFinding[];
}

export function FindingsList({ findings }: FindingsListProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(
    findings.length > 0 ? findings[0].id : null
  );
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter findings
  const filtered = findings.filter((f) => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchRule = f.ruleId.toLowerCase().includes(q);
      const matchDesc = f.description.toLowerCase().includes(q);
      return matchTitle || matchRule || matchDesc;
    }
    return true;
  });

  const getSeverityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Info className="w-3.5 h-3.5" /> LOW
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <Info className="w-3.5 h-3.5" /> INFO
          </span>
        );
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings by rule ID, title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Severities ({findings.length})</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Categories</option>
            <option value="ssl_tls">SSL/TLS</option>
            <option value="security_headers">Security Headers</option>
            <option value="cookie_security">Cookie Security</option>
            <option value="network_redirects">Network & Redirects</option>
            <option value="info_disclosure">Info Disclosure</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>Showing {filtered.length} of {findings.length} findings</span>
        {filtered.length === 0 && (
          <span className="text-amber-400">No findings match the current filters.</span>
        )}
      </div>

      {/* Findings Accordion List */}
      <div className="space-y-3">
        {filtered.map((finding) => {
          const isExpanded = expandedId === finding.id;
          const activeTab = activeSnippetTab[finding.id] || 0;

          return (
            <div
              key={finding.id}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900/90 border-blue-500/40 shadow-glow-blue'
                  : 'bg-slate-900/40 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                className="p-4 cursor-pointer flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {getSeverityBadge(finding.severity)}
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                    {finding.ruleId}
                  </span>
                  <span className="font-semibold text-white text-sm">
                    {finding.title}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                    -{finding.scoreDeduction} pts
                  </span>
                  <button className="text-slate-400 hover:text-white p-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-5 text-xs">
                  {/* Description */}
                  <p className="text-slate-300 leading-relaxed text-sm">
                    {finding.description}
                  </p>

                  {/* Impact & Explanation Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <h5 className="font-mono text-[11px] text-cyan-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Technical Explanation
                      </h5>
                      <p className="text-slate-300 leading-relaxed">
                        {finding.explanation}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/20">
                      <h5 className="font-mono text-[11px] text-red-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Potential Impact
                      </h5>
                      <p className="text-slate-300 leading-relaxed">
                        {finding.potentialImpact}
                      </p>
                    </div>
                  </div>

                  {/* Technical Evidence */}
                  {Object.keys(finding.evidence || {}).length > 0 && (
                    <div className="p-3.5 rounded-lg bg-slate-950/80 border border-white/5">
                      <h5 className="font-mono text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">
                        Technical Evidence
                      </h5>
                      <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto bg-[#070B14] p-3 rounded-lg border border-white/5">
                        {JSON.stringify(finding.evidence, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Remediation Guide */}
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-mono text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" /> Recommended Remediation
                      </h5>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {finding.remediation}
                    </p>

                    {/* Configuration Snippets Tabs */}
                    {finding.snippets && finding.snippets.length > 0 && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-white/10 bg-[#070B14]">
                        {/* Tabs Header */}
                        <div className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 border-b border-white/10">
                          <div className="flex items-center gap-1">
                            {finding.snippets.map((snip, idx) => (
                              <button
                                key={snip.server}
                                onClick={() =>
                                  setActiveSnippetTab({
                                    ...activeSnippetTab,
                                    [finding.id]: idx,
                                  })
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                                  activeTab === idx
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {snip.server.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() =>
                              copyToClipboard(
                                finding.snippets[activeTab]?.code || '',
                                `${finding.id}-${activeTab}`
                              )
                            }
                            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            {copiedId === `${finding.id}-${activeTab}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Config</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Code Block */}
                        <pre className="p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                          {finding.snippets[activeTab]?.code}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Standards & Compliance References */}
                  {finding.standards && finding.standards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500 font-mono">Standards:</span>
                      {finding.standards.map((std, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/10"
                        >
                          {std.framework} {std.identifier} — {std.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Verification Steps */}
                  {finding.verificationSteps && finding.verificationSteps.length > 0 && (
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-300 font-mono">Verification:</span>
                      {finding.verificationSteps.map((step, i) => (
                        <div key={i} className="font-mono text-slate-400 pl-2 border-l border-blue-500/30">
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
