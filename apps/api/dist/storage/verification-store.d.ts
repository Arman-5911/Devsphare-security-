import { VerificationSession } from '@devsphere/shared';
export declare class VerificationStore {
    private sessions;
    private storageFile;
    constructor();
    private loadFromDisk;
    private saveToDisk;
    save(session: VerificationSession): void;
    getById(id: string): VerificationSession | undefined;
    getByRunId(runId: string): VerificationSession | undefined;
    listAll(): VerificationSession[];
    update(id: string, updates: Partial<VerificationSession>): VerificationSession | undefined;
    delete(id: string): boolean;
}
