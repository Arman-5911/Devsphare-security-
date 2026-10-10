import { describe, it, expect } from 'vitest';
import { AutoFixVerificationEngine } from '../src/autofix-verification-engine';
import { CyberLabV3Run, ScanFinding } from '@devsphere/shared';

describe('AutoFixVerificationEngine Suite', () => {
  const engine = new AutoFixVerificationEngine();

  const mockFinding1: ScanFinding = {
    id: 'SEC_001',
    ruleId: 'SEC_CSP_MISSING',
    category: 'security_headers',
    severity: 'high',
    confidence: 'confirmed',
    title: 'Missing Content-Security-Policy',
    description: 'CSP header missing',
    scoreDeduction: 15,
    evidence: { header: 'content-security-policy', value: null },
    explanation: 'No CSP configured',
    potentialImpact: 'XSS risk',
    remediation: 'Add CSP header',
    snippets: [],
    standards: [],
    verificationSteps: [],
  };

  const mockFinding2: ScanFinding = {
    id: 'SEC_002',
    ruleId: 'SEC_HSTS_MISSING',
    category: 'security_headers',
    severity: 'medium',
    confidence: 'confirmed',
    title: 'Missing Strict-Transport-Security',
    description: 'HSTS missing',
    scoreDeduction: 10,
    evidence: { header: 'strict-transport-security', value: null },
    explanation: 'HSTS missing',
    potentialImpact: 'MitM risk',
    remediation: 'Add HSTS',
    snippets: [],
    standards: [],
    verificationSteps: [],
  };

  const baselineRun: CyberLabV3Run = {
    id: 'run_baseline_01',
    targetUrl: 'https://example.com',
    normalizedUrl: 'https://example.com/',
    state: 'COMPLETED',
    progressPercent: 100,
    currentStepTitle: 'Done',
    currentStepDetail: 'Scan complete',
    startedAt: '2026-10-10T10:00:00.000Z',
    preflight: {
      isValid: true,
      normalizedUrl: 'https://example.com/',
      originalInput: 'example.com',
      hostname: 'example.com',
      tlsValid: true,
      isParkedDomain: false,
      isSpaFallback: false,
      statusCode: 200,
      redirectChain: [],
    },
    snapshot: {
      url: 'https://example.com',
      title: 'Example Domain',
      domStructure: { title: 'Example', metaTags: {}, headers: [], links: [], forms: [], buttons: [], scripts: [], stylesheets: [], images: [] },
      networkResources: [],
      syntheticApis: [],
      viewportMetrics: {
        desktop: { width: 1440, height: 900, layoutShiftScore: 0.05 },
        tablet: { width: 768, height: 1024, layoutShiftScore: 0.05 },
        mobile: { width: 375, height: 667, layoutShiftScore: 0.05 },
      },
      securityHeaders: {},
      observedAt: '2026-10-10T10:00:00.000Z',
      disclaimer: 'Mock Preview',
    },
    discoveredPages: [
      { url: 'https://example.com/', path: '/', statusCode: 200, discoverySource: 'homepage', loadTimeMs: 120, isBroken: false },
      { url: 'https://example.com/about', path: '/about', statusCode: 200, discoverySource: 'navigation', loadTimeMs: 110, isBroken: false },
    ],
    functional: { pagesTested: 2, brokenLinksCount: 0, missingAssetsCount: 0, consoleErrorsCount: 0, soft404Count: 0, horizontalOverflowDetected: false, issues: [] },
    performanceMetrics: {
      fcpMs: 900,
      lcpMs: 1600,
      clsScore: 0.05,
      ttfbMs: 180,
      tbtMs: 80,
      speedIndexMs: 1200,
      transferSizeBytes: 200000,
      requestCount: 15,
      renderBlockingResources: 2,
      domContentLoadedMs: 700,
    },
    securityAudit: {
      tlsGrade: 'B',
      certificateExpiresDays: 45,
      httpsEnforced: true,
      hstsPresent: false,
      cspStrictness: 'missing',
      securityTxt: { present: false, rfc9116Valid: false, issues: [] },
      headersScore: 50,
    },
    findings: [mockFinding1, mockFinding2],
    evidenceLog: [],
    aiFixMasterPrompt: '',
  };

  it('correctly classifies VERIFIED_FIXED when issues are resolved in re-scan', () => {
    // Latest run where SEC_001 (CSP) is fixed, SEC_002 (HSTS) remains
    const latestRun: CyberLabV3Run = {
      ...baselineRun,
      id: 'run_latest_01',
      startedAt: '2026-10-10T10:30:00.000Z',
      findings: [mockFinding2], // mockFinding1 is now absent!
      securityAudit: {
        ...baselineRun.securityAudit,
        headersScore: 75,
      },
      performanceMetrics: {
        ...baselineRun.performanceMetrics,
        lcpMs: 1200, // Improved LCP
      },
    };

    const result = engine.compareRuns(baselineRun, latestRun);

    expect(result.summary.totalBaselineFindings).toBe(2);
    expect(result.summary.verifiedFixedCount).toBe(1);
    expect(result.summary.stillPresentCount).toBe(1);
    expect(result.summary.regressionsCount).toBe(0);
    expect(result.summary.overallVerdict).toBe('PASS_IMPROVED');

    const fixedItem = result.findingComparisons.find((f) => f.ruleId === 'SEC_CSP_MISSING');
    expect(fixedItem?.status).toBe('VERIFIED_FIXED');

    const stillPresentItem = result.findingComparisons.find((f) => f.ruleId === 'SEC_HSTS_MISSING');
    expect(stillPresentItem?.status).toBe('STILL_PRESENT');

    // Performance LCP improvement delta
    expect(result.performanceComparison.lcp.delta).toBe(-400);
    expect(result.performanceComparison.lcp.verdict).toBe('improved');

    // AI prompt includes both resolved and still present
    expect(result.updatedAiFixPrompt).toContain('VERIFIED FIXED ISSUES');
    expect(result.updatedAiFixPrompt).toContain('Missing Content-Security-Policy');
    expect(result.updatedAiFixPrompt).toContain('UNRESOLVED ISSUES');
  });

  it('detects REGRESSION when a new finding or broken route is introduced', () => {
    const newBugFinding: ScanFinding = {
      id: 'SEC_003',
      ruleId: 'SEC_X_FRAME_OPTIONS_MISSING',
      category: 'security_headers',
      severity: 'medium',
      confidence: 'confirmed',
      title: 'Missing X-Frame-Options Header',
      description: 'Clickjacking vulnerability',
      scoreDeduction: 10,
      evidence: { header: 'x-frame-options', value: null },
      explanation: 'Missing header',
      potentialImpact: 'Clickjacking',
      remediation: 'Set X-Frame-Options: DENY',
      snippets: [],
      standards: [],
      verificationSteps: [],
    };

    const latestRunWithRegression: CyberLabV3Run = {
      ...baselineRun,
      id: 'run_latest_02',
      startedAt: '2026-10-10T11:00:00.000Z',
      // Resolved mockFinding1, kept mockFinding2, but introduced newBugFinding!
      findings: [mockFinding2, newBugFinding],
      // And /about route is now broken 404!
      discoveredPages: [
        { url: 'https://example.com/', path: '/', statusCode: 200, discoverySource: 'homepage', loadTimeMs: 120, isBroken: false },
        { url: 'https://example.com/about', path: '/about', statusCode: 404, discoverySource: 'navigation', loadTimeMs: 110, isBroken: true },
      ],
    };

    const result = engine.compareRuns(baselineRun, latestRunWithRegression);

    expect(result.summary.regressionsCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.overallVerdict).toBe('REGRESSIONS_DETECTED');

    const regressionItem = result.findingComparisons.find((f) => f.ruleId === 'SEC_X_FRAME_OPTIONS_MISSING');
    expect(regressionItem?.status).toBe('REGRESSION');

    // Functional route regression detected
    expect(result.functionalRegressions.length).toBe(1);
    expect(result.functionalRegressions[0].message).toContain('/about');

    expect(result.updatedAiFixPrompt).toContain('NEW REGRESSIONS DETECTED (URGENT HOTFIX REQUIRED)');
  });
});
