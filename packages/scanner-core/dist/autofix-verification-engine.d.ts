import { CyberLabV3Run, FindingComparisonItem, PerformanceComparisonSummary, FunctionalRegressionItem, VerificationSessionSummary } from '@devsphere/shared';
export interface RunComparisonResult {
    summary: VerificationSessionSummary;
    findingComparisons: FindingComparisonItem[];
    performanceComparison: PerformanceComparisonSummary;
    functionalRegressions: FunctionalRegressionItem[];
    updatedAiFixPrompt: string;
}
/**
 * DevSphere Auto-Fix Verification Engine V1
 * Deterministic finding matching, regression detection, performance comparison,
 * and updated AI remediation prompt generation.
 */
export declare class AutoFixVerificationEngine {
    /**
     * Compares an immutable Baseline CyberLab run with a newly executed re-scan run.
     */
    compareRuns(baselineRun: CyberLabV3Run, latestRun: CyberLabV3Run): RunComparisonResult;
    /**
     * Generates an evidence-grounded Updated AI Website Fix Master Prompt
     * explicitly highlighting verified resolutions, still-present issues, and regressions.
     */
    private generateUpdatedFixPrompt;
}
