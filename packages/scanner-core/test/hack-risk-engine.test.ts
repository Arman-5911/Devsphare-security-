import { describe, it, expect } from 'vitest';
import { calculateHackRisk } from '../src/hack-risk-engine';
import { ScanFinding } from '@devsphere/shared';

describe('Hack Risk & Exploitability Engine', () => {
  it('should assess low exploitability when no severe findings exist', () => {
    const risk = calculateHackRisk([], undefined, true);
    expect(risk.exploitabilityLevel).toBe('Low');
    expect(risk.exposureScore).toBeLessThan(30);
  });

  it('should assess Critical exploitability when critical findings exist', () => {
    const criticalFinding: ScanFinding = {
      id: 'crit-1',
      ruleId: 'SEC-002',
      category: 'security_headers',
      severity: 'critical',
      confidence: 'confirmed',
      title: 'Exposed AWS Key',
      description: 'Key exposed',
      scoreDeduction: 25,
      evidence: {},
      explanation: 'Exposed',
      potentialImpact: 'Catastrophic',
      remediation: 'Revoke',
      snippets: [],
      standards: [],
      verificationSteps: [],
    };

    const risk = calculateHackRisk([criticalFinding], undefined, true);
    expect(risk.exploitabilityLevel).toBe('Critical');
    expect(risk.estimatedBusinessImpact).toBe('Catastrophic');
  });
});
