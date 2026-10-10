'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FlaskConical,
  ArrowLeft,
  Globe,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  Cpu,
  Monitor,
  Tablet,
  Smartphone,
  Play,
  Flame,
  FileCode,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Terminal,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  getCyberLabSession,
  deleteCyberLabSession,
  simulateCyberLabTraffic,
  injectCyberLabFault,
  generateCyberLabAiRemediation,
} from '@/lib/api-client';
import type {
  CyberLabSession,
  TrafficSimulationResult,
  FaultInjectionResult,
  SandboxSecurityFinding,
  AiRemediationPlan,
  FaultType,
} from '@devsphere/shared';

export default function CyberLabConsolePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<CyberLabSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'preview' | 'traffic' | 'faults' | 'security' | 'remediation' | 'audit'
  const [activeTab, setActiveTab] = useState<'preview' | 'traffic' | 'faults' | 'security' | 'remediation' | 'audit'>('preview');

  // Preview Viewport Mode: 'desktop' | 'tablet' | 'mobile'
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Traffic Simulation State
  const [simVUs, setSimVUs] = useState<10 | 100 | 500 | 1000>(100);
  const [simDuration, setSimDuration] = useState(10);
  const [simEndpoint, setSimEndpoint] = useState('/');
  const [simRunning, setSimRunning] = useState(false);
  const [latestTrafficResult, setLatestTrafficResult] = useState<TrafficSimulationResult | null>(null);

  // Fault Injection State
  const [selectedFault, setSelectedFault] = useState<FaultType>('db_latency');
  const [faultLatencyMs, setFaultLatencyMs] = useState(1500);
  const [faultInjecting, setFaultInjecting] = useState(false);
  const [latestFaultResult, setLatestFaultResult] = useState<FaultInjectionResult | null>(null);

  // AI Remediation State
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [remediationPlan, setRemediationPlan] = useState<AiRemediationPlan | null>(null);
  const [copiedPatch, setCopiedPatch] = useState(false);

  // Mock form submission response inside preview
  const [previewFormSuccess, setPreviewFormSuccess] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await getCyberLabSession(sessionId);
      setSession(data);
      if (data.trafficSimulationHistory.length > 0) {
        setLatestTrafficResult(data.trafficSimulationHistory[0]);
      }
      if (data.faultInjectionHistory.length > 0) {
        setLatestFaultResult(data.faultInjectionHistory[0]);
      }
      if (data.securityFindings.length > 0 && !selectedFindingId) {
        setSelectedFindingId(data.securityFindings[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load CyberLab session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const handleDestroy = async () => {
    if (!confirm('Destroy this CyberLab session and clean up all replica resources?')) return;
    try {
      await deleteCyberLabSession(sessionId);
      router.push('/cyberlab');
    } catch (err: any) {
      alert(err.message || 'Failed to destroy session');
    }
  };

  const handleRunTrafficSim = async () => {
    setSimRunning(true);
    try {
      const result = await simulateCyberLabTraffic(sessionId, {
        vus: simVUs,
        durationSec: simDuration,
        targetEndpoint: simEndpoint,
        circuitBreakerLatencyMs: 3000,
        circuitBreakerErrorRatePercent: 50,
      });
      setLatestTrafficResult(result);
      fetchSession();
    } catch (err: any) {
      alert(err.message || 'Traffic simulation failed');
    } finally {
      setSimRunning(false);
    }
  };

  const handleInjectFault = async () => {
    setFaultInjecting(true);
    try {
      const result = await injectCyberLabFault(sessionId, {
        faultType: selectedFault,
        latencyMs: faultLatencyMs,
        failureRatePercent: 100,
        durationSec: 15,
      });
      setLatestFaultResult(result);
      fetchSession();
    } catch (err: any) {
      alert(err.message || 'Fault injection failed');
    } finally {
      setFaultInjecting(false);
    }
  };

  const handleGenerateAiFix = async (findingId: string) => {
    setSelectedFindingId(findingId);
    setActiveTab('remediation');
    setAiGenerating(true);
    try {
      const plan = await generateCyberLabAiRemediation(
        sessionId,
        findingId,
        session?.framework || 'nextjs'
      );
      setRemediationPlan(plan);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI remediation plan');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  if (loading && !session) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-mono text-slate-400">Mounting isolated CyberLab environment...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Laboratory Session Unavailable</h2>
        <p className="text-sm text-slate-400">{error || 'Session could not be located or has expired.'}</p>
        <Link
          href="/cyberlab"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500"
        >
          Return to CyberLab Overview
        </Link>
      </div>
    );
  }

  const { snapshot } = session;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Top Console Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/cyberlab"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  session.mode === 'verified_sandbox'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
              >
                {session.mode === 'verified_sandbox' ? 'VERIFIED SANDBOX' : 'PUBLIC PREVIEW'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ISOLATED
              </span>
              {session.framework && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                  {session.framework}
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
              {session.name}
            </h1>
            <p className="text-xs font-mono text-slate-400 flex items-center gap-1 truncate">
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              {session.targetUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSession}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh Environment"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDestroy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Destroy Lab
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'preview', label: 'Virtual Preview & DOM', icon: Monitor },
          { id: 'traffic', label: 'Controlled Traffic Simulator', icon: Zap },
          { id: 'faults', label: 'Chaos Fault Injection', icon: Flame },
          { id: 'security', label: 'Defensive Security Audit', icon: ShieldCheck, badge: session.securityFindings.length },
          { id: 'remediation', label: 'AI Remediation Workspace', icon: Sparkles },
          { id: 'audit', label: 'Audit Trail', icon: Clock, badge: session.auditEvents.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white border-transparent hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: VIRTUAL PREVIEW & DOM INSPECTION */}
      {/* ========================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Important Non-Negotiable Disclaimer */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Public Visual Preview:</strong> Not a complete private backend clone. Generated from passive DOM and HTTP observation. All interactions occur safely inside isolated DevSphere sandboxes.
              </span>
            </div>
            {/* Viewport switch */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-cyan-500/20 shrink-0 ml-2">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1 rounded ${viewport === 'desktop' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Desktop 1440px"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1 rounded ${viewport === 'tablet' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Tablet 768px"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1 rounded ${viewport === 'mobile' ? 'bg-cyan-500/30 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Mobile 375px"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive Sandbox Preview Canvas */}
            <div className="lg:col-span-2 space-y-4">
              <div
                className={`mx-auto rounded-2xl bg-slate-950 border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                  viewport === 'desktop'
                    ? 'w-full'
                    : viewport === 'tablet'
                    ? 'max-w-[768px]'
                    : 'max-w-[375px]'
                }`}
              >
                {/* Browser Chrome Header */}
                <div className="h-9 bg-slate-900 border-b border-white/10 px-4 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="px-4 py-1 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-cyan-300 truncate max-w-sm">
                    sandbox://{new URL(session.targetUrl).hostname}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {viewport === 'desktop' ? '1440x900' : viewport === 'tablet' ? '768x1024' : '375x667'}
                  </span>
                </div>

                {/* Canvas Body */}
                <div className="p-6 space-y-6 bg-slate-950 min-h-[460px]">
                  {/* Hero banner inside preview */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-900 border border-white/5 space-y-2">
                    <h2 className="text-xl font-bold text-white">{snapshot.title}</h2>
                    {snapshot.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{snapshot.description}</p>
                    )}
                    <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        {snapshot.domStructure.headers.length} Headings Observed
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        {snapshot.domStructure.links.length} Links Extracted
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        {snapshot.domStructure.forms.length} Interactive Forms Modeled
                      </span>
                    </div>
                  </div>

                  {/* Interactive Mock Form Demonstration */}
                  {snapshot.domStructure.forms.length > 0 && (
                    <div className="p-5 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                          SYNTHETIC FORM SIMULATOR
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Target: {snapshot.domStructure.forms[0].action}
                        </span>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setPreviewFormSuccess('Form submission simulated successfully inside isolated sandbox! (HTTP 200 OK)');
                          setTimeout(() => setPreviewFormSuccess(null), 4000);
                        }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {snapshot.domStructure.forms[0].inputs.slice(0, 4).map((inp, idx) => (
                            <div key={idx} className="space-y-1">
                              <label className="text-[11px] font-mono text-slate-400 block truncate">
                                {inp.name}
                              </label>
                              <input
                                type={inp.type === 'password' ? 'password' : 'text'}
                                placeholder={inp.placeholder || `Enter ${inp.name}...`}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-sm"
                          >
                            Simulate Form Submit
                          </button>
                          {previewFormSuccess && (
                            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-fade-in">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {previewFormSuccess}
                            </span>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Interactive Button Preview */}
                  {snapshot.domStructure.buttons.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-mono text-slate-400">Observed Action Buttons:</span>
                      <div className="flex flex-wrap gap-2">
                        {snapshot.domStructure.buttons.slice(0, 6).map((btn, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => alert(`Simulated click event on button: "${btn}"`)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-colors"
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Extracted DOM Tree & Passive Observations */}
            <div className="space-y-4">
              {/* Synthetic API Registry */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center justify-between font-mono">
                  <span>SYNTHETIC API ENDPOINTS</span>
                  <span className="text-cyan-400 text-[10px]">({snapshot.syntheticApis.length})</span>
                </h3>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {snapshot.syntheticApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">
                          {api.method}
                        </span>
                        <span className="text-emerald-400 text-[10px]">HTTP {api.mockStatus}</span>
                      </div>
                      <p className="text-slate-300 truncate">{api.path}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passive Security Headers */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <h3 className="text-xs font-bold text-white font-mono">PASSIVE SECURITY HEADERS</h3>
                <div className="space-y-2 text-xs font-mono">
                  {Object.entries(snapshot.securityHeaders).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between"
                    >
                      <span className="text-slate-400 text-[11px] truncate max-w-[150px]">{key}</span>
                      {val ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          PRESENT
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                          MISSING
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CONTROLLED MOCK TRAFFIC SIMULATOR */}
      {/* ========================================================= */}
      {activeTab === 'traffic' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Controlled Synthetic Traffic Simulator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generates synthetic concurrency models strictly against isolated DevSphere replica infrastructure. Zero external target requests sent.
                </p>
              </div>

              <button
                onClick={handleRunTrafficSim}
                disabled={simRunning}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 shrink-0"
              >
                {simRunning ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running Simulation ({simVUs} VUs)...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Execute Load Simulation
                  </>
                )}
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {([10, 100, 500, 1000] as const).map((vu) => (
                <div
                  key={vu}
                  onClick={() => setSimVUs(vu)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    simVUs === vu
                      ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/40'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold">{vu} VUs</span>
                    {simVUs === vu && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {vu === 10
                      ? 'Baseline Synthetic Smoke'
                      : vu === 100
                      ? 'Typical Peak Concurrency'
                      : vu === 500
                      ? 'Stress & Pool Saturation'
                      : 'Extreme Peak Resiliency'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results Display */}
          {latestTrafficResult && (
            <div className="space-y-6">
              {/* Synthetic Notice */}
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20 text-xs font-mono text-cyan-300 flex items-center justify-between">
                <span>{latestTrafficResult.disclaimer}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                  SYNTHETIC MODEL
                </span>
              </div>

              {/* Metric KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">THROUGHPUT (RPS)</span>
                  <p className="text-2xl font-extrabold text-white font-mono">
                    {latestTrafficResult.requestsPerSecond} <span className="text-xs font-normal text-slate-400">req/s</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {latestTrafficResult.totalRequests.toLocaleString()} total requests
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">p95 LATENCY</span>
                  <p className="text-2xl font-extrabold text-cyan-400 font-mono">
                    {latestTrafficResult.latency.p95} <span className="text-xs font-normal text-slate-400">ms</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    p50: {latestTrafficResult.latency.p50}ms • p99: {latestTrafficResult.latency.p99}ms
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">ERROR RATE</span>
                  <p className={`text-2xl font-extrabold font-mono ${latestTrafficResult.errorRatePercent > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {latestTrafficResult.errorRatePercent}%
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {latestTrafficResult.timeouts} timeouts observed
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">CIRCUIT BREAKER</span>
                  <p className={`text-xl font-bold font-mono mt-1 ${latestTrafficResult.circuitBreakerTriggered ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {latestTrafficResult.circuitBreakerTriggered ? 'TRIPPED' : 'NORMAL'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {latestTrafficResult.circuitBreakerReason || 'Latency & errors within thresholds'}
                  </p>
                </div>
              </div>

              {/* Time-Series Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono">CONCURRENT LOAD TELEMETRY (10s WINDOW)</h3>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      RPS
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      p95 Latency (ms)
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latestTrafficResult.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="second"
                        stroke="#64748b"
                        tickFormatter={(v) => `${v}s`}
                        style={{ fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rps"
                        name="RPS"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latencyP95"
                        name="p95 Latency (ms)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottlenecks Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
                <h3 className="text-xs font-bold text-white font-mono uppercase">
                  SIMULATED BOTTLENECKS & RESILIENCE OBSERVATIONS
                </h3>
                <ul className="space-y-1.5">
                  {latestTrafficResult.bottlenecks.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CHAOS FAULT INJECTION (MODE B / SANDBOX) */}
      {/* ========================================================= */}
      {activeTab === 'faults' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Infrastructure Chaos & Resilience Fault Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Inject controlled anomalies into isolated mock infrastructure to evaluate retry logic, timeout handling, circuit breakers, and user error masking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'db_latency', title: 'Database Latency Spike', desc: 'Simulate high query contention (1500ms delay)' },
                { id: 'db_connection_refusal', title: 'Database Connection Drop', desc: 'Simulate ECONNREFUSED on primary DB cluster' },
                { id: 'cache_service_down', title: 'Cache Layer Outage', desc: 'Simulate Redis disconnection and bypass' },
                { id: 'upstream_503', title: 'Upstream Microservice 503', desc: 'Simulate third-party dependency unavailability' },
                { id: 'network_jitter', title: 'Network Packet Jitter', desc: 'Simulate 100-800ms packet variance' },
                { id: 'worker_crash_recovery', title: 'Worker Crash & DLQ', desc: 'Simulate background worker SIGKILL restart' },
              ].map((fault) => (
                <div
                  key={fault.id}
                  onClick={() => setSelectedFault(fault.id as FaultType)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedFault === fault.id
                      ? 'bg-amber-500/10 border-amber-400 shadow-sm ring-1 ring-amber-400/40 text-white'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{fault.title}</span>
                    {selectedFault === fault.id && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400">{fault.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs font-mono text-slate-400">
                Scope: Strictly isolated to replica session {session.id}
              </span>
              <button
                onClick={handleInjectFault}
                disabled={faultInjecting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-xs text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {faultInjecting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Injecting Fault...
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    Inject Selected Fault
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Fault Result View */}
          {latestFaultResult && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-extrabold text-lg">
                    {latestFaultResult.resilienceScore}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">RESILIENCE SCORE</span>
                    <h3 className="text-base font-bold text-white capitalize">
                      {latestFaultResult.faultType.replace(/_/g, ' ')}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">RECOVERY TIME</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {latestFaultResult.recoveryTimeMs} ms
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">OBSERVED BEHAVIOR</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {latestFaultResult.observedBehavior}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">USER-FACING ERROR MASKING</span>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    "{latestFaultResult.userFacingErrorMessage}"
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-white font-bold uppercase">
                  SRE REMEDIATION RECOMMENDATIONS
                </span>
                <ul className="space-y-1.5">
                  {latestFaultResult.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DEFENSIVE SECURITY AUDIT */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Sandbox Defensive Security Findings
              </h2>
              <p className="text-xs text-slate-400">
                Safe, non-destructive evaluations performed within isolated lab infrastructure.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {session.securityFindings.length} Defensive Rules Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {session.securityFindings.map((finding) => (
              <div
                key={finding.id}
                className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          finding.severity === 'high'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : finding.severity === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{finding.id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {finding.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{finding.title}</h3>
                    <p className="text-xs text-slate-400">{finding.affectedComponent}</p>
                  </div>

                  <button
                    onClick={() => handleGenerateAiFix(finding.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shrink-0 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Remediate with AI
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
                  <div>
                    <span className="text-red-400 text-[10px] block">OBSERVED BEHAVIOR</span>
                    <p className="text-slate-300 mt-0.5">{finding.observedBehavior}</p>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block">EXPECTED SECURE BEHAVIOR</span>
                    <p className="text-slate-300 mt-0.5">{finding.expectedBehavior}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  <strong className="text-slate-300">Remediation:</strong> {finding.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: AI REMEDIATION WORKSPACE */}
      {/* ========================================================= */}
      {activeTab === 'remediation' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  AI Developer Remediation Assistant
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Evidence-grounded code remediation generator tailored to {session.framework || 'Next.js'}. Generates exact patches, verification tests, and rollout steps.
                </p>
              </div>

              {/* Finding Picker */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedFindingId || ''}
                  onChange={(e) => handleGenerateAiFix(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {session.securityFindings.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.severity.toUpperCase()}] {f.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {aiGenerating ? (
            <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-white/10 space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-400">
                Synthesizing evidence, framework idioms, and code patch...
              </p>
            </div>
          ) : remediationPlan ? (
            <div className="space-y-6">
              {/* Root Cause & Explanation */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  ROOT CAUSE ANALYSIS & ARCHITECTURAL IMPACT
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {remediationPlan.rootCauseAnalysis}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {remediationPlan.explanation}
                </p>
              </div>

              {/* Code Patch Box */}
              <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden space-y-0">
                <div className="h-10 bg-slate-900 px-4 flex items-center justify-between border-b border-white/10 text-xs font-mono">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <FileCode className="w-4 h-4" />
                    <span>{remediationPlan.suggestedPatch.filename}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(remediationPlan.suggestedPatch.patchedSnippet)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPatch ? 'Copied' : 'Copy Patch'}</span>
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono bg-black/60">
                  <pre className="text-cyan-300 leading-relaxed">
                    {remediationPlan.suggestedPatch.patchedSnippet}
                  </pre>
                </div>
              </div>

              {/* Automated Verification Test */}
              <div className="rounded-2xl bg-slate-950 border border-white/10 overflow-hidden space-y-0">
                <div className="h-10 bg-slate-900 px-4 flex items-center justify-between border-b border-white/10 text-xs font-mono">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Automated Verification Test (Jest / Vitest)
                  </span>
                  <button
                    onClick={() => handleCopyCode(remediationPlan.verificationTest)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Test
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-xs font-mono bg-black/60">
                  <pre className="text-emerald-300 leading-relaxed">
                    {remediationPlan.verificationTest}
                  </pre>
                </div>
              </div>

              {/* Safe Rollout Checklist */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
                <span className="text-xs font-mono text-white font-bold uppercase">
                  RECOMMENDED SAFE ROLLOUT & VERIFICATION PROCESS
                </span>
                <div className="space-y-2">
                  {remediationPlan.safeRolloutSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-white/10 space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400 mx-auto" />
              <h3 className="text-sm font-semibold text-white">Select a Security Finding</h3>
              <p className="text-xs text-slate-400">
                Pick a finding from the dropdown or click "Remediate with AI" on the Security tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Laboratory Immutable Audit Log
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {session.auditEvents.length} Recorded Events
            </span>
          </div>

          <div className="space-y-2">
            {session.auditEvents.map((event) => (
              <div
                key={event.id}
                className="p-3.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-start justify-between gap-4 font-mono text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                      {event.action}
                    </span>
                    <span className="text-slate-400 text-[11px]">{event.actor}</span>
                  </div>
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
