'use client';

import React, { useState } from 'react';
import { CrawlSummary } from '@devsphere/shared';
import { Compass, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface Props {
  crawl?: CrawlSummary;
}

export function CrawlInventoryCard({ crawl }: Props) {
  const [activeTab, setActiveTab] = useState<'pages' | 'broken' | 'external'>('pages');
  const [search, setSearch] = useState('');

  if (!crawl) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        No crawl inventory data recorded for this scan.
      </div>
    );
  }

  const filteredPages = (crawl.pages || []).filter(
    (p) => p.url.toLowerCase().includes(search.toLowerCase())
  );

  const allBrokenLinks = [
    ...(crawl.brokenInternalLinks || []).map((l) => ({ ...l, type: 'Internal' })),
    ...(crawl.brokenExternalLinks || []).map((l) => ({ ...l, type: 'External' })),
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Multi-Page Crawl & Link Inventory
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {crawl.pagesCrawled || 0} Pages Scanned
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bounded crawl scheduler • Same-origin inventory • Broken link detection
            </p>
          </div>
        </div>

        {/* Status Codes Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            2xx: {crawl.statusCodesCount?.['2xx'] || 0}
          </span>
          <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            3xx: {crawl.statusCodesCount?.['3xx'] || 0}
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            4xx: {crawl.statusCodesCount?.['4xx'] || 0}
          </span>
          <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            5xx: {crawl.statusCodesCount?.['5xx'] || 0}
          </span>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/40 border-b border-slate-800 text-center">
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Pages Crawled</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{crawl.pagesCrawled || 0}</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Links Discovered</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{crawl.totalLinksDiscovered || 0}</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Broken Links</div>
          <div className={`text-xl font-bold mt-1 ${allBrokenLinks.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {allBrokenLinks.length}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Soft 404 Status</div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            {crawl.soft404?.detected ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" /> Detected (HTTP 200)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="w-3.5 h-3.5" /> Clean (HTTP 404)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Soft 404 BugViso Callout */}
      {crawl.soft404?.detected && (
        <div className="p-4 bg-amber-500/5 border-b border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Soft 404 Vulnerability / Misconfiguration:</span> Non-existent route <code>{crawl.soft404.testedPath}</code> returned HTTP status 200 OK instead of HTTP 404 Not Found. This wastes search engine crawl budgets, produces indexing dilution, and confuses automated tooling.
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-6">
        <button
          onClick={() => setActiveTab('pages')}
          className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'pages'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Crawled Pages ({crawl.pages?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('broken')}
          className={`pb-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'broken'
              ? 'border-cyan-400 text-cyan-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Broken Links ({allBrokenLinks.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === 'pages' && (
          <div>
            <div className="mb-3 relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter crawled pages by URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Page URL</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 text-right">Links Count</th>
                    <th className="py-2.5 px-3 text-right">Load Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {filteredPages.map((page, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            page.statusCode >= 200 && page.statusCode < 300
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : page.statusCode >= 300 && page.statusCode < 400
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {page.statusCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate text-slate-200" title={page.url}>
                        {page.url}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate font-sans text-slate-400" title={page.title || ''}>
                        {page.title || '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {page.linksCount || 0}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {page.durationMs}ms
                      </td>
                    </tr>
                  ))}
                  {filteredPages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                        No pages match your filter query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'broken' && (
          <div>
            {allBrokenLinks.length > 0 ? (
              <div className="space-y-2">
                {allBrokenLinks.map((bl, i) => (
                  <div
                    key={i}
                    className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 font-mono font-bold rounded">
                          {bl.statusCode || 'ERR'}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                          {bl.type}
                        </span>
                        <span className="font-mono text-slate-200 break-all">{bl.url}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <span>Found on:</span>
                        <span className="text-slate-300 font-mono">{bl.sourcePage}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <span className="text-slate-200 font-medium">Zero Broken Links Found</span>
                <span>All tested internal and external anchor references responded with successful statuses.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
