'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { listVerificationSessions } from '@/lib/api-client';
import type { VerificationSession } from '@devsphere/shared';

export default function VerificationSessionsIndexPage() {
  const [sessions, setSessions] = useState<VerificationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        setLoading(true);
        const data = await listVerificationSessions();
        setSessions(data);
      } catch (err) {
        console.error('Failed to load verification sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'PASS_CLEAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            PASS • CLEAN
          </span>
        );
      case 'PASS_IMPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            PASS • IMPROVED
          </span>
        );
      case 'REGRESSIONS_DETECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-red-500/10 text-red-400 border border-red-500/30">
            <ShieldAlert className="w-3 h-3" />
            REGRESSIONS
          </span>
        );
      case 'PARTIAL_FIX':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-3 h-3" />
            PARTIAL FIX
          </span>
        );
      case 'NO_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            NO CHANGE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" />
            AWAITING POST-FIX
          </span>
        );
    }
  };

  return (
    <div className="min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <Link href="/cyberlab" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to CyberLab V3
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0a1020] to-slate-950 border border-cyan-500/20 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
            REGRESSION DETECTION &amp; BEFORE/AFTER AUDIT
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-cyan-400 shrink-0" />
          Auto-Fix Verification Sessions
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Review historical baseline vs post-fix re-scan comparisons. Verify whether detected security defects, accessibility flaws, and performance bottlenecks were truly fixed or introduced regressions.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm font-mono text-slate-400">
          Loading verification sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No Verification Sessions Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run an autonomous CyberLab V3 audit on any website, then click &quot;Fix &amp; Verify&quot; to establish an immutable baseline and begin automated fix verification.
          </p>
          <div className="pt-2">
            <Link
              href="/cyberlab"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/20"
            >
              Start CyberLab V3 Audit
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => (
            <Link
              key={sess.id}
              href={`/cyberlab/verify/${sess.id}`}
              className="block p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all shadow-md group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getVerdictBadge(sess.summary.overallVerdict)}
                    <span className="text-xs font-mono text-slate-400">{sess.id}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="group-hover:text-cyan-300 transition-colors">{sess.targetUrl}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-500">
                    Created: {new Date(sess.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Verified Fixed</span>
                    <span className="text-emerald-400 font-bold text-sm">{sess.summary.verifiedFixedCount}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Regressions</span>
                    <span className={sess.summary.regressionsCount > 0 ? 'text-red-400 font-bold text-sm' : 'text-slate-400 text-sm'}>
                      {sess.summary.regressionsCount}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Remaining</span>
                    <span className="text-amber-400 font-bold text-sm">{sess.summary.stillPresentCount}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
