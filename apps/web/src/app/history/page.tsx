'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { ScanSummaryItem } from '@devsphere/shared';
import { listScans, compareScans, deleteScan, clearScanHistory } from '@/lib/api-client';
import { CompareModal } from '@/components/CompareModal';

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Comparison selection
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);


  const fetchScans = async () => {
    setIsLoading(true);
    try {
      const data = await listScans({
        query: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        grade: gradeFilter !== 'all' ? (gradeFilter as any) : undefined,
        sortOrder,
        limit: 50,
      });
      setScans(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [statusFilter, gradeFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScans();
  };

  const toggleSelectForCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleDeleteSingle = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      setSelectedForCompare((prev) => prev.filter((item) => item !== id));
      showFeedback(`Scan ${id} successfully deleted.`);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete scan', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedForCompare.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await clearScanHistory(selectedForCompare);
      setScans((prev) => prev.filter((s) => !selectedForCompare.includes(s.id)));
      showFeedback(`Successfully deleted ${res.deletedCount || selectedForCompare.length} selected scan(s).`);
      setSelectedForCompare([]);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete selected scans', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      const res = await clearScanHistory();
      setScans([]);
      setSelectedForCompare([]);
      setClearModalOpen(false);
      showFeedback(`All scan history successfully cleared (${res.deletedCount || 0} scans removed).`);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to clear scan history', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLaunchCompare = async () => {
    if (selectedForCompare.length !== 2) return;
    setIsComparing(true);
    try {
      const diff = await compareScans(selectedForCompare[0], selectedForCompare[1]);
      setCompareData(diff);
      setCompareModalOpen(true);
    } catch (err) {
      console.error('Failed to compare scans:', err);
    } finally {
      setIsComparing(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-cyan-400" />
            <span>Audit History & Delta Tracking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Historical audit logs with differential posture comparisons across scans.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Delete Selected (if any selected) */}
          {selectedForCompare.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold text-xs tracking-wider uppercase transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedForCompare.length})</span>
            </button>
          )}

          {/* Compare Launch CTA */}
          {selectedForCompare.length === 2 && (
            <button
              onClick={handleLaunchCompare}
              disabled={isComparing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs tracking-wider uppercase transition-all shadow-glow-cyan"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Selected (2)</span>
            </button>
          )}

          {/* Clear All History Button */}
          {scans.length > 0 && (
            <button
              onClick={() => setClearModalOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold tracking-wider uppercase transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 animate-fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* Toolbar: Search & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search domain or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>

          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Grades</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>

          {/* Sort order toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950/80 border border-white/10 text-xs text-slate-300 hover:text-white"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          <button
            onClick={fetchScans}
            className="p-2 rounded-lg bg-slate-950/80 border border-white/10 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comparison Helper Notice */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <span>
          Tip: Select checkboxes on any 2 scans to run a side-by-side comparative posture diff.
        </span>
        {selectedForCompare.length > 0 && (
          <span className="text-cyan-400">
            {selectedForCompare.length} of 2 selected for comparison
          </span>
        )}
      </div>

      {/* Scans List Table */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px]">
                <th className="pb-3 w-10 text-center font-medium">Diff</th>
                <th className="pb-3 font-medium">Target URL & Hostname</th>
                <th className="pb-3 font-medium text-center">Score</th>
                <th className="pb-3 font-medium text-center">Grade</th>
                <th className="pb-3 font-medium">Findings Breakdown</th>
                <th className="pb-3 font-medium">Date & Time</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {scans.map((scan) => {
                const isSelected = selectedForCompare.includes(scan.id);
                return (
                  <tr
                    key={scan.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isSelected ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    {/* Checkbox for compare */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectForCompare(scan.id)}
                        className="rounded bg-slate-900 border-white/20 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Target URL */}
                    <td className="py-3 pr-4">
                      <Link
                        href={`/scans/${scan.id}`}
                        className="font-semibold text-white hover:text-cyan-400 transition-colors block truncate max-w-sm"
                      >
                        {scan.targetUrl}
                      </Link>
                      <span className="text-[10px] text-slate-500 block">{scan.id}</span>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm font-bold text-cyan-400">{scan.overallScore}</span>
                      <span className="text-[10px] text-slate-500">/100</span>
                    </td>

                    {/* Grade */}
                    <td className="py-3 px-2 text-center">
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

                    {/* Findings Breakdown */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                          {scan.findingsCount.critical}C
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                          {scan.findingsCount.high}H
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {scan.findingsCount.medium}M
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          {scan.findingsCount.low}L
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 text-slate-400 text-[11px]">
                      {new Date(scan.startedAt).toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/scans/${scan.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-400 border border-blue-500/20 text-[11px] transition-colors font-sans"
                        >
                          Inspect
                        </Link>
                        <button
                          onClick={(e) => handleDeleteSingle(scan.id, e)}
                          disabled={isDeleting}
                          title="Delete this scan"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {scans.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No scans found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear All History Confirmation Modal */}
      {clearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Clear All Audit History?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Permanent record deletion</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete all <strong className="text-white">{scans.length} historical audit scans</strong>, telemetry captures, and evaluated findings. This action cannot be reversed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClearModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-red-900/30 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Clearing...' : 'Yes, Delete Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <CompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        data={compareData}
      />
    </div>
  );
}

