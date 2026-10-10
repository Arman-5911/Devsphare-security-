import { CyberLabSession } from '@devsphere/shared';
export declare class CyberLabStore {
    private sessions;
    private storageFile;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    save(session: CyberLabSession): void;
    getById(id: string): CyberLabSession | undefined;
    listAll(): CyberLabSession[];
    update(id: string, updates: Partial<CyberLabSession>): CyberLabSession | undefined;
    delete(id: string): boolean;
    deleteAll(): void;
}
