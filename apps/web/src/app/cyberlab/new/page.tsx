'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FlaskConical,
  Globe,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { createCyberLabSession } from '@/lib/api-client';
import type { CyberLabMode } from '@devsphere/shared';

export default function NewCyberLabSessionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<CyberLabMode>('public_preview');
  const [url, setUrl] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [framework, setFramework] = useState<'nextjs' | 'react' | 'vue' | 'angular' | 'vite' | 'express' | 'fastify' | 'python_fastapi'>('nextjs');
  const [repoUrl, setRepoUrl] = useState('');
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a target URL.');
      return;
    }
    if (!agreed) {
      setError('You must accept the defensive testing principles.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await createCyberLabSession({
        targetUrl: url.trim(),
        mode,
        name: sessionName.trim() || undefined,
        framework: mode === 'verified_sandbox' ? framework : undefined,
        repositoryUrl: repoUrl.trim() || undefined,
      });

      router.push(`/cyberlab/${session.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize CyberLab session.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/cyberlab" className="hover:text-cyan-400 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          CyberLab Overview
        </Link>
        <span>/</span>
        <span className="text-slate-200">New Session</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            PROVISION LAB
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-cyan-400" />
          Create Virtual Laboratory Session
        </h1>
        <p className="text-sm text-slate-400">
          Provision an isolated simulation workspace. Select Mode A for passive visual preview & mock traffic, or Mode B for verified developer chaos & security validation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white block">Step 1: Select Laboratory Isolation Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode A Option */}
            <div
              onClick={() => setMode('public_preview')}
              className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                mode === 'public_preview'
                  ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                  : 'bg-slate-900/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase">MODE A</span>
                  </div>
                  {mode === 'public_preview' && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                </div>
                <h3 className="text-base font-bold text-white">Public URL Virtual Preview</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Open for unverified public websites. Creates a safe DOM snapshot, responsive device preview, and executes controlled mock traffic simulations (10–1000 VUs) strictly within DevSphere isolated infrastructure.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 mt-3 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                <Lock className="w-3 h-3 text-cyan-400" />
                Zero production impact guaranteed
              </div>
            </div>

            {/* Mode B Option */}
            <div
              onClick={() => setMode('verified_sandbox')}
              className={`p-5 rounded-2xl cursor-pointer border transition-all flex flex-col justify-between ${
                mode === 'verified_sandbox'
                  ? 'bg-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-slate-900/40 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase">MODE B</span>
                  </div>
                  {mode === 'verified_sandbox' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                </div>
                <h3 className="text-base font-bold text-white">Verified Developer CyberLab</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Available for authorized applications. Simulates infrastructure faults (DB latency, 503 drops, Redis outages), runs defensive security checks, and generates framework-specific AI remediation patches.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 mt-3 flex items-center gap-2 text-[11px] font-mono text-blue-300">
                <Cpu className="w-3 h-3 text-blue-400" />
                Chaos engineering & AI remediation
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Target Configuration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Step 2: Environment Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Target Website URL <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Quick suggestions:</span>
                {['https://example.com', 'https://news.ycombinator.com', 'https://github.com'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setUrl(item)}
                    className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-900/60 px-2 py-0.5 rounded"
                  >
                    {item.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Session Custom Name <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Staging Replica Test 01"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {mode === 'verified_sandbox' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Application Framework
                  </label>
                  <select
                    value={framework}
                    onChange={(e: any) => setFramework(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="nextjs">Next.js (App / Pages Router)</option>
                    <option value="react">React / Vite SPA</option>
                    <option value="vue">Vue / Nuxt</option>
                    <option value="angular">Angular</option>
                    <option value="express">Node.js Express</option>
                    <option value="fastify">Node.js Fastify</option>
                    <option value="python_fastapi">Python FastAPI / Uvicorn</option>
                  </select>
                </div>
              )}
            </div>

            {mode === 'verified_sandbox' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Repository URL <span className="text-slate-500">(Optional - for AI code patch mapping)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/my-org/my-project"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Safety Agreement */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex items-start gap-3">
          <input
            type="checkbox"
            id="agreement"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-900 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
          />
          <label htmlFor="agreement" className="text-xs text-slate-300 cursor-pointer leading-relaxed">
            <strong className="text-white">Strict Defensive & Non-Destructive Principles:</strong> I acknowledge that DevSphere CyberLab executes all synthetic load simulations and fault injections solely within DevSphere isolated mock infrastructure. No unauthorized exploits or destructive requests will be transmitted to external servers.
          </label>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/cyberlab"
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Isolated Environment...
              </>
            ) : (
              <>
                <span>Provision Laboratory Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
