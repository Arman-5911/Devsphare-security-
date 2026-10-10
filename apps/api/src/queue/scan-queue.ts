import { ScanResult, ScanStatus, ScanMode } from '@devsphere/shared';
import { ScannerService } from '@devsphere/scanner-core';
import { scanStore } from '../storage/scan-store';

export interface ScanJob {
  scanId: string;
  url: string;
  mode?: ScanMode;
  maxPages?: number;
  loadTestVUs?: number;
  allowPrivate?: boolean;
  cancelled: boolean;
}

export class ScanQueue {
  private queue: ScanJob[] = [];
  private activeCount = 0;
  private maxConcurrency = 3;
  private scanner = new ScannerService();
  private jobsMap: Map<string, ScanJob> = new Map();

  public enqueue(
    scanId: string,
    url: string,
    options?: {
      mode?: ScanMode;
      maxPages?: number;
      loadTestVUs?: number;
      allowPrivate?: boolean;
    }
  ): void {
    const job: ScanJob = {
      scanId,
      url,
      mode: options?.mode || 'public',
      maxPages: options?.maxPages,
      loadTestVUs: options?.loadTestVUs,
      allowPrivate: options?.allowPrivate || false,
      cancelled: false,
    };
    this.jobsMap.set(scanId, job);
    this.queue.push(job);
    this.processNext();
  }

  public cancel(scanId: string): boolean {
    const job = this.jobsMap.get(scanId);
    if (!job) return false;

    job.cancelled = true;
    scanStore.update(scanId, {
      status: 'cancelled',
      errorMessage: 'Scan was cancelled by user request.',
      completedAt: new Date().toISOString(),
    });
    return true;
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    if (job.cancelled) {
      this.jobsMap.delete(job.scanId);
      this.processNext();
      return;
    }

    this.activeCount++;

    try {
      const result: ScanResult = await this.scanner.executeScan({
        scanId: job.scanId,
        url: job.url,
        mode: job.mode,
        maxPages: job.maxPages,
        loadTestVUs: job.loadTestVUs,
        allowPrivate: job.allowPrivate,
        onStatusChange: (status: ScanStatus) => {
          if (!job.cancelled) {
            scanStore.update(job.scanId, { status });
          }
        },
      });

      if (!job.cancelled) {
        scanStore.save(result);
      }
    } catch (err: any) {
      if (!job.cancelled) {
        scanStore.update(job.scanId, {
          status: 'failed',
          errorMessage: err.message,
          completedAt: new Date().toISOString(),
        });
      }
    } finally {
      this.activeCount--;
      this.jobsMap.delete(job.scanId);
      this.processNext();
    }
  }

  public getStats() {
    return {
      activeWorkers: this.activeCount,
      queuedJobs: this.queue.length,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

export const scanQueue = new ScanQueue();
