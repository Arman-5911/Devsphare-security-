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
exports.evaluateSeoAndGeo = evaluateSeoAndGeo;
const cheerio = __importStar(require("cheerio"));
function evaluateSeoAndGeo(options) {
    const { url, html, robotsTxtContent = '' } = options;
    const $ = cheerio.load(html || '');
    const parsedTarget = new URL(url);
    // 1. Title & Meta Description
    const title = $('title').text().trim() || undefined;
    const titleLength = title ? title.length : 0;
    const metaDescription = $('meta[name="description" i]').attr('content')?.trim() ||
        $('meta[property="og:description" i]').attr('content')?.trim();
    const metaDescriptionLength = metaDescription ? metaDescription.length : 0;
    // 2. Canonical URL
    const canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim();
    const isCanonicalSelfReferencing = Boolean(canonicalUrl &&
        (canonicalUrl === url ||
            canonicalUrl.replace(/\/$/, '') === url.replace(/\/$/, '')));
    // 3. Headings Structure
    const h1Count = $('h1').length;
    const headingsHierarchyIssues = [];
    if (h1Count === 0) {
        headingsHierarchyIssues.push('Page is missing an <h1> main heading element.');
    }
    else if (h1Count > 1) {
        headingsHierarchyIssues.push(`Page has multiple <h1> tags (${h1Count} found). Search engines recommend exactly one <h1> per page.`);
    }
    // 4. Structured Data (Schema.org / JSON-LD)
    const schemaEntities = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const parsed = JSON.parse($(el).html() || '{}');
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    if (item['@type'])
                        schemaEntities.push(String(item['@type']));
                }
            }
            else if (parsed['@type']) {
                schemaEntities.push(String(parsed['@type']));
            }
        }
        catch { }
    });
    // Also check Microdata
    $('[itemtype]').each((_, el) => {
        const it = $(el).attr('itemtype') || '';
        const typeName = it.split('/').pop();
        if (typeName)
            schemaEntities.push(typeName);
    });
    const hasSchemaJsonLd = schemaEntities.length > 0;
    // 5. OpenGraph
    const openGraph = {};
    $('meta[property^="og:"], meta[name^="twitter:"]').each((_, el) => {
        const prop = $(el).attr('property') || $(el).attr('name');
        const content = $(el).attr('content');
        if (prop && content) {
            openGraph[prop] = content;
        }
    });
    // 6. Word Count: Raw HTML vs Hydrated Text (SPA Blank Screen Detection)
    // Strips script, style, and comments
    const clone = cheerio.load(html || '');
    clone('script, style, svg, noscript').remove();
    const rawText = clone('body').text().replace(/\s+/g, ' ').trim();
    const rawHtmlWords = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
    // Modern SPAs often ship <div id="root"></div> with < 30 raw words, while fully rendered contains 500+ words
    const isSpaBlankRisk = rawHtmlWords < 35 && html.includes('id="root"') || html.includes('id="__next"');
    const renderedWordsEstimated = isSpaBlankRisk ? Math.max(500, rawHtmlWords * 15) : rawHtmlWords;
    const wordCountDetail = isSpaBlankRisk
        ? `The initial HTML snapshot contains only ${rawHtmlWords} words. Because this application renders client-side via JavaScript, AI search bots and non-JS crawlers may index a blank or minimal page.`
        : `Initial HTML provides solid server-rendered text content (${rawHtmlWords} words) accessible to all search bots.`;
    // 7. AI Crawler Access Audit (Robots.txt evaluation)
    const aiBots = [
        { bot: 'GPTBot', platform: 'OpenAI' },
        { bot: 'ChatGPT-User', platform: 'OpenAI' },
        { bot: 'ClaudeBot', platform: 'Anthropic' },
        { bot: 'PerplexityBot', platform: 'Perplexity' },
        { bot: 'CCBot', platform: 'Common Crawl' },
        { bot: 'Google-Extended', platform: 'Google Gemini' },
        { bot: 'ByteSpider', platform: 'ByteDance' },
    ];
    const aiCrawlerAccess = [];
    const lowerRobots = robotsTxtContent.toLowerCase();
    for (const botInfo of aiBots) {
        let allowed = true;
        let directiveFound;
        // Check if user-agent block exists for this bot
        const botAgent = `user-agent: ${botInfo.bot.toLowerCase()}`;
        if (lowerRobots.includes(botAgent)) {
            const lines = robotsTxtContent.split('\n');
            let insideBotBlock = false;
            for (const line of lines) {
                const cleanLine = line.trim().toLowerCase();
                if (cleanLine.startsWith('user-agent:')) {
                    insideBotBlock = cleanLine.includes(botInfo.bot.toLowerCase());
                }
                else if (insideBotBlock && cleanLine.startsWith('disallow: /')) {
                    allowed = false;
                    directiveFound = line.trim();
                    break;
                }
            }
        }
        else {
            // Check if wildcard user-agent: * disallows all
            if (lowerRobots.includes('user-agent: *') && lowerRobots.includes('disallow: /') && !lowerRobots.includes('allow: /')) {
                allowed = false;
                directiveFound = 'Disallow: / under User-agent: *';
            }
        }
        aiCrawlerAccess.push({
            bot: botInfo.bot,
            platform: botInfo.platform,
            allowed,
            statusCode: 200,
            directiveFound,
        });
    }
    // 8. Calculate SEO Score & GEO Score
    let seoScore = 100;
    if (!title)
        seoScore -= 20;
    else if (titleLength < 25 || titleLength > 70)
        seoScore -= 6;
    if (!metaDescription)
        seoScore -= 18;
    else if (metaDescriptionLength < 70 || metaDescriptionLength > 180)
        seoScore -= 5;
    if (h1Count !== 1)
        seoScore -= 10;
    if (!canonicalUrl)
        seoScore -= 8;
    if (!hasSchemaJsonLd)
        seoScore -= 10;
    if (Object.keys(openGraph).length < 2)
        seoScore -= 6;
    seoScore = Math.max(25, Math.min(100, seoScore));
    // GEO Score (Generative Engine Optimization / AI Search Readiness)
    let geoScore = 100;
    if (isSpaBlankRisk)
        geoScore -= 35; // Major penalty for blank SPA
    if (!hasSchemaJsonLd)
        geoScore -= 20; // Schema is critical for AI extraction
    if (aiCrawlerAccess.some((b) => !b.allowed))
        geoScore -= 15; // AI crawlers blocked
    if (rawHtmlWords < 200)
        geoScore -= 10;
    geoScore = Math.max(20, Math.min(100, geoScore));
    return {
        score: seoScore,
        geoScore,
        title,
        titleLength,
        metaDescription,
        metaDescriptionLength,
        canonicalUrl,
        isCanonicalSelfReferencing,
        h1Count,
        headingsHierarchyIssues,
        structuredData: {
            hasSchemaJsonLd,
            entities: Array.from(new Set(schemaEntities)),
        },
        openGraph,
        wordCountAnalysis: {
            rawHtmlWords,
            renderedWords: renderedWordsEstimated,
            spaBlankRisk: isSpaBlankRisk,
            detail: wordCountDetail,
        },
        aiCrawlerAccess,
    };
}
