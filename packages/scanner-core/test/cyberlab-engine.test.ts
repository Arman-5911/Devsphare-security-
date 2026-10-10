import { describe, it, expect } from 'vitest';
import { CyberLabEngine } from '../src/cyberlab-engine';

describe('CyberLabEngine', () => {
  const engine = new CyberLabEngine();

  it('detects frameworks correctly from markup and headers', () => {
    expect(engine.detectFramework('<div id="__next"><div>App</div></div>')).toBe('nextjs');
    expect(engine.detectFramework('<div id="root"></div>', { 'x-powered-by': 'React' })).toBe('react');
    expect(engine.detectFramework('<div data-v-12345></div>')).toBe('vue');
    expect(engine.detectFramework('<app-root ng-version="16.0.0"></app-root>')).toBe('angular');
    expect(engine.detectFramework('<html>', { 'x-powered-by': 'Express' })).toBe('express');
    expect(engine.detectFramework('<html>', { server: 'uvicorn' })).toBe('python_fastapi');
    expect(engine.detectFramework('<!doctype html><html><body>Static</body></html>')).toBe('static');
  });

  it('simulates controlled mock traffic without sending external requests', () => {
    const result10 = engine.simulateMockTraffic({
      vus: 10,
      durationSec: 10,
      targetEndpoint: '/',
      circuitBreakerLatencyMs: 3000,
      circuitBreakerErrorRatePercent: 50,
    });

    expect(result10.isSynthetic).toBe(true);
    expect(result10.vus).toBe(10);
    expect(result10.durationSec).toBe(10);
    expect(result10.totalRequests).toBeGreaterThan(0);
    expect(result10.requestsPerSecond).toBeGreaterThan(0);
    expect(result10.latency.p50).toBeGreaterThan(0);
    expect(result10.latency.p95).toBeGreaterThanOrEqual(result10.latency.p50);
    expect(result10.timeSeries.length).toBe(10);
    expect(result10.circuitBreakerTriggered).toBe(false);

    // High load simulation triggers higher latency or warnings
    const result1000 = engine.simulateMockTraffic({
      vus: 1000,
      durationSec: 10,
      targetEndpoint: '/api',
      circuitBreakerLatencyMs: 50, // Intentional low threshold to test circuit breaker
      circuitBreakerErrorRatePercent: 50,
    });

    expect(result1000.vus).toBe(1000);
    expect(result1000.circuitBreakerTriggered).toBe(true);
    expect(result1000.circuitBreakerReason).toBeDefined();
    expect(result1000.bottlenecks.length).toBeGreaterThan(0);
  });

  it('simulates infrastructure faults and calculates resilience scores', () => {
    const dbLatencyFault = engine.injectFault({
      faultType: 'db_latency',
      latencyMs: 1500,
      failureRatePercent: 100,
      durationSec: 10,
    });

    expect(dbLatencyFault.faultType).toBe('db_latency');
    expect(dbLatencyFault.resilienceScore).toBeGreaterThan(0);
    expect(dbLatencyFault.gracefulDegradation).toBe(true);
    expect(dbLatencyFault.recommendations.length).toBeGreaterThan(0);

    const dbRefusalFault = engine.injectFault({
      faultType: 'db_connection_refusal',
      latencyMs: 1000,
      failureRatePercent: 100,
      durationSec: 10,
    });

    expect(dbRefusalFault.status).toBe('circuit_broken');
    expect(dbRefusalFault.observedBehavior).toContain('ECONNREFUSED');
  });

  it('generates safe sandbox defensive findings with full evidence', () => {
    const findings = engine.runSandboxSecuritySimulation();

    expect(findings.length).toBeGreaterThanOrEqual(5);
    const xssFinding = findings.find((f) => f.category === 'xss_defense');
    expect(xssFinding).toBeDefined();
    expect(xssFinding?.isSandboxSimulation).toBe(true);
    expect(xssFinding?.severity).toBe('high');
    expect(xssFinding?.evidence).toBeDefined();
    expect(xssFinding?.verificationSteps.length).toBeGreaterThan(0);
  });

  it('generates evidence-grounded AI remediation plan with code patches', () => {
    const findings = engine.runSandboxSecuritySimulation();
    const xssFinding = findings.find((f) => f.category === 'xss_defense')!;

    const remediation = engine.generateAiRemediation(xssFinding, 'nextjs');

    expect(remediation.findingId).toBe(xssFinding.id);
    expect(remediation.framework).toBe('nextjs');
    expect(remediation.suggestedPatch.patchedSnippet).toContain('nonce');
    expect(remediation.verificationTest).toContain('Content Security Policy');
    expect(remediation.safeRolloutSteps.length).toBeGreaterThan(0);
  });
});
