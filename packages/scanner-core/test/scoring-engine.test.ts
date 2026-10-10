import { describe, it, expect } from 'vitest';
import { calculatePostureScore } from '../src/scoring-engine';
import { ScanFinding } from '@devsphere/shared';

describe('Scoring Engine', () => {
  it('should grant 100 and A+ when there are 0 findings', () => {
    const score = calculatePostureScore([], 10, 10);
    expect(score.overallScore).toBe(100);
    expect(score.letterGrade).toBe('A+');
    expect(score.coverageScore).toBe(100);
    expect(score.isGuaranteedSecure).toBe(false);
  });

  it('should cap overall score below 50 when critical findings exist', () => {
    const mockCritical: ScanFinding = {
      id: 'f-1',
      ruleId: 'TLS-002',
      category: 'ssl_tls',
      severity: 'critical',
      confidence: 'confirmed',
      title: 'Expired Certificate',
      description: 'Expired',
      scoreDeduction: 25,
      evidence: {},
      explanation: 'Exp',
      potentialImpact: 'Imp',
      remediation: 'Fix',
      snippets: [],
      standards: [],
      verificationSteps: [],
    };

    const score = calculatePostureScore([mockCritical], 10, 10);
    expect(score.overallScore).toBeLessThan(50);
    expect(score.letterGrade).toBe('F');
  });

  it('should calculate coverage score based on attempted vs completed checks', () => {
    const score = calculatePostureScore([], 10, 8);
    expect(score.coverageScore).toBe(80);
  });
});
