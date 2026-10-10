'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Printer,
  Download,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Server,
  Lock,
  GitCommit,
  Cookie,
  FileText,
  CheckCircle2,
  Share2,
  Trash2,
} from 'lucide-react';
import { ScanResult, SecurityCategory } from '@devsphere/shared';
import { ScoreGauge } from '@/components/ScoreGauge';
import { TlsCard } from '@/components/TlsCard';
import { HeadersScorecard } from '@/components/HeadersScorecard';
import { RedirectChainCard } from '@/components/RedirectChainCard';
import { CookiesCard } from '@/components/CookiesCard';
import { FindingsList } from '@/components/FindingsList';
import { RadarChart } from '@/components/RadarChart';
import { CrawlInventoryCard } from '@/components/CrawlInventoryCard';
import { PerformanceCard } from '@/components/PerformanceCard';
import { A11yCard } from '@/components/A11yCard';
import { SeoGeoCard } from '@/components/SeoGeoCard';
import { HackRiskCard } from '@/components/HackRiskCard';
import { LoadCapacityCard } from '@/components/LoadCapacityCard';
import { getScan, cancelScan, deleteScan } from '@/lib/api-client';



export default function ScanReportPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!scan) return;
    if (!window.confirm(`Are you sure you want to delete scan '${scan.id}'? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteScan(scan.id);
      router.push('/history');
    } catch (err) {
      console.error(err);
      alert('Failed to delete scan');
      setIsDeleting(false);
    }
  };


  const fetchScanData = async () => {
    try {
      const data = await getScan(scanId);
      setScan(data);
      setIsLoading(false);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve scan data');
      setIsLoading(false);
      return null;
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const run = async () => {
      const initial = await fetchScanData();
      // If scan is still active or queued, poll every 2 seconds
      if (initial && !['completed', 'failed', 'cancelled'].includes(initial.status)) {
        interval = setInterval(async () => {
          const updated = await fetchScanData();
          if (updated && ['completed', 'failed', 'cancelled'].includes(updated.status)) {
            if (interval) clearInterval(interval);
          }
        }, 2000);
      }
    };

    run();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanId]);

  const handleCancel = async () => {
    if (!scan) return;
    setIsCancelling(true);
    try {
      await cancelScan(scan.id);
      await fetchScanData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-300">Retrieving security report for {scanId}...</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Scan Not Found or Inaccessible</h2>
        <p className="text-xs text-slate-400">{error || 'Unable to locate this scan record.'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Scanner
        </Link>
      </div>
    );
  }

  const isPending = !['completed', 'failed', 'cancelled'].includes(scan.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-white/10 bg-slate-900/60 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500">{scan.id}</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  scan.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : scan.status === 'failed'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/20 animate-pulse'
                }`}
              >
                {scan.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white break-all">
              {scan.targetUrl}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {isPending && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-3 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold"
            >
              Cancel Scan
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-mono transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export PDF / Print</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-mono transition-colors disabled:opacity-50"
            title="Delete this scan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>

      </div>

      {/* Progress banner if still scanning */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-300 animate-pulse no-print">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
          <div>
            <span className="font-bold">Automated Analysis in Progress:</span> Currently running {scan.status}... This page will automatically update as results finalize.
          </div>
        </div>
      )}

      {/* Executive Summary Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
          {/* Left: Summary Data */}
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-cyan-400 text-xs font-mono border border-blue-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Executive Audit Summary
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                scan.mode === 'infrastructure_load'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : scan.mode === 'verified_deep'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}>
                {scan.mode === 'infrastructure_load'
                  ? 'Mode C: Resilience'
                  : scan.mode === 'verified_deep'
                  ? 'Mode B: Deep Audit'
                  : 'Mode A: Public Audit'}
              </span>

            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Multi-Pillar Website Audit & Security Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {scan.score?.summary || 'Multi-pillar audit evaluation in progress...'}
            </p>

            {/* 5-Pillar Score Pills */}
            {scan.multiPillar && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Performance</div>
                  <div className="text-sm font-bold text-blue-400 mt-0.5">{scan.multiPillar.radar.performance}/100</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Accessibility</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{scan.multiPillar.radar.accessibility}/100</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">SEO & GEO</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{scan.multiPillar.radar.seo}/100</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Security</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">{scan.multiPillar.radar.security}/100</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Code QA</div>
                  <div className="text-sm font-bold text-purple-400 mt-0.5">{scan.multiPillar.radar.codeQa}/100</div>
                </div>
              </div>
            )}

            {/* Metadata tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Hostname</span>
                <span className="text-slate-200 font-semibold truncate block">{scan.targetHostname}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Analysis Duration</span>
                <span className="text-cyan-400 font-semibold">{scan.durationMs}ms</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-500 block">Execution Timestamp</span>
                <span className="text-slate-300 font-semibold">{new Date(scan.startedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Right: Score Gauge & Radar Chart */}
          <div className="w-full xl:w-auto flex flex-col md:flex-row items-center justify-center gap-6 border-t xl:border-t-0 xl:border-l border-white/10 pt-6 xl:pt-0 xl:pl-8">
            <ScoreGauge
              score={scan.score?.overallScore || 0}
              grade={scan.score?.letterGrade || 'F'}
              size={170}
              coverageScore={scan.score?.coverageScore}
            />
            {scan.multiPillar && (
              <div className="w-64 h-56 flex items-center justify-center">
                <RadarChart scores={scan.multiPillar} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Hack Risk & Exploitability Intelligence */}
      {scan.hackRisk && <HackRiskCard hackRisk={scan.hackRisk} />}

      {/* Mode C Load & Capacity Card */}
      {scan.loadCapacity && <LoadCapacityCard loadData={scan.loadCapacity} />}

      {/* Multi-Page Crawler & Link Inventory */}
      {scan.crawl && <CrawlInventoryCard crawl={scan.crawl} />}

      {/* Advanced Performance & Core Web Vitals */}
      {scan.performance && <PerformanceCard perf={scan.performance} />}

      {/* Accessibility & WCAG Standards */}
      {scan.accessibility && <A11yCard a11y={scan.accessibility} />}

      {/* SEO & AI Search Readiness */}
      {scan.seo && <SeoGeoCard seo={scan.seo} />}

      {/* Deep Inspection Cards Grid */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Surface Inspection Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TlsCard tls={scan.tls} />
          <RedirectChainCard redirects={scan.redirects} />
        </div>

        <HeadersScorecard headers={scan.headers} />
        <CookiesCard cookies={scan.cookies} />
      </div>


      {/* Actionable Findings & Remediation Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Actionable Findings & Remediation Guides</span>
            </h3>
            <p className="text-xs text-slate-400">
              Deterministic security detections with copyable server configurations and compliance citations.
            </p>
          </div>
        </div>

        <FindingsList findings={scan.findings} />
      </div>

      {/* Explicit Compliance & Limitation Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 space-y-1">
        <span className="font-mono text-slate-300 font-semibold block">ASSESSMENT DISCLAIMER:</span>
        <p className="leading-relaxed">
          This report represents a point-in-time passive evaluation of publicly visible HTTP/TLS attributes for {scan.targetHostname}. It does not constitute a full penetration test, vulnerability audit of internal logic, or certification of absence of zero-day exploits.
        </p>
      </div>
    </div>
  );
}
