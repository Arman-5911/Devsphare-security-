'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Search,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { ScanSummaryItem } from '@devsphere/shared';
import { ScoreGauge } from '@/components/ScoreGauge';
import { listScans } from '@/lib/api-client';

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listScans({ limit: 10 });
      setScans(data.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard scans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const latestScan = scans.length > 0 ? scans[0] : null;

  // Aggregate stats across all scans
  const totalScans = scans.length;
  const avgScore =
    totalScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + (s.overallScore || 0), 0) / totalScans)
      : 0;
  const criticalsCount = scans.reduce((acc, s) => acc + (s.findingsCount?.critical || 0), 0);
  const highsCount = scans.reduce((acc, s) => acc + (s.findingsCount?.high || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Security Dashboard
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time security posture scoring, active findings distribution, and historical health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScans}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-glow-blue"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Total Completed Scans
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{totalScans}</span>
            <span className="text-xs text-cyan-400 font-mono">100% passive</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Average Posture Score
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-blue-400">{avgScore}/100</span>
            <span className="text-xs text-slate-400 font-mono">across domains</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-1">
          <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical Vulnerabilities
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-red-400">{criticalsCount}</span>
            <span className="text-xs text-red-400/80 font-mono">Requires action</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-orange-500/20 bg-orange-950/10 space-y-1">
          <span className="text-[11px] font-mono text-orange-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> High Risk Incongruities
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-orange-400">{highsCount}</span>
            <span className="text-xs text-orange-400/80 font-mono">Headers & TLS</span>
          </div>
        </div>
      </div>

      {/* Latest Target Spotlight & Score Gauge */}
      {latestScan ? (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Spotlight Left */}
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-mono">
              <Activity className="w-3.5 h-3.5" /> Most Recent Target Evaluation
            </div>
            <h2 className="text-2xl font-bold text-white break-all">
              {latestScan.targetUrl}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(latestScan.startedAt).toLocaleString()}
              </span>
              <span>•</span>
              <span className="text-slate-300">Duration: {latestScan.durationMs}ms</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold uppercase">{latestScan.status}</span>
            </div>

            {/* Severity badges breakdown */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                {latestScan.findingsCount?.critical || 0} Critical
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                {latestScan.findingsCount?.high || 0} High
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {latestScan.findingsCount?.medium || 0} Medium
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {latestScan.findingsCount?.low || 0} Low
              </span>
            </div>

            <div className="pt-2">
              <Link
                href={`/scans/${latestScan.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs tracking-wider uppercase shadow-glow-blue transition-all"
              >
                <span>View Full Executive Report</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Spotlight Right (Gauge) */}
          <div className="flex justify-center border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
            <ScoreGauge
              score={latestScan.overallScore}
              grade={latestScan.letterGrade}
              size={190}
            />
          </div>
        </div>
      ) : (
        <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Website Scans Recorded Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Kick off your first automated security audit to populate posture score metrics, findings by severity, and remediation guidance.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-glow-blue uppercase"
          >
            Launch First Audit
          </Link>
        </div>
      )}

      {/* Recent Scans Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Recent Posture Audits</h3>
          <Link
            href="/history"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Scans & History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 font-medium">Target URL</th>
                <th className="pb-3 font-medium text-center">Score</th>
                <th className="pb-3 font-medium text-center">Grade</th>
                <th className="pb-3 font-medium">Findings Breakdown</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-white/[0.02]">
                  <td className="py-3.5 pr-4">
                    <span className="text-white font-semibold block truncate max-w-xs">
                      {scan.targetUrl}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{scan.id}</span>
                  </td>

                  <td className="py-3.5 px-2 text-center">
                    <span className="font-bold text-sm text-cyan-400">{scan.overallScore}</span>
                    <span className="text-[10px] text-slate-500">/100</span>
                  </td>

                  <td className="py-3.5 px-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        scan.letterGrade === 'A+' || scan.letterGrade === 'A'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : scan.letterGrade === 'B'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : scan.letterGrade === 'C'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {scan.letterGrade}
                    </span>
                  </td>

                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      {scan.findingsCount.critical > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                          {scan.findingsCount.critical}C
                        </span>
                      )}
                      {scan.findingsCount.high > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
                          {scan.findingsCount.high}H
                        </span>
                      )}
                      {scan.findingsCount.medium > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                          {scan.findingsCount.medium}M
                        </span>
                      )}
                      {scan.findingsCount.low > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                          {scan.findingsCount.low}L
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 text-slate-400 text-[11px]">
                    {new Date(scan.startedAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 text-right">
                    <Link
                      href={`/scans/${scan.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-400 border border-blue-500/20 text-[11px] transition-colors"
                    >
                      Inspect Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
