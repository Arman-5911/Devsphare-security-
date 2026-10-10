import { ScanFinding, PostureScore, MultiPillarScores, PerformanceDetails, AccessibilityDetails, SeoDetails } from '@devsphere/shared';
export declare function calculatePostureScore(findings: ScanFinding[], checksAttempted: number, checksCompleted: number): PostureScore;
export declare function calculateMultiPillarScores(options: {
    postureScore: PostureScore;
    performance?: PerformanceDetails;
    accessibility?: AccessibilityDetails;
    seo?: SeoDetails;
}): MultiPillarScores;
