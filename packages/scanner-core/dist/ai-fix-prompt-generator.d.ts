import { ScanFinding, UrlPreflightValidationResult, FunctionalTestSummary, DiscoveredPage } from '@devsphere/shared';
export interface GenerateFixPromptOptions {
    targetUrl: string;
    framework?: string;
    preflight: UrlPreflightValidationResult;
    findings: ScanFinding[];
    functional: FunctionalTestSummary;
    discoveredPages: DiscoveredPage[];
    performanceMetrics: {
        fcpMs: number;
        lcpMs: number;
        clsScore: number;
        ttfbMs: number;
    };
}
/**
 * Generates an Enterprise-Grade AI Coding-Agent Master Fix Prompt
 * formatted in Markdown for direct use in Cursor, Claude, GPT, Antigravity, or Copilot.
 */
export declare function generateAiFixMasterPrompt(options: GenerateFixPromptOptions): string;
