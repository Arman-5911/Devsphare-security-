"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanQueue = exports.ScanQueue = void 0;
const scanner_core_1 = require("@devsphere/scanner-core");
const scan_store_1 = require("../storage/scan-store");
class ScanQueue {
    queue = [];
    activeCount = 0;
    maxConcurrency = 3;
    scanner = new scanner_core_1.ScannerService();
    jobsMap = new Map();
    enqueue(scanId, url, options) {
        const job = {
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
    cancel(scanId) {
        const job = this.jobsMap.get(scanId);
        if (!job)
            return false;
        job.cancelled = true;
        scan_store_1.scanStore.update(scanId, {
            status: 'cancelled',
            errorMessage: 'Scan was cancelled by user request.',
            completedAt: new Date().toISOString(),
        });
        return true;
    }
    async processNext() {
        if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
            return;
        }
        const job = this.queue.shift();
        if (!job)
            return;
        if (job.cancelled) {
            this.jobsMap.delete(job.scanId);
            this.processNext();
            return;
        }
        this.activeCount++;
        try {
            const result = await this.scanner.executeScan({
                scanId: job.scanId,
                url: job.url,
                mode: job.mode,
                maxPages: job.maxPages,
                loadTestVUs: job.loadTestVUs,
                allowPrivate: job.allowPrivate,
                onStatusChange: (status) => {
                    if (!job.cancelled) {
                        scan_store_1.scanStore.update(job.scanId, { status });
                    }
                },
            });
            if (!job.cancelled) {
                scan_store_1.scanStore.save(result);
            }
        }
        catch (err) {
            if (!job.cancelled) {
                scan_store_1.scanStore.update(job.scanId, {
                    status: 'failed',
                    errorMessage: err.message,
                    completedAt: new Date().toISOString(),
                });
            }
        }
        finally {
            this.activeCount--;
            this.jobsMap.delete(job.scanId);
            this.processNext();
        }
    }
    getStats() {
        return {
            activeWorkers: this.activeCount,
            queuedJobs: this.queue.length,
            maxConcurrency: this.maxConcurrency,
        };
    }
}
exports.ScanQueue = ScanQueue;
exports.scanQueue = new ScanQueue();
