"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRoutes = scanRoutes;
const shared_1 = require("@devsphere/shared");
const scanner_core_1 = require("@devsphere/scanner-core");
const scan_store_1 = require("../storage/scan-store");
const scan_queue_1 = require("../queue/scan-queue");
const crypto_1 = __importDefault(require("crypto"));
async function scanRoutes(fastify, _opts) {
    // 1. Create and enqueue scan with Mode support (A, B, C)
    fastify.post('/scans', {
        schema: {
            description: 'Initiate a website audit (Mode A: Public, Mode B: Verified Owner, Mode C: Infrastructure Resilience)',
            tags: ['Scans'],
            body: {
                type: 'object',
                required: ['url'],
                properties: {
                    url: { type: 'string', description: 'Target website URL (e.g. https://example.com)' },
                    mode: { type: 'string', enum: ['public', 'verified_deep', 'infrastructure_load'], default: 'public' },
                    maxPages: { type: 'number', default: 15 },
                    loadTestVUs: { type: 'number', default: 10 },
                    allowPrivateNetwork: { type: 'boolean', default: false },
                },
            },
        },
    }, async (req, reply) => {
        const parseRes = shared_1.CreateScanSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                details: parseRes.error.flatten().fieldErrors,
            });
        }
        const { url, mode, maxPages, loadTestVUs, allowPrivateNetwork } = parseRes.data;
        const norm = (0, scanner_core_1.normalizeUrl)(url);
        if (!norm.isValid) {
            return reply.status(400).send({
                error: 'Invalid Target URL',
                message: norm.error,
            });
        }
        const scanId = `scan_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`;
        // Initialize scan record in store
        scan_store_1.scanStore.save({
            id: scanId,
            mode: mode || 'public',
            targetUrl: url,
            normalizedUrl: norm.normalizedUrl,
            targetHostname: norm.hostname,
            status: 'queued',
            startedAt: new Date().toISOString(),
            durationMs: 0,
            isDomainVerified: scanner_core_1.domainVerifier.isVerified(norm.hostname),
            findings: [],
            score: {
                overallScore: 0,
                letterGrade: 'F',
                coverageScore: 0,
                categoryScores: {},
                summary: 'Audit initialized in scanning worker.',
                totalFindings: 0,
                findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
                isGuaranteedSecure: false,
            },
            checksAttempted: 0,
            checksCompleted: 0,
            checksFailed: 0,
            scannerVersion: '2.0.0-enterprise',
        });
        // Enqueue worker
        scan_queue_1.scanQueue.enqueue(scanId, norm.normalizedUrl, {
            mode: mode || 'public',
            maxPages,
            loadTestVUs,
            allowPrivate: allowPrivateNetwork,
        });
        return reply.status(201).send({
            scanId,
            targetUrl: norm.normalizedUrl,
            mode: mode || 'public',
            status: 'queued',
            message: `Audit successfully queued in Mode [${mode || 'public'}].`,
        });
    });
    // 2. List and search scans
    fastify.get('/scans', {
        schema: {
            description: 'List scans with filtering, searching, and pagination',
            tags: ['Scans'],
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    mode: { type: 'string', enum: ['public', 'verified_deep', 'infrastructure_load'] },
                    status: { type: 'string' },
                    grade: { type: 'string' },
                    limit: { type: 'number', default: 20 },
                    offset: { type: 'number', default: 0 },
                    sortBy: { type: 'string', enum: ['startedAt', 'overallScore'], default: 'startedAt' },
                    sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                },
            },
        },
    }, async (req, reply) => {
        const parseRes = shared_1.ScanFilterSchema.safeParse(req.query);
        if (!parseRes.success) {
            return reply.status(400).send({
                error: 'Invalid Query Parameters',
                details: parseRes.error.flatten().fieldErrors,
            });
        }
        const results = scan_store_1.scanStore.list(parseRes.data);
        return reply.send(results);
    });
    // 3. Compare two scans
    fastify.get('/scans/compare', {
        schema: {
            description: 'Compare security posture, health scores, and findings between two scans',
            tags: ['Scans'],
            querystring: {
                type: 'object',
                required: ['scanA', 'scanB'],
                properties: {
                    scanA: { type: 'string' },
                    scanB: { type: 'string' },
                },
            },
        },
    }, async (req, reply) => {
        const { scanA: idA, scanB: idB } = req.query;
        if (!idA || !idB) {
            return reply.status(400).send({ error: 'Both scanA and scanB query parameters are required.' });
        }
        const scanA = scan_store_1.scanStore.getById(idA);
        const scanB = scan_store_1.scanStore.getById(idB);
        if (!scanA || !scanB) {
            return reply.status(404).send({ error: 'One or both scan IDs were not found.' });
        }
        const scoreA = scanA.multiPillar?.overallHealth ?? scanA.score?.overallScore ?? 0;
        const scoreB = scanB.multiPillar?.overallHealth ?? scanB.score?.overallScore ?? 0;
        const scoreDiff = scoreB - scoreA;
        const ruleIdsA = new Set(scanA.findings.map((f) => f.ruleId));
        const ruleIdsB = new Set(scanB.findings.map((f) => f.ruleId));
        const resolvedInB = scanA.findings.filter((f) => !ruleIdsB.has(f.ruleId));
        const newInB = scanB.findings.filter((f) => !ruleIdsA.has(f.ruleId));
        const persistent = scanB.findings.filter((f) => ruleIdsA.has(f.ruleId));
        return reply.send({
            scanA: {
                id: scanA.id,
                targetUrl: scanA.targetUrl,
                mode: scanA.mode,
                startedAt: scanA.startedAt,
                score: scoreA,
                grade: scanA.multiPillar?.grade ?? scanA.score?.letterGrade,
                radar: scanA.multiPillar?.radar,
            },
            scanB: {
                id: scanB.id,
                targetUrl: scanB.targetUrl,
                mode: scanB.mode,
                startedAt: scanB.startedAt,
                score: scoreB,
                grade: scanB.multiPillar?.grade ?? scanB.score?.letterGrade,
                radar: scanB.multiPillar?.radar,
            },
            scoreDelta: scoreDiff,
            improved: scoreDiff > 0,
            resolvedFindings: resolvedInB,
            newFindings: newInB,
            persistentFindings: persistent,
        });
    });
    // 4. Get scan by ID
    fastify.get('/scans/:id', {
        schema: {
            description: 'Retrieve detailed multi-pillar scan result and progress',
            tags: ['Scans'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (req, reply) => {
        const scan = scan_store_1.scanStore.getById(req.params.id);
        if (!scan) {
            return reply.status(404).send({ error: 'Scan not found' });
        }
        return reply.send(scan);
    });
    // 5. Get findings for a scan
    fastify.get('/scans/:id/findings', {
        schema: {
            description: 'Get actionable security findings for a scan',
            tags: ['Scans'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
            querystring: {
                type: 'object',
                properties: {
                    severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                },
            },
        },
    }, async (req, reply) => {
        const scan = scan_store_1.scanStore.getById(req.params.id);
        if (!scan) {
            return reply.status(404).send({ error: 'Scan not found' });
        }
        let findings = scan.findings;
        if (req.query?.severity) {
            findings = findings.filter((f) => f.severity === req.query.severity);
        }
        return reply.send({
            scanId: scan.id,
            targetUrl: scan.targetUrl,
            mode: scan.mode,
            totalFindings: findings.length,
            findings,
        });
    });
    // 6. Get enterprise executive report
    fastify.get('/scans/:id/report', {
        schema: {
            description: 'Get comprehensive enterprise audit report structured like BugViso benchmark',
            tags: ['Scans'],
        },
    }, async (req, reply) => {
        const scan = scan_store_1.scanStore.getById(req.params.id);
        if (!scan) {
            return reply.status(404).send({ error: 'Scan not found' });
        }
        return reply.send({
            meta: {
                platform: 'DevSphere Security V2 Ultimate Enterprise Audit Engine',
                reportType: `Full Spectrum Audit (${scan.mode.toUpperCase()})`,
                generatedAt: new Date().toISOString(),
                scannerVersion: scan.scannerVersion,
            },
            executiveSummary: {
                id: scan.id,
                mode: scan.mode,
                targetUrl: scan.targetUrl,
                normalizedUrl: scan.normalizedUrl,
                targetHostname: scan.targetHostname,
                startedAt: scan.startedAt,
                completedAt: scan.completedAt,
                durationMs: scan.durationMs,
                isDomainVerified: scan.isDomainVerified,
                overallHealth: scan.multiPillar?.overallHealth ?? scan.score?.overallScore,
                grade: scan.multiPillar?.grade ?? scan.score?.letterGrade,
                radar: scan.multiPillar?.radar,
                summary: scan.multiPillar?.summary ?? scan.score?.summary,
            },
            crawlInventory: scan.crawl,
            performance: scan.performance,
            accessibility: scan.accessibility,
            seoAndGeo: scan.seo,
            securityPerimeter: {
                tls: scan.tls,
                headers: scan.headers,
                cookies: scan.cookies,
                securityAdvanced: scan.securityAdvanced,
            },
            threatIntelligence: scan.threatIntel,
            hackRiskExposure: scan.hackRisk,
            loadResilience: scan.loadCapacity,
            findings: scan.findings,
            disclaimer: 'IMPORTANT: This assessment reflects evidence collected from configured test scopes. In accordance with DevSphere security policy, no automated scanner guarantees 100% absence of unobserved vulnerabilities.',
        });
    });
    // 7. Cancel a running or queued scan
    fastify.post('/scans/:id/cancel', {
        schema: {
            description: 'Cancel a pending or active scan',
            tags: ['Scans'],
        },
    }, async (req, reply) => {
        const success = scan_queue_1.scanQueue.cancel(req.params.id);
        if (!success) {
            return reply.status(400).send({ error: 'Scan could not be cancelled or does not exist.' });
        }
        return reply.send({ message: 'Scan cancellation requested.' });
    });
    // 7a. Delete a single scan record
    fastify.delete('/scans/:id', {
        schema: {
            description: 'Delete a single scan result from history',
            tags: ['Scans'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (req, reply) => {
        const { id } = req.params;
        const deleted = scan_store_1.scanStore.delete(id);
        if (!deleted) {
            return reply.status(404).send({ error: `Scan record '${id}' not found.` });
        }
        return reply.send({ success: true, message: `Scan '${id}' successfully deleted.` });
    });
    // 7b. Delete multiple scans or clear entire history
    fastify.delete('/scans', {
        schema: {
            description: 'Delete multiple scan records or clear entire scan history',
            tags: ['Scans'],
        },
    }, async (req, reply) => {
        const body = req.body || {};
        const query = req.query || {};
        if (body.all === true || query.all === 'true') {
            const beforeCount = scan_store_1.scanStore.count();
            scan_store_1.scanStore.clear();
            return reply.send({
                success: true,
                message: 'All scan history successfully cleared.',
                deletedCount: beforeCount,
            });
        }
        if (Array.isArray(body.ids) && body.ids.length > 0) {
            const count = scan_store_1.scanStore.deleteMany(body.ids);
            return reply.send({
                success: true,
                message: `Deleted ${count} scan(s).`,
                deletedCount: count,
            });
        }
        return reply.status(400).send({
            error: 'Please specify { ids: string[] } to delete specific scans, or { all: true } / ?all=true to clear all history.',
        });
    });
    // 8. Domain Verification Token Generator (GET & POST)
    fastify.get('/domains/token', {
        schema: {
            description: 'Get verification token and instructions for a domain via query params',
            tags: ['Domains'],
            querystring: {
                type: 'object',
                required: ['domain'],
                properties: {
                    domain: { type: 'string' },
                    method: { type: 'string', enum: ['dns_txt', 'meta_tag'], default: 'dns_txt' },
                },
            },
        },
    }, async (req, reply) => {
        const domain = req.query.domain;
        if (!domain)
            return reply.status(400).send({ error: 'Domain query parameter required.' });
        const method = req.query.method === 'meta_tag' ? 'meta_tag' : 'dns_txt';
        const info = scanner_core_1.domainVerifier.generateTokenForDomain(domain, method);
        return reply.send(info);
    });
    fastify.post('/domains/token', {
        schema: {
            description: 'Generate verification token and DNS TXT / Meta tag instructions for a domain',
            tags: ['Domains'],
            body: {
                type: 'object',
                required: ['domain'],
                properties: {
                    domain: { type: 'string' },
                    method: { type: 'string', enum: ['dns_txt', 'meta_tag'], default: 'dns_txt' },
                },
            },
        },
    }, async (req, reply) => {
        const parseRes = shared_1.VerifyDomainSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({ error: 'Invalid domain format' });
        }
        const info = scanner_core_1.domainVerifier.generateTokenForDomain(parseRes.data.domain, parseRes.data.method);
        return reply.send(info);
    });
    // 9. Domain Ownership Verification Check
    fastify.post('/domains/verify', {
        schema: {
            description: 'Verify domain ownership by probing DNS TXT records or HTML meta tag',
            tags: ['Domains'],
            body: {
                type: 'object',
                required: ['domain'],
                properties: {
                    domain: { type: 'string' },
                    method: { type: 'string', enum: ['dns_txt', 'meta_tag'] },
                },
            },
        },
    }, async (req, reply) => {
        const parseRes = shared_1.VerifyDomainSchema.safeParse(req.body);
        if (!parseRes.success) {
            return reply.status(400).send({ error: 'Invalid domain format' });
        }
        const result = await scanner_core_1.domainVerifier.verifyDomainOwnership(parseRes.data.domain, parseRes.data.method);
        return reply.send(result);
    });
}
