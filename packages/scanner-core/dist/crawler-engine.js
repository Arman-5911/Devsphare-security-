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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlWebsite = crawlWebsite;
const cheerio = __importStar(require("cheerio"));
const safe_http_client_1 = require("./safe-http-client");
const crypto_1 = __importDefault(require("crypto"));
async function crawlWebsite(options) {
    const { rootUrl, maxPages = 15, timeoutPerRequestMs = 6000, allowPrivate = false, } = options;
    const parsedRoot = new URL(rootUrl);
    const targetOrigin = parsedRoot.origin;
    const targetHost = parsedRoot.hostname.toLowerCase();
    const visitedUrls = new Set();
    const toVisitQueue = [rootUrl];
    const pages = [];
    const brokenInternalLinks = [];
    const brokenExternalLinks = [];
    const consoleErrors = [];
    const networkFailures = [];
    const statusCodesCount = {
        '2xx': 0,
        '3xx': 0,
        '4xx': 0,
        '5xx': 0,
    };
    const discoveredExternal = new Set();
    let totalLinksCount = 0;
    // 1. Multi-Page Crawl Loop
    while (toVisitQueue.length > 0 && pages.length < maxPages) {
        const currentUrl = toVisitQueue.shift();
        if (visitedUrls.has(currentUrl))
            continue;
        visitedUrls.add(currentUrl);
        const startTime = Date.now();
        try {
            const res = await (0, safe_http_client_1.safeFetch)({
                url: currentUrl,
                timeoutMs: timeoutPerRequestMs,
                allowPrivate,
            });
            const durationMs = Date.now() - startTime;
            // Classify status code
            if (res.statusCode >= 200 && res.statusCode < 300)
                statusCodesCount['2xx']++;
            else if (res.statusCode >= 300 && res.statusCode < 400)
                statusCodesCount['3xx']++;
            else if (res.statusCode >= 400 && res.statusCode < 500) {
                statusCodesCount['4xx']++;
                brokenInternalLinks.push({
                    url: currentUrl,
                    sourcePage: rootUrl,
                    statusCode: res.statusCode,
                });
            }
            else if (res.statusCode >= 500) {
                statusCodesCount['5xx']++;
                brokenInternalLinks.push({
                    url: currentUrl,
                    sourcePage: rootUrl,
                    statusCode: res.statusCode,
                });
            }
            // Parse HTML
            const $ = cheerio.load(res.body || '');
            const title = $('title').text().trim() || parsedRoot.pathname;
            const internalLinks = [];
            const externalLinks = [];
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (!href)
                    return;
                totalLinksCount++;
                try {
                    const resolved = new URL(href, currentUrl);
                    // Ignore anchor hashes, javascript:, mailto:, tel:
                    if (['javascript:', 'mailto:', 'tel:'].includes(resolved.protocol))
                        return;
                    if (resolved.origin === targetOrigin) {
                        const cleanUrl = `${resolved.origin}${resolved.pathname}${resolved.search}`;
                        internalLinks.push(cleanUrl);
                        if (!visitedUrls.has(cleanUrl) && !toVisitQueue.includes(cleanUrl)) {
                            // Avoid non-html extensions
                            if (!/\.(png|jpg|jpeg|gif|svg|pdf|zip|tar|gz|mp4|webm|css|js)$/i.test(resolved.pathname)) {
                                toVisitQueue.push(cleanUrl);
                            }
                        }
                    }
                    else {
                        externalLinks.push(resolved.href);
                        discoveredExternal.add(resolved.href);
                    }
                }
                catch { }
            });
            pages.push({
                url: currentUrl,
                path: new URL(currentUrl).pathname,
                title,
                statusCode: res.statusCode,
                durationMs,
                linksCount: internalLinks.length + externalLinks.length,
                internalLinks: internalLinks.slice(0, 50),
                externalLinks: externalLinks.slice(0, 50),
                issuesCount: res.statusCode >= 400 ? 1 : 0,
            });
        }
        catch (err) {
            networkFailures.push({ url: currentUrl, error: err.message });
            statusCodesCount['5xx']++;
        }
    }
    // 2. Soft 404 Detection (probe unknown URL)
    let soft404 = {
        tested: true,
        detected: false,
        testedPath: `/_devsphere-404-check-${crypto_1.default.randomBytes(6).toString('hex')}`,
        statusCode: 404,
        detail: 'Unknown route correctly answered with HTTP 404 Not Found.',
    };
    try {
        const softRes = await (0, safe_http_client_1.safeFetch)({
            url: `${targetOrigin}${soft404.testedPath}`,
            timeoutMs: 4000,
            allowPrivate,
        });
        soft404.statusCode = softRes.statusCode;
        if (softRes.statusCode === 200) {
            soft404.detected = true;
            soft404.detail =
                `A request for a non-existent path (${soft404.testedPath}) returned HTTP 200 instead of 404 (Soft 404). Search engines and broken-link checkers may fail to detect missing routes.`;
        }
    }
    catch { }
    // 3. Sample check 3 external links for broken status
    const externalSample = Array.from(discoveredExternal).slice(0, 3);
    for (const extUrl of externalSample) {
        try {
            const extRes = await (0, safe_http_client_1.safeFetch)({
                url: extUrl,
                method: 'HEAD',
                timeoutMs: 3000,
                allowPrivate: false,
            });
            if (extRes.statusCode >= 400) {
                brokenExternalLinks.push({
                    url: extUrl,
                    sourcePage: rootUrl,
                    statusCode: extRes.statusCode,
                });
            }
        }
        catch { }
    }
    return {
        pagesCrawled: pages.length,
        totalLinksDiscovered: totalLinksCount,
        brokenInternalLinks,
        brokenExternalLinks,
        statusCodesCount,
        soft404,
        consoleErrors,
        networkFailures,
        pages,
    };
}
