import { ScanResult, ScanStatus, ScanMode } from '@devsphere/shared';
export interface ScanOptions {
    scanId: string;
    url: string;
    mode?: ScanMode;
    maxPages?: number;
    loadTestVUs?: number;
    allowPrivate?: boolean;
    onStatusChange?: (status: ScanStatus) => void;
}
export declare class ScannerService {
    executeScan(options: ScanOptions): Promise<ScanResult>;
}
