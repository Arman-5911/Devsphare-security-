import { CyberLabV3Run } from '@devsphere/shared';
export declare class CyberLabV3Store {
    private runs;
    private storageFile;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    save(run: CyberLabV3Run): void;
    getById(id: string): CyberLabV3Run | undefined;
    listAll(): CyberLabV3Run[];
    update(id: string, updates: Partial<CyberLabV3Run>): CyberLabV3Run | undefined;
    delete(id: string): boolean;
}
