import { describe, it, expect } from 'vitest';
import { evaluateSeoAndGeo } from '../src/seo-geo-engine';

describe('SEO & AI Search Readiness Engine (GEO)', () => {
  it('should detect title, meta, schema, and AI crawler permissions', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page For SEO & AI Search</title>
          <meta name="description" content="This is an enterprise website testing SEO and Generative Engine Optimization.">
          <link rel="canonical" href="https://example.com">
          <script type="application/ld+json">
            { "@context": "https://schema.org", "@type": "Organization", "name": "DevSphere" }
          </script>
        </head>
        <body>
          <h1>Main Heading</h1>
          <p>Lots of good content here for crawlers and humans alike.</p>
        </body>
      </html>
    `;

    const robotsTxt = `
      User-agent: *
      Allow: /

      User-agent: GPTBot
      Disallow: /
    `;

    const seo = evaluateSeoAndGeo({
      url: 'https://example.com',
      html: mockHtml,
      robotsTxtContent: robotsTxt,
    });

    expect(seo.title).toBe('Test Page For SEO & AI Search');
    expect(seo.h1Count).toBe(1);
    expect(seo.structuredData.hasSchemaJsonLd).toBe(true);
    expect(seo.structuredData.entities).toContain('Organization');

    const gptBot = seo.aiCrawlerAccess.find((b) => b.bot === 'GPTBot');
    expect(gptBot?.allowed).toBe(false);

    const claudeBot = seo.aiCrawlerAccess.find((b) => b.bot === 'ClaudeBot');
    expect(claudeBot?.allowed).toBe(true);
  });
});
