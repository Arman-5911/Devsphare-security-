import { LoadCapacityDetails } from '@devsphere/shared';
export interface LoadTestOptions {
    url: string;
    isAuthorized: boolean;
    virtualUsers?: number;
    durationSeconds?: number;
    allowPrivate?: boolean;
}
export declare function executeLoadCapacityTest(options: LoadTestOptions): Promise<LoadCapacityDetails>;
