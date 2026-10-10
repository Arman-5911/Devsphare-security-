'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Shield,
  Zap,
  Lock,
  Server,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Terminal,
  RefreshCw,
  Search,
  Eye,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<'public' | 'verified_deep' | 'infrastructure_load'>('public');
  const [maxPages, setMaxPages] = useState<number>(10);
  const [loadTestVUs, setLoadTestVUs] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const sampleUrls = [
    'http://world-view-flame.vercel.app',
    'https://github.com',
    'https://cloudflare.com',
  ];

  const handleScan = async (e?: React.FormEvent, overrideUrl?: string) => {
    if (e) e.preventDefault();
    const target = overrideUrl || urlInput;
    if (!target.trim()) {
      setErrorMsg('Please enter a website URL to analyze.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target.trim(),
          mode: selectedMode,
          maxPages: selectedMode === 'verified_deep' ? maxPages : 10,
          loadTestVUs: selectedMode === 'infrastructure_load' ? loadTestVUs : undefined,
        }),
      });


      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to initialize scan');
      }

      router.push(`/scans/${data.scanId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error communicating with scanner API');
      setIsLoading(false);
    }
  };


  const faqs = [
    {
      q: 'Does DevSphere Security perform invasive attacks or exploit vulnerabilities?',
      a: 'No. Phase 1 executes passive, non-invasive observations only. The engine analyzes publicly observable HTTP response headers, SSL/TLS certificates, DNS records, and redirect chains. It never injects hostile payloads, brute-forces inputs, or attempts unauthorized access.',
    },
    {
      q: 'How does the DevSphere scoring engine work?',
      a: 'Our scoring engine is deterministic and weighted across 5 critical domains: SSL/TLS Cryptography (25%), HTTP Security Headers (30%), Cookie Security (15%), Network & Redirects (15%), and Information Disclosure (15%). Points are deducted strictly based on verified findings and severity weights.',
    },
    {
      q: 'Can any scanner guarantee a website is 100% secure?',
      a: 'No scanner can guarantee 100% security. DevSphere Security explicitly labels all checks, distinguishes confirmed findings from potential risks, and includes an immutable non-guarantee flag in every report.',
    },
    {
      q: 'How does DevSphere protect against SSRF and internal scanning abuses?',
      a: 'DevSphere enforces strict multi-layered SSRF defenses: domain resolution checks before transmission, blocking of loopback (127.0.0.1, ::1), private RFC1918 subnets, cloud metadata endpoints (169.254.169.254), carrier-grade NATs, and recursive hop re-validation on every redirect.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-mono mb-8 animate-fade-in shadow-glow-blue">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Next-Generation Automated Security Posture Engine</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Evidence-Based <br className="hidden sm:inline" />
          <span className="cyber-gradient-text">Website Security Posture</span> Intelligence
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Instantly evaluate public SSL/TLS certificates, HTTP defense headers, cookie configurations, and network redirects with deterministic remediation guidance.
        </p>

        {/* Mode Selector Tabs */}
        <div className="mt-8 max-w-2xl mx-auto flex flex-col gap-3">
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedMode('public')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedMode === 'public'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-glow-blue font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Mode A: Public</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('verified_deep')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedMode === 'verified_deep'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Mode B: Deep Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('infrastructure_load')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedMode === 'infrastructure_load'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Mode C: Resilience</span>
            </button>
          </div>

          {/* Mode Description helper */}
          <div className="text-[11px] text-slate-400 font-sans flex items-center justify-between px-2">
            {selectedMode === 'public' && (
              <span>Bounded, non-invasive observation: CWV performance, A11y, SEO/GEO, TLS & headers.</span>
            )}
            {selectedMode === 'verified_deep' && (
              <span className="text-cyan-300">
                Verified Owner required: Full crawler & link inventory, secrets scan, CVE correlation.
              </span>
            )}
            {selectedMode === 'infrastructure_load' && (
              <span className="text-purple-300">
                Verified Owner required: Concurrent VU load testing with automatic circuit breakers.
              </span>
            )}
          </div>
        </div>

        {/* Interactive URL Scanner Input */}
        <div className="mt-4 max-w-2xl mx-auto">
          <form
            onSubmit={(e) => handleScan(e)}
            className="p-2 rounded-2xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter target website (e.g. world-view-flame.vercel.app)"
                className="w-full bg-transparent pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                selectedMode === 'infrastructure_load'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                  : selectedMode === 'verified_deep'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-glow-blue'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {selectedMode === 'infrastructure_load'
                      ? 'Test Resilience'
                      : selectedMode === 'verified_deep'
                      ? 'Deep Audit'
                      : 'Audit Website'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Conditional Options */}
          {selectedMode === 'verified_deep' && (
            <div className="mt-3 p-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <FileCheck className="w-4 h-4" /> Crawl Depth Limit:
              </span>
              <div className="flex items-center gap-2">
                {[5, 10, 25].map((pages) => (
                  <button
                    key={pages}
                    type="button"
                    onClick={() => setMaxPages(pages)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      maxPages === pages
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pages} Pages
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMode === 'infrastructure_load' && (
            <div className="mt-3 p-3 bg-slate-900/80 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Server className="w-4 h-4" /> Concurrency Budget:
              </span>
              <div className="flex items-center gap-2">
                {[5, 15, 30].map((vus) => (
                  <button
                    key={vus}
                    type="button"
                    onClick={() => setLoadTestVUs(vus)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      loadTestVUs === vus
                        ? 'bg-purple-500 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {vus} VUs
                  </button>
                ))}
              </div>
            </div>
          )}



          {/* Error Message */}
          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick sample chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500">Quick Test:</span>
            {sampleUrls.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setUrlInput(sample);
                  handleScan(undefined, sample);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[11px] border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Trust metrics bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-white/5 pt-10 text-left">
          <div className="p-4 rounded-xl bg-white/[0.02]">
            <span className="text-2xl font-bold font-mono text-cyan-400">25+</span>
            <p className="text-xs text-slate-400 mt-1">Deterministic Rules</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02]">
            <span className="text-2xl font-bold font-mono text-blue-400">0%</span>
            <p className="text-xs text-slate-400 mt-1">Hallucination / Mocking</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02]">
            <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
            <p className="text-xs text-slate-400 mt-1">SSRF & Rebind Guarded</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02]">
            <span className="text-2xl font-bold font-mono text-purple-400">OWASP</span>
            <p className="text-xs text-slate-400 mt-1">ASVS Standards Aligned</p>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Comprehensive Capabilities
          </h2>
          <h3 className="text-3xl font-extrabold text-white">
            Passive Security Analysis Without Disruption
          </h3>
          <p className="text-sm text-slate-400">
            Engineered to analyze security posture from an external observer&apos;s vantage point with zero downtime risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-cyan-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">SSL/TLS & Cipher Suite Inspection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifies certificate validity chains, expiration deadlines, self-signed signatures, TLS 1.2/1.3 protocol negotiation, and weak ciphers.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Days-to-expiry countdown</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Subject Alternative Names (SAN)</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Deprecated protocol detection</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">HTTP Defense Headers & CSP</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates HSTS max-age, Content Security Policy directives (detects unsafe-inline and unsafe-eval), X-Frame-Options, and nosniff flags.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Subdomain HSTS coverage</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Clickjacking UI redress defense</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> MIME-sniffing prevention</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl glass-panel-hover space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">SSRF-Guarded Safe Dispatcher</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-verifies DNS resolution against private RFC1918 subnets, cloud metadata endpoints (169.254.169.254), and blocks loopback targets.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Destination IP pinning</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Recursive redirect re-checks</li>
              <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 2MB decompression DOS protection</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-white/10 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">Workflow</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">How DevSphere Evaluates Security</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                01
              </span>
              <h4 className="font-bold text-white text-sm">URL & SSRF Validation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Normalizes URL, resolves public DNS records, and asserts that IP targets are strictly outside private or metadata ranges.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                02
              </span>
              <h4 className="font-bold text-white text-sm">Passive Telemetry</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connects over port 443 to inspect certificates, executes safe HTTP requests to follow redirects, and captures raw headers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
              <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                03
              </span>
              <h4 className="font-bold text-white text-sm">Deterministic Rules</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Executes 25+ security rules across SSL, headers, cookies, and redirects. Grounds every finding in concrete technical evidence.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                04
              </span>
              <h4 className="font-bold text-white text-sm">Remediation Delivery</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Computes Posture Score (0-100), outputs copyable config snippets for Nginx, Apache, and Next.js, and enables PDF export.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRUST & PRIVACY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Defensively Sound Architecture
            </div>
            <h3 className="text-2xl font-bold text-white">Safe, Ethical & Evidence-Grounded</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              DevSphere Security was designed from inception around transparency. Results are derived exclusively from actual response data. We never fabricate threat levels, invent vulnerabilities, or sell deceptive security badges.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Zero exploit attempts against third-party endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Rate-limited requests respect target infrastructure capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Clear distinction between confirmed findings and best practices</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
              <span>SCANNER POLICY ENFORCEMENT</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div>&gt; SSRF_BLOCK_INTERNAL: <span className="text-emerald-400">TRUE (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)</span></div>
              <div>&gt; SSRF_BLOCK_METADATA: <span className="text-emerald-400">TRUE (169.254.169.254 pinned)</span></div>
              <div>&gt; REQUEST_TIMEOUT_MAX: <span className="text-cyan-400">8000ms</span></div>
              <div>&gt; RESPONSE_BODY_LIMIT: <span className="text-cyan-400">2097152 bytes (2MB)</span></div>
              <div>&gt; REDIRECT_HOPS_MAX: <span className="text-cyan-400">5 hops</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">FAQ</h2>
          <h3 className="text-2xl font-bold text-white">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-cyan-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-blue-950/40 border border-blue-500/30 text-center space-y-6 shadow-glow-blue">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to inspect your website&apos;s security posture?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Run an evidence-grounded security audit in seconds and receive copyable configuration fixes for your web servers.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
            >
              <Zap className="w-4 h-4" /> Start Free Audit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
