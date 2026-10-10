import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'DevSphere Security — AI-Powered Website Security Analysis & Intelligence Platform',
  description:
    'Evidence-based web security posture analysis, SSL/TLS certificate auditing, HTTP security header evaluation, cookie configuration inspection, and actionable remediation recommendations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 subtle-grid-bg">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
