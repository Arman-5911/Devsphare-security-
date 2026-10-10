import { PerformanceDetails } from '@devsphere/shared';
export interface PerformanceEngineOptions {
    url: string;
    html: string;
    initialDurationMs: number;
    headers: Record<string, string>;
    allowPrivate?: boolean;
}
export declare function evaluatePerformance(options: PerformanceEngineOptions): Promise<PerformanceDetails>;
