import { PassiveExposureInfo } from '@devsphere/shared';
import { safeFetch } from './safe-http-client';

export async function inspectPassiveExposure(
  baseUrl: string,
  allowPrivate = false
): Promise<PassiveExposureInfo> {
  const result: PassiveExposureInfo = {
    robotsTxtPresent: false,
    securityTxtPresent: false,
    sitemapPresent: false,
    exposedSensitivePaths: [],
  };

  const parsed = new URL(baseUrl);
  const origin = `${parsed.protocol}//${parsed.host}`;

  // 1. Check robots.txt
  try {
    const robotsRes = await safeFetch({
      url: `${origin}/robots.txt`,
      timeoutMs: 4000,
      allowPrivate,
    });
    if (robotsRes.statusCode === 200 && robotsRes.body.length > 0) {
      result.robotsTxtPresent = true;
      result.robotsTxtContent = robotsRes.body.slice(0, 1000); // sample
      
      const sensitivePatterns = [
        /admin/i,
        /backup/i,
        /config/i,
        /secret/i,
        /internal/i,
        /\.git/i,
        /\.env/i,
        /staging/i,
      ];

      for (const line of robotsRes.body.split('\n')) {
        if (/^\s*disallow:/i.test(line)) {
          const path = line.split(':')[1]?.trim();
          if (path && sensitivePatterns.some((p) => p.test(path))) {
            result.exposedSensitivePaths.push(path);
          }
        }
      }
    }
  } catch {}

  // 2. Check security.txt (RFC 9116)
  try {
    const secRes = await safeFetch({
      url: `${origin}/.well-known/security.txt`,
      timeoutMs: 4000,
      allowPrivate,
    });
    if (secRes.statusCode === 200 && secRes.body.includes('Contact:')) {
      result.securityTxtPresent = true;
      result.securityTxtContent = secRes.body.slice(0, 1000);
    } else {
      // Fallback check on root /security.txt
      const secResRoot = await safeFetch({
        url: `${origin}/security.txt`,
        timeoutMs: 4000,
        allowPrivate,
      });
      if (secResRoot.statusCode === 200 && secResRoot.body.includes('Contact:')) {
        result.securityTxtPresent = true;
        result.securityTxtContent = secResRoot.body.slice(0, 1000);
      }
    }
  } catch {}

  // 3. Check sitemap.xml
  try {
    const sitemapRes = await safeFetch({
      url: `${origin}/sitemap.xml`,
      timeoutMs: 4000,
      allowPrivate,
    });
    if (sitemapRes.statusCode === 200) {
      result.sitemapPresent = true;
    }
  } catch {}

  return result;
}
