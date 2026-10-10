import { ScanResult, ScanSummaryItem, ScanFilterInput } from '@devsphere/shared';
export declare class ScanStore {
    private scans;
    private storageFile;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    save(scan: ScanResult): void;
    getById(id: string): ScanResult | undefined;
    update(id: string, updates: Partial<ScanResult>): ScanResult | undefined;
    delete(id: string): boolean;
    deleteMany(ids: string[]): number;
    clear(): void;
    list(filters: ScanFilterInput): {
        items: ScanSummaryItem[];
        total: number;
        limit: number;
        offset: number;
    };
    count(): number;
}
export declare const scanStore: ScanStore;
