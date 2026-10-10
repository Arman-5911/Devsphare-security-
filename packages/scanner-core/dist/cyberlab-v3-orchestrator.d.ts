import { CyberLabV3Run } from '@devsphere/shared';
export declare class CyberLabV3Orchestrator {
    private cyberLabEngine;
    constructor();
    /**
     * Executes the full CyberLab V3 Autonomous Pipeline
     * Completely automated from single URL input.
     */
    runAutonomousLab(url: string, isVerifiedOwner?: boolean, onProgress?: (update: Partial<CyberLabV3Run>) => void): Promise<CyberLabV3Run>;
}
