'use client';

import React, { useState } from 'react';
import {
  Settings,
  Key,
  Globe,
  Bell,
  Users,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'apikeys' | 'domains' | 'webhooks' | 'team'>('general');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key_live_9a8f27b1',
      name: 'Production CI/CD Runner',
      created: '2026-09-15',
      lastUsed: 'Just now',
      token: 'dvs_live_9a8f27b10c9d4e5f8a7b6c5d4e3f2a1b',
    },
    {
      id: 'key_test_4c2d89e0',
      name: 'Local Dev Testing',
      created: '2026-10-01',
      lastUsed: '2 days ago',
      token: 'dvs_test_4c2d89e01f2e3d4c5b6a708192837465',
    },
  ]);

  const [verifiedDomains] = useState([
    {
      domain: 'devsphere.security',
      status: 'verified',
      verificationMethod: 'DNS TXT',
      txtRecord: 'devsphere-site-verification=dvs-99881122',
      addedAt: '2026-08-10',
    },
    {
      domain: 'world-view-flame.vercel.app',
      status: 'pending_verification',
      verificationMethod: 'DNS TXT',
      txtRecord: 'devsphere-site-verification=dvs-44556677',
      addedAt: '2026-10-08',
    },
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const newKey = {
      id: `key_live_${randomHex}`,
      name: `API Key ${apiKeys.length + 1}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      token: `dvs_live_${randomHex}${Math.random().toString(36).substring(2, 15)}`,
    };
    setApiKeys([...apiKeys, newKey]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-cyan-400" />
          <span>Platform Settings & Workspace</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage scanning engines, API tokens, verified domains, and integration configurations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> General & Engine Policies
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'apikeys'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key className="w-3.5 h-3.5" /> API Keys & Access
        </button>

        <button
          onClick={() => setActiveTab('domains')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'domains'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Verified Domains
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'webhooks'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Webhooks & Alerts
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'team'
              ? 'bg-blue-600 text-white shadow-glow-blue'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Team & RBAC
        </button>
      </div>

      {/* Tab: General & Policies */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Scanning Engine Directives</span>
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white block font-semibold">SSRF Protection Engine</span>
                  <span className="text-slate-400 text-[11px]">Strict loopback & cloud metadata filter</span>
                </div>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ENFORCED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white block font-semibold">Max Redirect Hops</span>
                  <span className="text-slate-400 text-[11px]">Limits circular redirect loops</span>
                </div>
                <span className="text-cyan-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  5 HOPS
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white block font-semibold">Request Timeout Bound</span>
                  <span className="text-slate-400 text-[11px]">Enforces safe termination</span>
                </div>
                <span className="text-cyan-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  8000 MS
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-white block font-semibold">Decompression Guard</span>
                  <span className="text-slate-400 text-[11px]">Maximum response payload</span>
                </div>
                <span className="text-cyan-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  2048 KB (2MB)
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="font-bold text-white text-base">User-Agent Header Signature</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DevSphere Security identifies itself clearly to target servers to maintain defensive transparency.
            </p>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 font-mono text-[11px] text-cyan-300">
              DevSphere-Security-Scanner/1.0 (Passive Posture Auditor; +https://devsphere.security/bot)
            </div>
            <p className="text-[11px] text-slate-500">
              This header complies with security researcher disclosure guidelines, giving webmasters visibility into posture audit sources.
            </p>
          </div>
        </div>
      )}

      {/* Tab: API Keys */}
      {activeTab === 'apikeys' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-white text-base">REST API Access Keys</h3>
              <p className="text-xs text-slate-400">
                Authenticate programmatically to launch scans, extract findings, and integrate with CI/CD.
              </p>
            </div>
            <button
              onClick={handleGenerateKey}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-glow-blue"
            >
              <Plus className="w-3.5 h-3.5" /> Generate New Key
            </button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{key.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      {key.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                    <span>Created: {key.created}</span>
                    <span>Last Used: {key.lastUsed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="password"
                    readOnly
                    value={key.token}
                    className="bg-slate-900 border border-white/10 rounded px-2.5 py-1 text-slate-300 text-xs w-48 font-mono select-all"
                  />
                  <button
                    onClick={() => handleCopy(key.token, key.id)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Copy Token"
                  >
                    {copiedKey === key.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Verified Domains */}
      {activeTab === 'domains' && (
        <DomainVerificationTab />
      )}


      {/* Tab: Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Alerts & Webhook Integrations</h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              Phase 2 Preview
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dispatch instant posture regression alerts and critical findings to Slack, Microsoft Teams, or custom HTTP endpoints upon scan completion.
          </p>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 font-mono text-xs text-slate-400">
            Webhook dispatch hooks will be fully configured in Phase 2 alongside external threat intelligence feeds.
          </div>
        </div>
      )}

      {/* Tab: Team & RBAC */}
      {activeTab === 'team' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Team Members & Access Roles</h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              Enterprise Preview
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Manage organization members, assign role-based permissions (Security Lead, Analyst, Read-Only Auditor), and track audit logs.
          </p>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 font-mono text-xs text-slate-400">
            Multi-tenant organization roles and SSO/SAML integration are scheduled for Phase 5 enterprise rollout.
          </div>
        </div>
      )}
    </div>
  );
}

function DomainVerificationTab() {
  const [targetDomain, setTargetDomain] = useState('');
  const [tokenInfo, setTokenInfo] = useState<{
    domain: string;
    token: string;
    dnsTxtRecord: { host: string; type: string; value: string };
    metaTag: { name: string; content: string };
  } | null>(null);
  const [verifyMethod, setVerifyMethod] = useState<'dns_txt' | 'meta_tag'>('dns_txt');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [verifiedList, setVerifiedList] = useState([
    {
      domain: 'devsphere.security',
      status: 'verified',
      method: 'DNS TXT',
      verifiedAt: '2026-08-10',
    },
    {
      domain: 'world-view-flame.vercel.app',
      status: 'pending_verification',
      method: 'DNS TXT',
      verifiedAt: 'Pending',
    },
  ]);

  const handleGetToken = async () => {
    if (!targetDomain.trim()) return;
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/v1/domains/token?domain=${encodeURIComponent(targetDomain.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch verification token');
      setTokenInfo(data);
    } catch (err: any) {
      setVerifyResult({ success: false, message: err.message });
    }
  };

  const handleVerify = async () => {
    if (!tokenInfo) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/v1/domains/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: tokenInfo.domain, method: verifyMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verification attempt failed');
      setVerifyResult(data);
      if (data.success) {
        setVerifiedList((prev) => [
          ...prev.filter((d) => d.domain !== tokenInfo.domain),
          {
            domain: tokenInfo.domain,
            status: 'verified',
            method: verifyMethod === 'dns_txt' ? 'DNS TXT' : 'HTML Meta Tag',
            verifiedAt: new Date().toISOString().split('T')[0],
          },
        ]);
      }
    } catch (err: any) {
      setVerifyResult({ success: false, message: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClip = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-white text-base">Authorized Domain Verification</h3>
          <p className="text-xs text-slate-400">
            Verify domain ownership to unlock Mode B (Deep Audit) and Mode C (Resilience Testing).
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Cryptographic Ownership
        </span>
      </div>

      {/* Step 1: Input Domain */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
        <label className="text-xs font-semibold text-slate-200 block">
          Step 1: Enter Domain Name to Authorize
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetDomain}
            onChange={(e) => setTargetDomain(e.target.value)}
            placeholder="e.g. world-view-flame.vercel.app"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleGetToken}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-glow-blue"
          >
            Generate Token
          </button>
        </div>
      </div>

      {/* Step 2: Verification Instructions */}
      {tokenInfo && (
        <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">
              Step 2: Add Verification Record for {tokenInfo.domain}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setVerifyMethod('dns_txt')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  verifyMethod === 'dns_txt'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                DNS TXT
              </button>
              <button
                onClick={() => setVerifyMethod('meta_tag')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  verifyMethod === 'meta_tag'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                HTML Meta Tag
              </button>
            </div>
          </div>

          {verifyMethod === 'dns_txt' ? (

            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-[11px] text-slate-400">Add the following TXT record to your DNS settings:</div>
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-950 rounded">
                <span className="text-slate-400">Host / Name:</span>
                <span className="text-slate-200">{tokenInfo.dnsTxtRecord.host}</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-950 rounded">
                <span className="text-slate-400">Value:</span>
                <span className="text-cyan-300 truncate">{tokenInfo.dnsTxtRecord.value}</span>
                <button
                  onClick={() => copyToClip(tokenInfo.dnsTxtRecord.value, 'txt')}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Copy"
                >
                  {copiedField === 'txt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 font-mono text-xs space-y-2">
              <div className="text-[11px] text-slate-400">Add this tag inside your homepage &lt;head&gt; section:</div>
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-950 rounded">
                <span className="text-cyan-300 text-[11px] truncate">{`<meta name="${tokenInfo.metaTag.name}" content="${tokenInfo.metaTag.content}" />`}</span>
                <button
                  onClick={() => copyToClip(`<meta name="${tokenInfo.metaTag.name}" content="${tokenInfo.metaTag.content}" />`, 'meta')}
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="Copy"
                >
                  {copiedField === 'meta' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">DNS changes may take up to a few minutes to propagate.</span>
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Verify Ownership Now'}
            </button>
          </div>

          {verifyResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                verifyResult.success
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {verifyResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{verifyResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Domain Registry Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Registered Domains ({verifiedList.length})
        </h4>
        {verifiedList.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
          >
            <div>
              <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                {item.domain}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Method: {item.method} • Verified: {item.verifiedAt}
              </div>
            </div>

            {item.status === 'verified' && (
              <span className="text-[11px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Modes B & C Authorized
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

