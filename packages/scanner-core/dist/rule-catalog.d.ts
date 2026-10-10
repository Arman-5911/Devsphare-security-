import { SecurityCategory, FindingSeverity, FindingConfidence, FindingRemediationSnippet, FindingStandardRef } from '@devsphere/shared';
export interface RuleDefinition {
    id: string;
    category: SecurityCategory;
    severity: FindingSeverity;
    confidence: FindingConfidence;
    title: string;
    description: string;
    defaultDeduction: number;
    explanation: string;
    potentialImpact: string;
    remediation: string;
    standards: FindingStandardRef[];
    snippets: FindingRemediationSnippet[];
    verificationSteps: string[];
}
export declare const RULE_CATALOG: Record<string, RuleDefinition>;
