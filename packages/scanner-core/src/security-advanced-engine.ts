import * as cheerio from 'cheerio';
import { SecurityAdvancedDetails } from '@devsphere/shared';

const TRACKER_SIGNATURES: { name: string; domain: string; category: string }[] = [
  { name: 'Google Analytics', domain: 'google-analytics.com', category: 'Analytics' },
  { name: 'Google Tag Manager', domain: 'googletagmanager.com', category: 'Tag Management' },
  { name: 'Meta Pixel', domain: 'connect.facebook.net', category: 'Advertising' },
  { name: 'TikTok Pixel', domain: 'analytics.tiktok.com', category: 'Advertising' },
  { name: 'Hotjar', domain: 'hotjar.com', category: 'Session Recording' },
  { name: 'Datadog RUM', domain: 'datadoghq.com', category: 'Monitoring' },
  { name: 'Mixpanel', domain: 'mixpanel.com', category: 'Product Analytics' },
  { name: 'Segment', domain: 'segment.io', category: 'Customer Data' },
  { name: 'FullStory', domain: 'fullstory.com', category: 'Session Recording' },
];

const SECRET_PATTERNS: { type: string; regex: RegExp; severity: 'critical' | 'high' }[] = [
  {
    type: 'AWS Access Key ID',
    regex: /(?:^|[^A-Z0-9])(AKIA[0-9A-Z]{16})(?:[^A-Z0-9]|$)/,
    severity: 'critical',
  },
  {
    type: 'Google Cloud API Key',
    regex: /(AIza[0-9A-Za-z\-_]{35})/,
    severity: 'high',
  },
  {
    type: 'GitHub Personal Access Token',
    regex: /(ghp_[0-9a-zA-Z]{36})/,
    severity: 'critical',
  },
  {
    type: 'Stripe Secret Key',
    regex: /(sk_live_[0-9a-zA-Z]{24,34})/,
    severity: 'critical',
  },
  {
    type: 'Private Cryptographic Key',
    regex: /(-----BEGIN [A-Z]+ PRIVATE KEY-----)/,
    severity: 'critical',
  },
];

export function evaluateSecurityAdvanced(
  url: string,
  html: string,
  headers: Record<string, string>
): SecurityAdvancedDetails {
  const $ = cheerio.load(html || '');
  const isHttps = url.startsWith('https://');

  // 1. Mixed Content Detection
  const mixedContentUrls: string[] = [];
  if (isHttps) {
    $('script[src], link[href], img[src], iframe[src]').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      if (src && src.startsWith('http://')) {
        mixedContentUrls.push(src);
      }
    });
  }

  // 2. Detected Trackers
  const detectedTrackers: { name: string; domain: string; category: string }[] = [];
  const htmlLower = html.toLowerCase();

  for (const tracker of TRACKER_SIGNATURES) {
    if (htmlLower.includes(tracker.domain)) {
      detectedTrackers.push(tracker);
    }
  }

  // 3. Client-Side Secret Exposure Scanner
  const exposedSecrets: {
    type: string;
    matchSnippet: string;
    location: string;
    severity: 'critical' | 'high';
  }[] = [];

  $('script').each((i, el) => {
    const scriptContent = $(el).html() || '';
    for (const pattern of SECRET_PATTERNS) {
      const match = scriptContent.match(pattern.regex);
      if (match) {
        const secretVal = match[1];
        // Redact secret for safe reporting: show first 4 and last 3 chars
        const redacted =
          secretVal.slice(0, 4) + '...' + secretVal.slice(-3);
        exposedSecrets.push({
          type: pattern.type,
          matchSnippet: redacted,
          location: `Inline <script> block #${i + 1}`,
          severity: pattern.severity,
        });
      }
    }
  });

  // 4. CORS Policy Audit
  const acao = headers['access-control-allow-origin'];
  const acac = headers['access-control-allow-credentials'];
  const hasWildcardOrigin = acao === '*';
  const allowCredentialsWithWildcard = hasWildcardOrigin && acac?.toLowerCase() === 'true';

  return {
    mixedContentDetected: mixedContentUrls.length > 0,
    mixedContentUrls: mixedContentUrls.slice(0, 10),
    detectedTrackers,
    exposedSecrets,
    corsPolicy: {
      hasWildcardOrigin,
      allowCredentialsWithWildcard,
    },
  };
}
