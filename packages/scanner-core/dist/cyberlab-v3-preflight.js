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
exports.validateAndPreflightUrl = validateAndPreflightUrl;
const dns = __importStar(require("dns"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_validator_1 = require("./url-validator");
const ssrf_protection_1 = require("./ssrf-protection");
/**
 * Intelligent URL Validation & Reachability Preflight Engine for CyberLab V3
 * Handles all network, TLS, DNS, parking, and HTTP reachability states.
 */
async function validateAndPreflightUrl(rawInput) {
    const normalized = (0, url_validator_1.normalizeUrl)(rawInput);
    if (!normalized.isValid) {
        return {
            isValid: false,
            normalizedUrl: normalized.normalizedUrl || rawInput,
            originalInput: rawInput,
            hostname: normalized.hostname || '',
            tlsValid: false,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: 'INVALID_URL',
            errorMessage: 'The website address is not valid. Please check the URL syntax.',
            technicalDetails: normalized.error || 'Failed URL scheme or hostname syntax parsing.',
            redirectChain: [],
        };
    }
    const hostname = normalized.hostname;
    // 1. Static Hostname & Direct IP checks
    if (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')) {
        return {
            isValid: false,
            normalizedUrl: normalized.normalizedUrl,
            originalInput: rawInput,
            hostname,
            tlsValid: false,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: 'SSRF_BLOCKED',
            errorMessage: 'Target points to a restricted internal or loopback address.',
            technicalDetails: `SSRF Block: Hostname ${hostname} is restricted.`,
            redirectChain: [],
        };
    }
    // 2. DNS Resolution
    let resolvedIp;
    try {
        const dnsLookup = await dns.promises.lookup(hostname, { family: 4 });
        resolvedIp = dnsLookup.address;
    }
    catch (dnsErr) {
        const code = dnsErr.code;
        const isNotFound = code === 'ENOTFOUND' || code === 'ENODATA';
        return {
            isValid: false,
            normalizedUrl: normalized.normalizedUrl,
            originalInput: rawInput,
            hostname,
            tlsValid: false,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: isNotFound ? 'DOMAIN_NOT_FOUND' : 'CONNECTION_TIMEOUT',
            errorMessage: isNotFound
                ? 'This domain could not be resolved (NXDOMAIN). The website address may not exist.'
                : 'DNS lookup timed out while resolving domain records.',
            technicalDetails: `DNS lookup failed with code ${code || 'UNKNOWN'}: ${dnsErr.message}`,
            redirectChain: [],
        };
    }
    // 3. SSRF Private IP check on resolved address
    const ssrfCheck = await (0, ssrf_protection_1.validatePublicTarget)(hostname, false);
    if (!ssrfCheck.isAllowed) {
        return {
            isValid: false,
            normalizedUrl: normalized.normalizedUrl,
            originalInput: rawInput,
            hostname,
            ipAddress: resolvedIp,
            tlsValid: false,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: 'SSRF_BLOCKED',
            errorMessage: 'Target points to a restricted internal or private address.',
            technicalDetails: `SSRF Block triggered: ${ssrfCheck.blockedReason}`,
            redirectChain: [],
        };
    }
    // 3. HTTP/HTTPS Reachability & Redirect Following
    const redirectChain = [];
    let currentUrl = normalized.normalizedUrl;
    let hopCount = 0;
    const maxHops = 5;
    let finalStatusCode;
    let finalBody = '';
    let tlsValid = false;
    while (hopCount <= maxHops) {
        redirectChain.push(currentUrl);
        try {
            const response = await fetchHop(currentUrl, 10000);
            finalStatusCode = response.statusCode;
            finalBody = response.body;
            if (currentUrl.startsWith('https:')) {
                tlsValid = response.tlsAuthorized;
            }
            // Check redirect
            if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.location) {
                let nextUrl;
                try {
                    nextUrl = new URL(response.location, currentUrl).toString();
                }
                catch {
                    break;
                }
                if (redirectChain.includes(nextUrl)) {
                    return {
                        isValid: false,
                        normalizedUrl: currentUrl,
                        originalInput: rawInput,
                        hostname,
                        ipAddress: resolvedIp,
                        statusCode: response.statusCode,
                        tlsValid,
                        isParkedDomain: false,
                        isSpaFallback: false,
                        errorCode: 'REDIRECT_LOOP',
                        errorMessage: 'The website is trapped in an infinite HTTP redirect loop.',
                        technicalDetails: `Circular redirect detected: ${redirectChain.join(' -> ')} -> ${nextUrl}`,
                        redirectChain,
                    };
                }
                hopCount++;
                currentUrl = nextUrl;
                continue;
            }
            // Terminal response reached
            break;
        }
        catch (reqErr) {
            const errMsg = (reqErr.message || '').toLowerCase();
            let errorCode = 'CONNECTION_TIMEOUT';
            let userMsg = 'The website did not respond within the allowed time.';
            if (errMsg.includes('cert') || errMsg.includes('tls') || errMsg.includes('handshake')) {
                errorCode = 'CERTIFICATE_ERROR';
                userMsg = 'TLS handshake or certificate verification failed on the target server.';
            }
            else if (errMsg.includes('econnrefused')) {
                errorCode = 'CONNECTION_REFUSED';
                userMsg = 'Connection refused by the origin server on the target port.';
            }
            return {
                isValid: false,
                normalizedUrl: currentUrl,
                originalInput: rawInput,
                hostname,
                ipAddress: resolvedIp,
                tlsValid: false,
                isParkedDomain: false,
                isSpaFallback: false,
                errorCode,
                errorMessage: userMsg,
                technicalDetails: reqErr.message,
                redirectChain,
            };
        }
    }
    // Evaluate final status code
    if (finalStatusCode && finalStatusCode >= 500) {
        return {
            isValid: false,
            normalizedUrl: currentUrl,
            originalInput: rawInput,
            hostname,
            ipAddress: resolvedIp,
            statusCode: finalStatusCode,
            tlsValid,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: 'SERVER_ERROR',
            errorMessage: `The origin server returned an internal failure (HTTP ${finalStatusCode}).`,
            technicalDetails: `Server error HTTP ${finalStatusCode} received from origin.`,
            redirectChain,
        };
    }
    if (finalStatusCode === 403 || finalStatusCode === 401) {
        return {
            isValid: true, // Reachable, but restricted
            normalizedUrl: currentUrl,
            originalInput: rawInput,
            hostname,
            ipAddress: resolvedIp,
            statusCode: finalStatusCode,
            tlsValid,
            isParkedDomain: false,
            isSpaFallback: false,
            errorCode: 'ACCESS_RESTRICTED',
            errorMessage: `The website is reachable but restricted automated access (HTTP ${finalStatusCode}).`,
            technicalDetails: `Access restricted response (HTTP ${finalStatusCode}) returned by origin.`,
            redirectChain,
        };
    }
    // 4. Domain Parking & Fallback Detection
    const isParkedDomain = detectParkedDomain(finalBody, hostname);
    const isSpaFallback = detectSpaFallback(finalBody);
    return {
        isValid: true,
        normalizedUrl: currentUrl,
        originalInput: rawInput,
        hostname,
        ipAddress: resolvedIp,
        statusCode: finalStatusCode || 200,
        tlsValid,
        isParkedDomain,
        isSpaFallback,
        redirectChain,
    };
}
function fetchHop(targetUrl, timeoutMs) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(targetUrl);
        const isHttps = parsed.protocol === 'https:';
        const lib = isHttps ? https : http;
        const req = lib.request(targetUrl, {
            method: 'GET',
            timeout: timeoutMs,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 DevSphere-CyberLab/3.0',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            rejectUnauthorized: false, // passive inspection allows analyzing untrusted certs
        }, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                if (body.length < 500000) {
                    body += chunk;
                }
            });
            res.on('end', () => {
                const socket = res.socket;
                const tlsAuthorized = isHttps && socket ? Boolean(socket.authorized) : false;
                resolve({
                    statusCode: res.statusCode || 200,
                    location: res.headers.location,
                    body,
                    tlsAuthorized,
                });
            });
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Connection timed out'));
        });
        req.on('error', (err) => {
            reject(err);
        });
        req.end();
    });
}
function detectParkedDomain(body, hostname) {
    if (!body)
        return false;
    const lower = body.toLowerCase();
    const parkingKeywords = [
        'this domain is for sale',
        'buy this domain',
        'domain parking',
        'parked by godaddy',
        'namecheap parking page',
        'sedo domain parking',
        'dan.com/buy-domain',
        'inquire about this domain',
        'domain is registered at',
        'domain may be for sale',
    ];
    return parkingKeywords.some((keyword) => lower.includes(keyword));
}
function detectSpaFallback(body) {
    if (!body)
        return false;
    const lower = body.toLowerCase();
    return (lower.includes('<div id="root"></div>') ||
        lower.includes('<div id="__next"></div>') ||
        lower.includes('<app-root></app-root>'));
}
