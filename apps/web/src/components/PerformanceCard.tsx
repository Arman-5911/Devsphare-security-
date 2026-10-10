'use client';

import React, { useState } from 'react';
import { PerformanceDetails } from '@devsphere/shared';
import { Gauge, Zap, Image as ImageIcon, Code, Clock, AlertCircle } from 'lucide-react';

interface Props {
  perf?: PerformanceDetails;
}

export function PerformanceCard({ perf }: Props) {
  const [activeTab, setActiveTab] = useState<'cwv' | 'coverage' | 'assets' | 'waterfall'>('cwv');

  if (!perf) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        No performance audit metrics recorded.
      </div>
    );
  }

  const getMetricBadge = (val: number, goodMax: number, poorMin: number, unit = 'ms') => {
    let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let status = 'Good';
    if (val > poorMin) {
      color = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      status = 'Poor';
    } else if (val > goodMax) {
      color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      status = 'Needs Improvement';
    }

    return (
      <div className="flex items-center justify-between mt-2">
        <span className="text-xl font-bold font-mono text-slate-100">
          {val.toLocaleString()} {unit}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-semibold ${color}`}>
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              Performance Intelligence & Core Web Vitals
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                perf.score >= 90
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : perf.score >= 50
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                Score: {perf.score}/100
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chromium Lab Metrics • JavaScript/CSS Code Coverage • Mobile 1.6 Mbps Simulation
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400">Total Transferred</div>
          <div className="text-sm font-mono font-bold text-slate-200">
            {((perf.totalTransferredBytes || 0) / 1024).toFixed(1)} KB
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-3 gap-6 text-xs">
        <button
          onClick={() => setActiveTab('cwv')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'cwv'
              ? 'border-blue-400 text-blue-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Core Web Vitals
        </button>
        <button
          onClick={() => setActiveTab('coverage')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'coverage'
              ? 'border-blue-400 text-blue-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Code Coverage & Bloat
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-blue-400 text-blue-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Image & Render Blocking
        </button>
        <button
          onClick={() => setActiveTab('waterfall')}
          className={`pb-3 font-medium border-b-2 transition-colors ${
            activeTab === 'waterfall'
              ? 'border-blue-400 text-blue-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Network Waterfall
        </button>
      </div>

      <div className="p-5">
        {/* TAB 1: Core Web Vitals */}
        {activeTab === 'cwv' && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">TTFB (Server Response)</div>
              {getMetricBadge(perf.ttfbMs || 0, 800, 1800)}
              <p className="text-[10px] text-slate-500 mt-2">Target &lt;800ms. Time before browser receives first byte.</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">FCP (First Contentful)</div>
              {getMetricBadge(perf.fcpMs || 0, 1800, 3000)}
              <p className="text-[10px] text-slate-500 mt-2">Target &lt;1.8s. Time when first DOM content renders.</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">LCP (Largest Contentful)</div>
              {getMetricBadge(perf.lcpMs || 0, 2500, 4000)}
              <p className="text-[10px] text-slate-500 mt-2">Target &lt;2.5s. Main visible content render completion.</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">CLS (Layout Shift)</div>
              {getMetricBadge(perf.cls || 0, 0.1, 0.25, '')}
              <p className="text-[10px] text-slate-500 mt-2">Target &lt;0.1. Visual layout stability score.</p>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">TBT (Total Blocking)</div>
              {getMetricBadge(perf.tbtMs || 0, 200, 600)}
              <p className="text-[10px] text-slate-500 mt-2">Target &lt;200ms. Main-thread blocking tasks sum.</p>
            </div>
          </div>
        )}

        {/* TAB 2: Code Coverage */}
        {activeTab === 'coverage' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                Unused JavaScript & CSS Transfer Waste
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Code that was downloaded and parsed by the browser but never invoked during initial render.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900/80 rounded border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Unused JavaScript</span>
                    <span className="font-mono text-amber-400">
                      {perf.unusedJsBytes ? `${(perf.unusedJsBytes / 1024).toFixed(1)} KB` : '0 KB'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((perf.unusedJsBytes || 0) /
                              Math.max(1, perf.totalTransferredBytes || 102400)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 rounded border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Unused CSS</span>
                    <span className="font-mono text-blue-400">
                      {perf.unusedCssBytes ? `${(perf.unusedCssBytes / 1024).toFixed(1)} KB` : '0 KB'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((perf.unusedCssBytes || 0) /
                              Math.max(1, perf.totalTransferredBytes || 102400)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* BugViso-style Mobile Delay Insight */}
              {perf.estimatedTransferPenaltyMs > 0 && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Mobile Bandwidth Impact:</strong> Transferring unused code adds an estimated{' '}
                    <strong>+{(perf.estimatedTransferPenaltyMs / 1000).toFixed(2)}s delay</strong> on standard mobile 3G/4G (1.6 Mbps) connections.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Assets & Render Blocking */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Unoptimized Images ({perf.unoptimizedImages?.length || 0})
              </h3>
              {perf.unoptimizedImages && perf.unoptimizedImages.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {perf.unoptimizedImages.map((img, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-md font-mono text-slate-300" title={img.url}>
                        {img.url}
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 font-mono">
                        <span>Size: {img.sizeKb} KB</span>
                        {img.notModernFormat && (
                          <span className="text-amber-400 text-[10px]">Convert to WebP/AVIF</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800 rounded text-slate-400 text-xs">
                  All detected images utilize modern responsive dimensions or WebP/AVIF formats.
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Render-Blocking Resources ({perf.renderBlockingCount || 0})
              </h3>
              <p className="text-xs text-slate-400">
                {perf.renderBlockingCount > 0
                  ? `${perf.renderBlockingCount} synchronous external CSS or JavaScript resources detected in the critical path.`
                  : 'Zero render-blocking scripts detected in the document <head>.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Network Waterfall */}
        {activeTab === 'waterfall' && (
          <div>
            <h3 className="text-xs font-semibold text-slate-200 mb-2">Network Request Waterfall</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-xs">
              {(perf.waterfall || []).map((req, i) => (
                <div
                  key={i}
                  className="p-2 bg-slate-950/60 border border-slate-800/80 rounded flex items-center justify-between gap-2"
                >
                  <div className="truncate max-w-sm text-slate-300" title={req.url}>
                    {req.url}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-slate-500 uppercase">{req.resourceType}</span>
                    <span className="text-slate-400">{((req.transferredBytes || 0) / 1024).toFixed(1)} KB</span>
                    <span className="text-blue-400 font-bold">{req.durationMs}ms</span>
                  </div>
                </div>
              ))}
              {(!perf.waterfall || perf.waterfall.length === 0) && (
                <div className="p-4 text-center text-slate-500">
                  No waterfall items recorded for this scan.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
