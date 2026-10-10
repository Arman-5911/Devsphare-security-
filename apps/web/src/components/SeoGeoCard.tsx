'use client';

import React, { useState } from 'react';
import { SeoDetails } from '@devsphere/shared';
import { Search, Bot, AlertTriangle, CheckCircle, Tag } from 'lucide-react';

interface Props {
  seo?: SeoDetails;
}

export function SeoGeoCard({ seo }: Props) {
  const [activeTab, setActiveTab] = useState<'metadata' | 'ai' | 'schema'>('metadata');

  if (!seo) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        No SEO and AI Search data recorded.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              SEO & AI Search Engine Readiness (GEO)
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                seo.score >= 80
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : seo.score >= 50
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                Score: {seo.score}/100
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                GEO: {seo.geoScore || 0}/100
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Metadata Analysis • Schema.org Entities • AI Crawler Directives (GPTBot, ClaudeBot, Perplexity)
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Headings</div>
          <div className="text-sm font-mono font-bold text-slate-200">
            H1: {seo.h1Count || 0}
          </div>
        </div>
      </div>

      {/* SPA Blank Screen Risk Callout */}
      {seo.wordCountAnalysis?.spaBlankRisk && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Single Page App (SPA) Crawlability Alert:</span> Raw HTML contains only{' '}
            <strong>{seo.wordCountAnalysis.rawHtmlWords} words</strong>, whereas rendered client DOM has{' '}
            <strong>{seo.wordCountAnalysis.renderedWords} words</strong>. Search and AI crawlers with limited JS execution capability may index an empty shell. Recommend Server-Side Rendering (SSR) or Static Site Generation (SSG).
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-6 text-xs">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'metadata'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Meta & Headings
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'ai'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Crawler Matrix ({seo.aiCrawlerAccess?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'schema'
              ? 'border-amber-400 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Schema.org Entities ({seo.structuredData?.entities?.length || 0})
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Page Title</div>
                <div className="text-sm font-medium text-slate-200 break-words">
                  {seo.title || <span className="text-rose-400 italic">Missing &lt;title&gt; tag</span>}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Length: {seo.titleLength || 0} chars (Optimal: 40-60 chars)
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Meta Description</div>
                <div className="text-sm text-slate-300 break-words">
                  {seo.metaDescription || (
                    <span className="text-amber-400 italic">Missing &lt;meta name=&quot;description&quot;&gt;</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Length: {seo.metaDescriptionLength || 0} chars (Optimal: 120-160 chars)
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-400">Canonical Tag: </span>
                <span className="font-mono text-slate-200">{seo.canonicalUrl || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-400">Open Graph: </span>
                <span className={Object.keys(seo.openGraph || {}).length > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                  {Object.keys(seo.openGraph || {}).length > 0 ? `${Object.keys(seo.openGraph).length} tags` : 'Not configured'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Heading Hierarchy: </span>
                <span className={seo.headingsHierarchyIssues?.length > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {seo.headingsHierarchyIssues?.length > 0 ? `${seo.headingsHierarchyIssues.length} issues` : 'Optimal'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            <p className="text-xs text-slate-400 mb-3">
              Robots.txt access permissions for Generative Search and LLM training crawlers:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(seo.aiCrawlerAccess || []).map((bot, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{bot.bot}</div>
                      <div className="text-[10px] text-slate-500">{bot.platform}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      bot.allowed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {bot.allowed ? 'Allowed' : 'Blocked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div>
            {seo.structuredData?.entities && seo.structuredData.entities.length > 0 ? (
              <div className="space-y-2">
                {seo.structuredData.entities.map((ent, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono text-amber-300 font-semibold">{ent}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono">
                      JSON-LD Structured Entity
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No Schema.org JSON-LD microdata detected on the scanned root page. Adding structured data enables Google rich snippets and AI knowledge graph ingestion.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
