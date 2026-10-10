import { ScanMode } from '@devsphere/shared';
export interface ScanJob {
    scanId: string;
    url: string;
    mode?: ScanMode;
    maxPages?: number;
    loadTestVUs?: number;
    allowPrivate?: boolean;
    cancelled: boolean;
}
export declare class ScanQueue {
    private queue;
    private activeCount;
    private maxConcurrency;
    private scanner;
    private jobsMap;
    enqueue(scanId: string, url: string, options?: {
        mode?: ScanMode;
        maxPages?: number;
        loadTestVUs?: number;
        allowPrivate?: boolean;
    }): void;
    cancel(scanId: string): boolean;
    private processNext;
    getStats(): {
        activeWorkers: number;
        queuedJobs: number;
        maxConcurrency: number;
    };
}
export declare const scanQueue: ScanQueue;
