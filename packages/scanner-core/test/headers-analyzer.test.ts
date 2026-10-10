import { describe, it, expect } from 'vitest';
import { analyzeHeaders } from '../src/headers-analyzer';

describe('HTTP Security Headers Analyzer', () => {
  it('should flag missing HSTS, CSP, and X-Frame-Options', () => {
    const analysis = analyzeHeaders({});
    expect(analysis.hsts.present).toBe(false);
    expect(analysis.csp.present).toBe(false);
    expect(analysis.xFrameOptions.isProtected).toBe(false);
    expect(analysis.xContentTypeOptions.isNosniff).toBe(false);
  });

  it('should correctly parse optimal HSTS', () => {
    const analysis = analyzeHeaders({
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    });
    expect(analysis.hsts.present).toBe(true);
    expect(analysis.hsts.maxAgeSeconds).toBe(31536000);
    expect(analysis.hsts.includeSubDomains).toBe(true);
    expect(analysis.hsts.preload).toBe(true);
    expect(analysis.hsts.isOptimal).toBe(true);
  });

  it('should identify unsafe-inline and unsafe-eval in CSP', () => {
    const analysis = analyzeHeaders({
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';",
    });
    expect(analysis.csp.present).toBe(true);
    expect(analysis.csp.hasUnsafeInlineScript).toBe(true);
    expect(analysis.csp.hasUnsafeEval).toBe(true);
  });

  it('should detect server technology version leakage', () => {
    const analysis = analyzeHeaders({
      server: 'Apache/2.4.52 (Ubuntu)',
      'x-powered-by': 'Express',
    });
    expect(analysis.serverLeakage.leaksTechnologies).toBe(true);
    expect(analysis.serverLeakage.detectedTech.length).toBeGreaterThan(0);
  });
});
