import { describe, it, expect } from 'vitest';
import { crawlWebsite } from '../src/crawler-engine';

describe('Website Crawler & Link Inventory Engine', () => {
  it('should boundedly crawl and return status distribution and soft 404 test', async () => {
    const summary = await crawlWebsite({
      rootUrl: 'https://example.com',
      maxPages: 2,
    });

    expect(summary.pagesCrawled).toBeGreaterThanOrEqual(1);
    expect(summary.statusCodesCount['2xx']).toBeGreaterThanOrEqual(1);
    expect(summary.soft404.tested).toBe(true);
    expect(Array.isArray(summary.pages)).toBe(true);
  }, 15000);
});
