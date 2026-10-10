import * as http from 'http';
import * as https from 'https';
import { RedirectHop, RedirectAnalysis } from '@devsphere/shared';
import { validatePublicTarget } from './ssrf-protection';

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  rawHeaders: string[];
  body: string;
  finalUrl: string;
  redirects: RedirectAnalysis;
  setCookieHeaders: string[];
}

export interface HttpRequestOptions {
  url: string;
  method?: string;
  maxRedirects?: number;
  timeoutMs?: number;
  maxBodyBytes?: number;
  allowPrivate?: boolean;
}

export async function safeFetch(options: HttpRequestOptions): Promise<HttpResponse> {
  const {
    url,
    method = 'GET',
    maxRedirects = 5,
    timeoutMs = 8000,
    maxBodyBytes = 2 * 1024 * 1024, // 2MB limit
    allowPrivate = false,
  } = options;

  let currentUrl = url;
  const redirectHops: RedirectHop[] = [];
  let hopCount = 0;
  const initialUrl = url;

  while (hopCount <= maxRedirects) {
    const parsed = new URL(currentUrl);

    // SSRF Check on current hop host
    const ssrfCheck = await validatePublicTarget(parsed.hostname, allowPrivate);
    if (!ssrfCheck.isAllowed) {
      throw new Error(`SSRF Blocked on hop ${hopCount}: ${ssrfCheck.blockedReason}`);
    }

    const startTime = Date.now();
    const hopResponse = await executeSingleRequest({
      url: currentUrl,
      method,
      timeoutMs,
      maxBodyBytes,
    });
    const durationMs = Date.now() - startTime;

    const statusCode = hopResponse.statusCode;
    const isRedirect = [301, 302, 303, 307, 308].includes(statusCode);

    if (isRedirect && hopResponse.headers['location']) {
      const location = hopResponse.headers['location'];
      const nextUrl = new URL(location, currentUrl).toString();

      redirectHops.push({
        hopNumber: hopCount + 1,
        url: currentUrl,
        statusCode,
        location: nextUrl,
        durationMs,
      });

      hopCount++;
      currentUrl = nextUrl;
      continue;
    }

    // Terminal response reached
    const isHttpToHttpsRedirect =
      initialUrl.startsWith('http://') &&
      currentUrl.startsWith('https://') &&
      redirectHops.length > 0;

    const redirectAnalysis: RedirectAnalysis = {
      initialUrl,
      finalUrl: currentUrl,
      isHttpToHttpsRedirect,
      redirectChain: redirectHops,
      totalRedirects: redirectHops.length,
      hasOpenRedirectRisk: redirectHops.length >= 4,
      issues: [],
    };

    if (redirectHops.length > 3) {
      redirectAnalysis.issues.push(
        `Excessive redirect chain detected (${redirectHops.length} hops). This degrades latency and may introduce security risks.`
      );
    }

    if (initialUrl.startsWith('http://') && !isHttpToHttpsRedirect) {
      redirectAnalysis.issues.push(
        'HTTP is not automatically redirected to secure HTTPS.'
      );
    }

    return {
      statusCode: hopResponse.statusCode,
      headers: hopResponse.headers,
      rawHeaders: hopResponse.rawHeaders,
      body: hopResponse.body,
      finalUrl: currentUrl,
      redirects: redirectAnalysis,
      setCookieHeaders: hopResponse.setCookieHeaders,
    };
  }

  throw new Error(`Exceeded maximum allowed redirects (${maxRedirects})`);
}

function executeSingleRequest(options: {
  url: string;
  method: string;
  timeoutMs: number;
  maxBodyBytes: number;
}): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  rawHeaders: string[];
  body: string;
  setCookieHeaders: string[];
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions: http.RequestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: `${parsed.pathname || '/'}${parsed.search || ''}`,
      method: options.method,
      headers: {
        'User-Agent':
          'DevSphere-Security-Scanner/1.0 (Passive Posture Auditor; +https://devsphere.security/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'close',
      },
      timeout: options.timeoutMs,
    };

    const req = client.request(reqOptions, (res) => {
      const statusCode = res.statusCode || 0;
      const headers: Record<string, string> = {};
      const setCookieHeaders: string[] = [];

      for (const [key, value] of Object.entries(res.headers)) {
        if (!value) continue;
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'set-cookie') {
          if (Array.isArray(value)) {
            setCookieHeaders.push(...value);
          } else {
            setCookieHeaders.push(value);
          }
        }
        headers[lowerKey] = Array.isArray(value) ? value.join('; ') : value;
      }

      let bodyData = '';
      let bytesReceived = 0;

      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
        if (bytesReceived <= options.maxBodyBytes) {
          bodyData += chunk.toString('utf8');
        } else {
          // If body exceeds limit, destroy stream to avoid DOS
          res.destroy();
        }
      });

      res.on('end', () => {
        resolve({
          statusCode,
          headers,
          rawHeaders: res.rawHeaders,
          body: bodyData,
          setCookieHeaders,
        });
      });

      res.on('error', (err) => {
        reject(err);
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${options.timeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}
