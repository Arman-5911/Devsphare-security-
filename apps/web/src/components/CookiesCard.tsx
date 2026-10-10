'use client';

import React from 'react';
import { CookieAnalysisItem } from '@devsphere/shared';
import { Cookie, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface CookiesCardProps {
  cookies?: CookieAnalysisItem[];
}

export function CookiesCard({ cookies }: CookiesCardProps) {
  if (!cookies || cookies.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Cookie Security Analysis</h3>
            <p className="text-xs text-slate-400 font-mono">Session & Storage Privacy Attributes</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-mono">
          No Set-Cookie headers were observed in the initial passive response.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cookie className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Cookie Security Analysis</h3>
            <p className="text-xs text-slate-400 font-mono">
              Evaluated {cookies.length} Set-Cookie directive{cookies.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
              <th className="pb-2 font-medium">Cookie Name</th>
              <th className="pb-2 font-medium text-center">Secure</th>
              <th className="pb-2 font-medium text-center">HttpOnly</th>
              <th className="pb-2 font-medium text-center">SameSite</th>
              <th className="pb-2 font-medium">Issues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {cookies.map((cookie, index) => (
              <tr key={index} className="hover:bg-white/[0.02]">
                <td className="py-2.5 pr-4 text-white font-semibold">
                  {cookie.name}
                </td>

                <td className="py-2.5 px-2 text-center">
                  {cookie.secure ? (
                    <span className="inline-flex items-center text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> No
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-2 text-center">
                  {cookie.httpOnly ? (
                    <span className="inline-flex items-center text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-red-400 text-[11px]">
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> No
                    </span>
                  )}
                </td>

                <td className="py-2.5 px-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      cookie.sameSite === 'Strict' || cookie.sameSite === 'Lax'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {cookie.sameSite || 'Unset'}
                  </span>
                </td>

                <td className="py-2.5 pl-4 text-slate-300 font-sans text-[11px]">
                  {cookie.issues.length > 0 ? (
                    <span className="text-amber-400">{cookie.issues.join('; ')}</span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All security flags properly set
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
