import { ScanFinding, ThreatIntelligenceDetails, HackRiskDetails } from '@devsphere/shared';
export declare function calculateHackRisk(findings: ScanFinding[], threatIntel?: ThreatIntelligenceDetails, hasTls?: boolean, isDomainVerified?: boolean): HackRiskDetails;
