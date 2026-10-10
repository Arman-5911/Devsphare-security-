"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeFetch = safeFetch;
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const ssrf_protection_1 = require("./ssrf-protection");
async function safeFetch(options) {
    const { url, method = 'GET', maxRedirects = 5, timeoutMs = 8000, maxBodyBytes = 2 * 1024 * 1024, // 2MB limit
    allowPrivate = false, } = options;
    let currentUrl = url;
    const redirectHops = [];
    let hopCount = 0;
    const initialUrl = url;
    while (hopCount <= maxRedirects) {
        const parsed = new URL(currentUrl);
        // SSRF Check on current hop host
        const ssrfCheck = await (0, ssrf_protection_1.validatePublicTarget)(parsed.hostname, allowPrivate);
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
        const isHttpToHttpsRedirect = initialUrl.startsWith('http://') &&
            currentUrl.startsWith('https://') &&
            redirectHops.length > 0;
        const redirectAnalysis = {
            initialUrl,
            finalUrl: currentUrl,
            isHttpToHttpsRedirect,
            redirectChain: redirectHops,
            totalRedirects: redirectHops.length,
            hasOpenRedirectRisk: redirectHops.length >= 4,
            issues: [],
        };
        if (redirectHops.length > 3) {
            redirectAnalysis.issues.push(`Excessive redirect chain detected (${redirectHops.length} hops). This degrades latency and may introduce security risks.`);
        }
        if (initialUrl.startsWith('http://') && !isHttpToHttpsRedirect) {
            redirectAnalysis.issues.push('HTTP is not automatically redirected to secure HTTPS.');
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
function executeSingleRequest(options) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(options.url);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;
        const reqOptions = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: `${parsed.pathname || '/'}${parsed.search || ''}`,
            method: options.method,
            headers: {
                'User-Agent': 'DevSphere-Security-Scanner/1.0 (Passive Posture Auditor; +https://devsphere.security/bot)',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                Connection: 'close',
            },
            timeout: options.timeoutMs,
        };
        const req = client.request(reqOptions, (res) => {
            const statusCode = res.statusCode || 0;
            const headers = {};
            const setCookieHeaders = [];
            for (const [key, value] of Object.entries(res.headers)) {
                if (!value)
                    continue;
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'set-cookie') {
                    if (Array.isArray(value)) {
                        setCookieHeaders.push(...value);
                    }
                    else {
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
                }
                else {
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
