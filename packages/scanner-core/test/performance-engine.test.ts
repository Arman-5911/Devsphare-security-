import { describe, it, expect } from 'vitest';
import { evaluatePerformance } from '../src/performance-engine';

describe('Performance & Core Web Vitals Engine', () => {
  it('should compute TTFB, FCP, LCP, and code coverage', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/styles.css">
          <script src="/app.bundle.js"></script>
        </head>
        <body>
          <h1>Performance Test</h1>
          <img src="/photo.jpg" alt="test">
        </body>
      </html>
    `;

    const perf = await evaluatePerformance({
      url: 'https://example.com',
      html: mockHtml,
      initialDurationMs: 150,
      headers: {},
    });

    expect(perf.ttfbMs).toBeGreaterThan(0);
    expect(perf.fcpMs).toBeGreaterThan(perf.ttfbMs);
    expect(perf.lcpMs).toBeGreaterThanOrEqual(perf.fcpMs);
    expect(perf.unusedJsBytes).toBeGreaterThan(0);
    expect(perf.waterfall.length).toBeGreaterThanOrEqual(3);
  });
});
