"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentWebhookSchema = exports.TriggerVerificationSchema = exports.CreateVerificationSessionSchema = exports.StartCyberLabV3Schema = exports.GenerateAiRemediationSchema = exports.RunSecuritySimSchema = exports.InjectFaultSchema = exports.SimulateTrafficSchema = exports.CreateCyberLabSessionSchema = exports.ScanFilterSchema = exports.VerifyDomainSchema = exports.CreateScanSchema = void 0;
const zod_1 = require("zod");
// Zod validation schemas for API
exports.CreateScanSchema = zod_1.z.object({
    url: zod_1.z
        .string({ required_error: 'URL is required' })
        .min(3, 'URL must be at least 3 characters')
        .max(2048, 'URL must not exceed 2048 characters')
        .refine((val) => {
        try {
            const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
            const parsed = new URL(withProto);
            const host = parsed.hostname;
            return (['http:', 'https:'].includes(parsed.protocol) &&
                host.length > 0 &&
                (host.includes('.') || host === 'localhost') &&
                !host.includes(' '));
        }
        catch {
            return false;
        }
    }, { message: 'Invalid URL format. Must be a valid domain or web address (e.g. example.com).' }),
    mode: zod_1.z.enum(['public', 'verified_deep', 'infrastructure_load']).default('public'),
    maxPages: zod_1.z.number().min(1).max(100).optional().default(15),
    loadTestVUs: zod_1.z.number().min(1).max(50).optional().default(10),
    allowPrivateNetwork: zod_1.z.boolean().optional().default(false),
    userAgent: zod_1.z.string().optional(),
});
exports.VerifyDomainSchema = zod_1.z.object({
    domain: zod_1.z.string().min(3),
    method: zod_1.z.enum(['dns_txt', 'meta_tag']).default('dns_txt'),
});
exports.ScanFilterSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    mode: zod_1.z.enum(['public', 'verified_deep', 'infrastructure_load']).optional(),
    status: zod_1.z.enum([
        'queued',
        'resolving_dns',
        'inspecting_tls',
        'analyzing_headers',
        'inspecting_cookies',
        'crawling_pages',
        'evaluating_performance',
        'checking_accessibility',
        'auditing_seo',
        'assessing_security',
        'running_resilience',
        'evaluating_rules',
        'completed',
        'failed',
        'cancelled',
    ]).optional(),
    grade: zod_1.z.enum(['A+', 'A', 'B', 'C', 'D', 'F']).optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().min(0).default(0),
    sortBy: zod_1.z.enum(['startedAt', 'overallScore']).default('startedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Zod schemas for CyberLab
exports.CreateCyberLabSessionSchema = zod_1.z.object({
    targetUrl: zod_1.z
        .string({ required_error: 'URL is required' })
        .min(3, 'URL must be at least 3 characters')
        .max(2048, 'URL must not exceed 2048 characters')
        .refine((val) => {
        try {
            const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
            const parsed = new URL(withProto);
            const host = parsed.hostname;
            return (['http:', 'https:'].includes(parsed.protocol) &&
                host.length > 0 &&
                (host.includes('.') || host === 'localhost') &&
                !host.includes(' '));
        }
        catch {
            return false;
        }
    }, { message: 'Invalid URL format. Must be a valid domain or web address.' }),
    mode: zod_1.z.enum(['public_preview', 'verified_sandbox']).default('public_preview'),
    name: zod_1.z.string().optional(),
    framework: zod_1.z
        .enum([
        'react',
        'nextjs',
        'vue',
        'angular',
        'vite',
        'express',
        'fastify',
        'python_fastapi',
        'static',
        'unknown',
    ])
        .optional(),
    repositoryUrl: zod_1.z.string().url().optional(),
    verifiedDomainToken: zod_1.z.string().optional(),
});
exports.SimulateTrafficSchema = zod_1.z.object({
    vus: zod_1.z.union([zod_1.z.literal(10), zod_1.z.literal(100), zod_1.z.literal(500), zod_1.z.literal(1000)]),
    durationSec: zod_1.z.number().min(5).max(60).default(10),
    targetEndpoint: zod_1.z.string().default('/'),
    circuitBreakerLatencyMs: zod_1.z.number().min(200).max(10000).default(3000),
    circuitBreakerErrorRatePercent: zod_1.z.number().min(5).max(100).default(50),
});
exports.InjectFaultSchema = zod_1.z.object({
    faultType: zod_1.z.enum([
        'db_latency',
        'db_connection_refusal',
        'cache_service_down',
        'upstream_503',
        'network_jitter',
        'worker_crash_recovery',
    ]),
    latencyMs: zod_1.z.number().min(50).max(10000).optional().default(1500),
    failureRatePercent: zod_1.z.number().min(1).max(100).optional().default(100),
    durationSec: zod_1.z.number().min(5).max(60).optional().default(15),
});
exports.RunSecuritySimSchema = zod_1.z.object({
    categories: zod_1.z
        .array(zod_1.z.enum([
        'injection_defense',
        'xss_defense',
        'csrf_protection',
        'auth_configuration',
        'sensitive_exposure',
        'misconfiguration',
        'dependency_vuln',
    ]))
        .optional(),
});
exports.GenerateAiRemediationSchema = zod_1.z.object({
    findingId: zod_1.z.string(),
    framework: zod_1.z.string().optional().default('nextjs'),
});
exports.StartCyberLabV3Schema = zod_1.z.object({
    url: zod_1.z
        .string({ required_error: 'URL is required' })
        .min(1, 'Please enter a URL')
        .max(2048, 'URL must not exceed 2048 characters'),
    isVerifiedOwner: zod_1.z.boolean().optional().default(false),
    sandboxScope: zod_1.z.string().optional(),
});
exports.CreateVerificationSessionSchema = zod_1.z.object({
    runId: zod_1.z.string({ required_error: 'Baseline CyberLab run ID is required' }),
});
exports.TriggerVerificationSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    commitSha: zod_1.z.string().optional(),
});
exports.DeploymentWebhookSchema = zod_1.z.object({
    targetUrl: zod_1.z.string(),
    provider: zod_1.z.enum(['github', 'vercel', 'netlify', 'custom']).default('custom'),
    commitSha: zod_1.z.string().optional(),
    deploymentId: zod_1.z.string().optional(),
    autoVerify: zod_1.z.boolean().default(true),
});
