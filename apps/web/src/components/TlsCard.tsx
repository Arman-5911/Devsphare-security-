'use client';

import React from 'react';
import { TlsCertificateInfo } from '@devsphere/shared';
import { Shield, ShieldAlert, CheckCircle2, Clock, Key, Server } from 'lucide-react';

interface TlsCardProps {
  tls?: TlsCertificateInfo;
}

export function TlsCard({ tls }: TlsCardProps) {
  if (!tls) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-red-500/30">
        <div className="flex items-center gap-3 text-red-400 mb-2">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">SSL/TLS Handshake Not Established</h3>
        </div>
        <p className="text-xs text-slate-400">
          The scanner was unable to complete a TLS handshake on port 443. The host may not support HTTPS or connections were refused.
        </p>
      </div>
    );
  }

  const isHealthy = !tls.isExpired && !tls.expiresSoon && !tls.isSelfSigned && tls.authorized;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">SSL/TLS Cryptography</h3>
            <p className="text-xs text-slate-400 font-mono">X.509 Certificate & Handshake State</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tls.isExpired ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              Expired
            </span>
          ) : tls.expiresSoon ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Expires in {tls.daysRemaining} days
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Valid ({tls.daysRemaining} days remaining)
            </span>
          )}
        </div>
      </div>

      {/* Grid of Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Protocol */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Protocol Negotiated</span>
          </div>
          <p className="font-mono text-white text-sm font-semibold">{tls.protocol}</p>
        </div>

        {/* Cipher Suite */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cipher Suite</span>
          </div>
          <p className="font-mono text-white text-xs font-semibold truncate" title={tls.cipherSuite}>
            {tls.cipherSuite}
          </p>
        </div>

        {/* Issuer */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Certificate Authority (Issuer)</span>
          </div>
          <p className="font-mono text-white text-xs font-semibold truncate" title={tls.issuer.organization || tls.issuer.commonName}>
            {tls.issuer.organization || tls.issuer.commonName || 'Unknown'}
          </p>
        </div>

        {/* Common Name */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <span className="text-slate-400 font-mono text-[11px]">Common Name (Subject)</span>
          <p className="font-mono text-white text-xs font-semibold truncate">
            {tls.subject.commonName || 'N/A'}
          </p>
        </div>

        {/* Valid From */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <span className="text-slate-400 font-mono text-[11px]">Valid From</span>
          <p className="font-mono text-white text-xs">
            {new Date(tls.validFrom).toLocaleDateString()}
          </p>
        </div>

        {/* Valid To */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
          <span className="text-slate-400 font-mono text-[11px]">Expiration Date</span>
          <p className="font-mono text-white text-xs">
            {new Date(tls.validTo).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* SANs (Subject Alternative Names) */}
      {tls.san && tls.san.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-mono text-slate-400">
            Subject Alternative Names ({tls.san.length}):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-slate-950/40 border border-white/5">
            {tls.san.map((dnsName, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-white/10"
              >
                {dnsName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
