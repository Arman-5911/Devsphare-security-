import { z } from 'zod';
export type ScanStatus = 'queued' | 'resolving_dns' | 'inspecting_tls' | 'analyzing_headers' | 'inspecting_cookies' | 'crawling_pages' | 'evaluating_performance' | 'checking_accessibility' | 'auditing_seo' | 'assessing_security' | 'running_resilience' | 'evaluating_rules' | 'completed' | 'failed' | 'cancelled';
export type ScanMode = 'public' | 'verified_deep' | 'infrastructure_load';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingConfidence = 'confirmed' | 'probable' | 'heuristic';
export type AuditPillar = 'performance' | 'accessibility' | 'seo' | 'security' | 'code_qa';
export type SecurityCategory = 'ssl_tls' | 'security_headers' | 'cookie_security' | 'network_redirects' | 'info_disclosure' | 'performance' | 'accessibility' | 'seo' | 'code_qa' | 'threat_intel' | 'load_capacity';
export interface FindingRemediationSnippet {
    language: string;
    server: 'nginx' | 'apache' | 'caddy' | 'express' | 'cloudflare' | 'nextjs' | 'react' | 'general';
    title: string;
    code: string;
}
export interface FindingStandardRef {
    framework: 'OWASP Top 10' | 'OWASP ASVS' | 'CWE' | 'NIST CSF' | 'CIS' | 'RFC' | 'W3C' | 'WCAG 2.1 AA' | 'Core Web Vitals';
    identifier: string;
    title: string;
    url?: string;
}
export interface ScanFinding {
    id: string;
    ruleId: string;
    pillar?: AuditPillar;
    category: SecurityCategory;
    severity: FindingSeverity;
    confidence: FindingConfidence;
    title: string;
    description: string;
    scoreDeduction: number;
    evidence: Record<string, any>;
    explanation: string;
    potentialImpact: string;
    remediation: string;
    snippets: FindingRemediationSnippet[];
    standards: FindingStandardRef[];
    verificationSteps: string[];
}
export interface TlsCertificateInfo {
    subject: {
        commonName?: string;
        organization?: string;
        country?: string;
    };
    issuer: {
        commonName?: string;
        organization?: string;
        country?: string;
    };
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    isExpired: boolean;
    expiresSoon: boolean;
    protocol: string;
    cipherSuite: string;
    san: string[];
    isSelfSigned: boolean;
    keyExchange?: string;
    authorized: boolean;
    authorizationError?: string;
    caaRecords?: string[];
    dnssecSupported?: boolean;
}
export interface DnsRecordInfo {
    ipv4: string[];
    ipv6: string[];
    cnames: string[];
    mxRecords: {
        exchange: string;
        priority: number;
    }[];
    txtRecords: string[][];
    hasSpf: boolean;
    spfRecord?: string;
    hasDmarc: boolean;
    dmarcRecord?: string;
    nameservers: string[];
    caaRecords?: string[];
}
export interface RedirectHop {
    hopNumber: number;
    url: string;
    statusCode: number;
    location?: string;
    durationMs: number;
}
export interface RedirectAnalysis {
    initialUrl: string;
    finalUrl: string;
    isHttpToHttpsRedirect: boolean;
    redirectChain: RedirectHop[];
    totalRedirects: number;
    hasOpenRedirectRisk: boolean;
    issues: string[];
}
export interface HeaderAnalysisItem {
    name: string;
    present: boolean;
    value?: string;
    status: 'optimal' | 'warning' | 'critical' | 'missing' | 'informational';
    feedback: string;
    recommendation?: string;
}
export interface CspDirectiveDetail {
    directive: string;
    values: string[];
    isDangerous: boolean;
    issues: string[];
}
export interface SecurityHeadersAnalysis {
    rawHeaders: Record<string, string>;
    items: HeaderAnalysisItem[];
    hsts: {
        present: boolean;
        raw?: string;
        maxAgeSeconds?: number;
        includeSubDomains: boolean;
        preload: boolean;
        isOptimal: boolean;
        issues: string[];
    };
    csp: {
        present: boolean;
        raw?: string;
        isReportOnly: boolean;
        hasUnsafeInlineScript: boolean;
        hasUnsafeEval: boolean;
        hasWildcardHost: boolean;
        hasDefaultSrcOrScriptSrc: boolean;
        directives: CspDirectiveDetail[];
        issues: string[];
    };
    xFrameOptions: {
        present: boolean;
        value?: string;
        isProtected: boolean;
        issues: string[];
    };
    xContentTypeOptions: {
        present: boolean;
        value?: string;
        isNosniff: boolean;
    };
    referrerPolicy: {
        present: boolean;
        value?: string;
        isStrict: boolean;
    };
    permissionsPolicy: {
        present: boolean;
        value?: string;
        directivesCount: number;
    };
    serverLeakage: {
        serverHeader?: string;
        xPoweredBy?: string;
        aspNetVersion?: string;
        leaksTechnologies: boolean;
        detectedTech: string[];
    };
}
export interface CookieAnalysisItem {
    name: string;
    domain?: string;
    path?: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None' | 'Unset';
    hasSecurePrefix: boolean;
    hasHostPrefix: boolean;
    isTracker?: boolean;
    trackerCategory?: string;
    issues: string[];
}
export interface CategoryScore {
    category: SecurityCategory;
    name: string;
    weight: number;
    score: number;
    deductions: number;
    findingsCount: number;
}
export interface MultiPillarScores {
    overallHealth: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    radar: {
        performance: number;
        accessibility: number;
        seo: number;
        security: number;
        codeQa: number;
    };
    summary: string;
}
export interface PostureScore {
    overallScore: number;
    letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    coverageScore: number;
    categoryScores: Record<string, CategoryScore>;
    summary: string;
    totalFindings: number;
    findingsBySeverity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    isGuaranteedSecure: false;
}
export interface PassiveExposureInfo {
    robotsTxtPresent: boolean;
    robotsTxtContent?: string;
    securityTxtPresent: boolean;
    securityTxtContent?: string;
    sitemapPresent: boolean;
    exposedSensitivePaths: string[];
}
export interface CrawledPageItem {
    url: string;
    path: string;
    title: string;
    statusCode: number;
    durationMs: number;
    linksCount: number;
    internalLinks: string[];
    externalLinks: string[];
    issuesCount: number;
}
export interface CrawlSummary {
    pagesCrawled: number;
    totalLinksDiscovered: number;
    brokenInternalLinks: {
        url: string;
        sourcePage: string;
        statusCode: number;
    }[];
    brokenExternalLinks: {
        url: string;
        sourcePage: string;
        statusCode: number;
    }[];
    statusCodesCount: {
        '2xx': number;
        '3xx': number;
        '4xx': number;
        '5xx': number;
    };
    soft404: {
        tested: boolean;
        detected: boolean;
        testedPath: string;
        statusCode: number;
        detail: string;
    };
    consoleErrors: {
        page: string;
        message: string;
        type: string;
    }[];
    networkFailures: {
        url: string;
        error: string;
    }[];
    pages: CrawledPageItem[];
}
export interface NetworkWaterfallItem {
    url: string;
    resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'other';
    transferredBytes: number;
    durationMs: number;
    status: number;
}
export interface PerformanceDetails {
    ttfbMs: number;
    fcpMs: number;
    lcpMs: number;
    cls: number;
    tbtMs: number;
    speedIndex: number;
    score: number;
    rating: 'Good' | 'Needs Improvement' | 'Poor';
    totalTransferredBytes: number;
    unusedJsBytes: number;
    unusedCssBytes: number;
    codeCoveragePercent: number;
    estimatedTransferPenaltyMs: number;
    renderBlockingCount: number;
    unoptimizedImages: {
        url: string;
        sizeKb: number;
        missingDimensions: boolean;
        notModernFormat: boolean;
    }[];
    waterfall: NetworkWaterfallItem[];
}
export interface AccessibilityViolationItem {
    id: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    help: string;
    helpUrl?: string;
    nodes: {
        html: string;
        target: string[];
        failureSummary?: string;
    }[];
}
export interface AccessibilityDetails {
    score: number;
    totalViolations: number;
    seriousViolations: number;
    contrastIssuesCount: number;
    missingAltCount: number;
    formLabelIssuesCount: number;
    headingSkippedCount: number;
    tapTargetIssuesCount: number;
    landmarkIssuesCount: number;
    violations: AccessibilityViolationItem[];
    wcagRulesChecked: number;
}
export interface AiCrawlerAudit {
    bot: string;
    platform: string;
    allowed: boolean;
    statusCode: number;
    directiveFound?: string;
}
export interface SeoDetails {
    score: number;
    geoScore: number;
    title?: string;
    titleLength: number;
    metaDescription?: string;
    metaDescriptionLength: number;
    canonicalUrl?: string;
    isCanonicalSelfReferencing: boolean;
    h1Count: number;
    headingsHierarchyIssues: string[];
    structuredData: {
        hasSchemaJsonLd: boolean;
        entities: string[];
    };
    openGraph: Record<string, string>;
    wordCountAnalysis: {
        rawHtmlWords: number;
        renderedWords: number;
        spaBlankRisk: boolean;
        detail: string;
    };
    aiCrawlerAccess: AiCrawlerAudit[];
}
export interface SecurityAdvancedDetails {
    mixedContentDetected: boolean;
    mixedContentUrls: string[];
    detectedTrackers: {
        name: string;
        domain: string;
        category: string;
    }[];
    exposedSecrets: {
        type: string;
        matchSnippet: string;
        location: string;
        severity: 'critical' | 'high';
    }[];
    corsPolicy: {
        hasWildcardOrigin: boolean;
        allowCredentialsWithWildcard: boolean;
    };
}
export interface ThreatIntelligenceDetails {
    safeBrowsing: {
        checked: boolean;
        status: 'clean' | 'threat_detected' | 'unrated';
        threatsFound: string[];
        source: string;
        checkedAt: string;
    };
    detectedTechnologies: {
        name: string;
        category: string;
        version?: string;
    }[];
    knownCves: {
        cveId: string;
        affectedComponent: string;
        cvssScore: number;
        epssScore?: number;
        summary: string;
        remediation: string;
    }[];
}
export interface VerifiedAuditDetails {
    isAuthorized: boolean;
    verifiedDomain: boolean;
    testScopeApproved: boolean;
    owaspTop10Checks: {
        id: string;
        title: string;
        status: 'pass' | 'fail' | 'skipped' | 'manual_review_needed';
        evidence?: string;
    }[];
}
export interface HackRiskDetails {
    exposureScore: number;
    exploitabilityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
    attackSurfaceScore: number;
    estimatedBusinessImpact: 'Catastrophic' | 'High' | 'Moderate' | 'Low';
    confidenceLevel: 'High' | 'Medium' | 'Low' | 'Insufficient Evidence';
    epssAverage?: number;
    cvssMax?: number;
    residualRisk: string;
    summary: string;
    keyAttackVectors: string[];
}
export interface LoadCapacityDetails {
    tested: boolean;
    authorized: boolean;
    circuitBreakerTriggered: boolean;
    circuitBreakerReason?: string;
    virtualUsersTested: number;
    requestsPerSecond: number;
    successfulRequests: number;
    failedRequests: number;
    errorRatePercent: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    sloMet: boolean;
    capacityStatement: string;
}
export interface DomainVerificationInfo {
    domain: string;
    token: string;
    isVerified: boolean;
    verifiedAt?: string;
    method: 'dns_txt' | 'meta_tag';
    txtRecordExpected: string;
    metaTagExpected: string;
}
export interface ScanResult {
    id: string;
    mode: ScanMode;
    targetUrl: string;
    normalizedUrl: string;
    targetHostname: string;
    status: ScanStatus;
    startedAt: string;
    completedAt?: string;
    durationMs: number;
    errorMessage?: string;
    isDomainVerified: boolean;
    multiPillar?: MultiPillarScores;
    dns?: DnsRecordInfo;
    tls?: TlsCertificateInfo;
    redirects?: RedirectAnalysis;
    headers?: SecurityHeadersAnalysis;
    cookies?: CookieAnalysisItem[];
    passiveExposure?: PassiveExposureInfo;
    crawl?: CrawlSummary;
    performance?: PerformanceDetails;
    accessibility?: AccessibilityDetails;
    seo?: SeoDetails;
    securityAdvanced?: SecurityAdvancedDetails;
    threatIntel?: ThreatIntelligenceDetails;
    verifiedAudit?: VerifiedAuditDetails;
    hackRisk?: HackRiskDetails;
    loadCapacity?: LoadCapacityDetails;
    findings: ScanFinding[];
    score: PostureScore;
    checksAttempted: number;
    checksCompleted: number;
    checksFailed: number;
    scannerVersion: string;
}
export interface ScanSummaryItem {
    id: string;
    mode: ScanMode;
    targetUrl: string;
    targetHostname: string;
    status: ScanStatus;
    startedAt: string;
    completedAt?: string;
    durationMs: number;
    overallScore: number;
    letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    multiPillar?: {
        performance: number;
        accessibility: number;
        seo: number;
        security: number;
        codeQa: number;
    };
    findingsCount: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
}
export declare const CreateScanSchema: z.ZodObject<{
    url: z.ZodEffects<z.ZodString, string, string>;
    mode: z.ZodDefault<z.ZodEnum<["public", "verified_deep", "infrastructure_load"]>>;
    maxPages: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    loadTestVUs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    allowPrivateNetwork: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    mode: "public" | "verified_deep" | "infrastructure_load";
    maxPages: number;
    loadTestVUs: number;
    allowPrivateNetwork: boolean;
    userAgent?: string | undefined;
}, {
    url: string;
    mode?: "public" | "verified_deep" | "infrastructure_load" | undefined;
    maxPages?: number | undefined;
    loadTestVUs?: number | undefined;
    allowPrivateNetwork?: boolean | undefined;
    userAgent?: string | undefined;
}>;
export type CreateScanInput = z.infer<typeof CreateScanSchema>;
export declare const VerifyDomainSchema: z.ZodObject<{
    domain: z.ZodString;
    method: z.ZodDefault<z.ZodEnum<["dns_txt", "meta_tag"]>>;
}, "strip", z.ZodTypeAny, {
    domain: string;
    method: "dns_txt" | "meta_tag";
}, {
    domain: string;
    method?: "dns_txt" | "meta_tag" | undefined;
}>;
export type VerifyDomainInput = z.infer<typeof VerifyDomainSchema>;
export declare const ScanFilterSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["public", "verified_deep", "infrastructure_load"]>>;
    status: z.ZodOptional<z.ZodEnum<["queued", "resolving_dns", "inspecting_tls", "analyzing_headers", "inspecting_cookies", "crawling_pages", "evaluating_performance", "checking_accessibility", "auditing_seo", "assessing_security", "running_resilience", "evaluating_rules", "completed", "failed", "cancelled"]>>;
    grade: z.ZodOptional<z.ZodEnum<["A+", "A", "B", "C", "D", "F"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["startedAt", "overallScore"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    sortBy: "startedAt" | "overallScore";
    sortOrder: "asc" | "desc";
    status?: "queued" | "resolving_dns" | "inspecting_tls" | "analyzing_headers" | "inspecting_cookies" | "crawling_pages" | "evaluating_performance" | "checking_accessibility" | "auditing_seo" | "assessing_security" | "running_resilience" | "evaluating_rules" | "completed" | "failed" | "cancelled" | undefined;
    mode?: "public" | "verified_deep" | "infrastructure_load" | undefined;
    query?: string | undefined;
    grade?: "A+" | "A" | "B" | "C" | "D" | "F" | undefined;
}, {
    status?: "queued" | "resolving_dns" | "inspecting_tls" | "analyzing_headers" | "inspecting_cookies" | "crawling_pages" | "evaluating_performance" | "checking_accessibility" | "auditing_seo" | "assessing_security" | "running_resilience" | "evaluating_rules" | "completed" | "failed" | "cancelled" | undefined;
    mode?: "public" | "verified_deep" | "infrastructure_load" | undefined;
    query?: string | undefined;
    grade?: "A+" | "A" | "B" | "C" | "D" | "F" | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "startedAt" | "overallScore" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type ScanFilterInput = z.infer<typeof ScanFilterSchema>;
export type CyberLabMode = 'public_preview' | 'verified_sandbox';
export type CyberLabSessionStatus = 'initializing' | 'ready' | 'simulating' | 'fault_testing' | 'security_testing' | 'destroyed';
export interface VirtualSnapshot {
    url: string;
    title: string;
    description?: string;
    domStructure: {
        title: string;
        metaTags: Record<string, string>;
        headers: Array<{
            level: number;
            text: string;
        }>;
        links: Array<{
            text: string;
            href: string;
            isExternal: boolean;
        }>;
        forms: Array<{
            action: string;
            method: string;
            inputs: Array<{
                name: string;
                type: string;
                placeholder?: string;
            }>;
        }>;
        buttons: string[];
        scripts: string[];
        stylesheets: string[];
        images: Array<{
            src: string;
            alt?: string;
        }>;
    };
    networkResources: Array<{
        url: string;
        type: string;
        sizeBytes?: number;
        status?: number;
        cached?: boolean;
    }>;
    syntheticApis: Array<{
        path: string;
        method: string;
        mockStatus: number;
        mockResponse: Record<string, any>;
    }>;
    viewportMetrics: {
        desktop: {
            width: number;
            height: number;
            layoutShiftScore: number;
        };
        tablet: {
            width: number;
            height: number;
            layoutShiftScore: number;
        };
        mobile: {
            width: number;
            height: number;
            layoutShiftScore: number;
        };
    };
    securityHeaders: Record<string, string | null>;
    observedAt: string;
    disclaimer: string;
}
export interface TrafficSimulationResult {
    id: string;
    timestamp: string;
    vus: number;
    durationSec: number;
    totalRequests: number;
    requestsPerSecond: number;
    throughputKbps: number;
    latency: {
        p50: number;
        p90: number;
        p95: number;
        p99: number;
        min: number;
        max: number;
        avg: number;
    };
    errorRatePercent: number;
    timeouts: number;
    circuitBreakerTriggered: boolean;
    circuitBreakerReason?: string;
    bottlenecks: string[];
    timeSeries: Array<{
        second: number;
        rps: number;
        latencyP95: number;
        errors: number;
        activeVUs: number;
    }>;
    isSynthetic: true;
    disclaimer: string;
}
export type FaultType = 'db_latency' | 'db_connection_refusal' | 'cache_service_down' | 'upstream_503' | 'network_jitter' | 'worker_crash_recovery';
export interface FaultInjectionResult {
    id: string;
    timestamp: string;
    faultType: FaultType;
    parameters: Record<string, any>;
    status: 'applied' | 'recovering' | 'recovered' | 'circuit_broken';
    resilienceScore: number;
    observedBehavior: string;
    gracefulDegradation: boolean;
    userFacingErrorMessage: string;
    recoveryTimeMs: number;
    recommendations: string[];
}
export interface SandboxSecurityFinding {
    id: string;
    category: 'injection_defense' | 'xss_defense' | 'csrf_protection' | 'auth_configuration' | 'sensitive_exposure' | 'misconfiguration' | 'dependency_vuln';
    severity: FindingSeverity;
    confidence: FindingConfidence;
    title: string;
    affectedComponent: string;
    observedBehavior: string;
    expectedBehavior: string;
    evidence: Record<string, any>;
    potentialImpact: string;
    remediation: string;
    verificationSteps: string[];
    isSandboxSimulation: true;
}
export interface AiRemediationPlan {
    findingId: string;
    framework: string;
    rootCauseAnalysis: string;
    explanation: string;
    suggestedPatch: {
        filename: string;
        originalSnippet: string;
        patchedSnippet: string;
        explanation: string;
    };
    verificationTest: string;
    safeRolloutSteps: string[];
}
export interface CyberLabAuditEvent {
    id: string;
    timestamp: string;
    action: string;
    actor: string;
    details: Record<string, any>;
}
export interface CyberLabSession {
    id: string;
    name: string;
    targetUrl: string;
    mode: CyberLabMode;
    status: CyberLabSessionStatus;
    createdAt: string;
    expiresAt: string;
    verifiedDomain?: boolean;
    framework?: 'react' | 'nextjs' | 'vue' | 'angular' | 'vite' | 'express' | 'fastify' | 'python_fastapi' | 'static' | 'unknown';
    repositoryUrl?: string;
    snapshot: VirtualSnapshot;
    activeVUs: number;
    quotas: {
        maxVUs: number;
        maxDurationSec: number;
        maxFaults: number;
        memoryMb: number;
    };
    trafficSimulationHistory: TrafficSimulationResult[];
    faultInjectionHistory: FaultInjectionResult[];
    securityFindings: SandboxSecurityFinding[];
    auditEvents: CyberLabAuditEvent[];
}
export declare const CreateCyberLabSessionSchema: z.ZodObject<{
    targetUrl: z.ZodEffects<z.ZodString, string, string>;
    mode: z.ZodDefault<z.ZodEnum<["public_preview", "verified_sandbox"]>>;
    name: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodEnum<["react", "nextjs", "vue", "angular", "vite", "express", "fastify", "python_fastapi", "static", "unknown"]>>;
    repositoryUrl: z.ZodOptional<z.ZodString>;
    verifiedDomainToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mode: "public_preview" | "verified_sandbox";
    targetUrl: string;
    name?: string | undefined;
    framework?: "express" | "nextjs" | "react" | "unknown" | "vue" | "angular" | "vite" | "fastify" | "python_fastapi" | "static" | undefined;
    repositoryUrl?: string | undefined;
    verifiedDomainToken?: string | undefined;
}, {
    targetUrl: string;
    mode?: "public_preview" | "verified_sandbox" | undefined;
    name?: string | undefined;
    framework?: "express" | "nextjs" | "react" | "unknown" | "vue" | "angular" | "vite" | "fastify" | "python_fastapi" | "static" | undefined;
    repositoryUrl?: string | undefined;
    verifiedDomainToken?: string | undefined;
}>;
export type CreateCyberLabSessionInput = z.infer<typeof CreateCyberLabSessionSchema>;
export declare const SimulateTrafficSchema: z.ZodObject<{
    vus: z.ZodUnion<[z.ZodLiteral<10>, z.ZodLiteral<100>, z.ZodLiteral<500>, z.ZodLiteral<1000>]>;
    durationSec: z.ZodDefault<z.ZodNumber>;
    targetEndpoint: z.ZodDefault<z.ZodString>;
    circuitBreakerLatencyMs: z.ZodDefault<z.ZodNumber>;
    circuitBreakerErrorRatePercent: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    vus: 100 | 10 | 500 | 1000;
    durationSec: number;
    targetEndpoint: string;
    circuitBreakerLatencyMs: number;
    circuitBreakerErrorRatePercent: number;
}, {
    vus: 100 | 10 | 500 | 1000;
    durationSec?: number | undefined;
    targetEndpoint?: string | undefined;
    circuitBreakerLatencyMs?: number | undefined;
    circuitBreakerErrorRatePercent?: number | undefined;
}>;
export type SimulateTrafficInput = z.infer<typeof SimulateTrafficSchema>;
export declare const InjectFaultSchema: z.ZodObject<{
    faultType: z.ZodEnum<["db_latency", "db_connection_refusal", "cache_service_down", "upstream_503", "network_jitter", "worker_crash_recovery"]>;
    latencyMs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    failureRatePercent: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    durationSec: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    durationSec: number;
    faultType: "db_latency" | "db_connection_refusal" | "cache_service_down" | "upstream_503" | "network_jitter" | "worker_crash_recovery";
    latencyMs: number;
    failureRatePercent: number;
}, {
    faultType: "db_latency" | "db_connection_refusal" | "cache_service_down" | "upstream_503" | "network_jitter" | "worker_crash_recovery";
    durationSec?: number | undefined;
    latencyMs?: number | undefined;
    failureRatePercent?: number | undefined;
}>;
export type InjectFaultInput = z.infer<typeof InjectFaultSchema>;
export declare const RunSecuritySimSchema: z.ZodObject<{
    categories: z.ZodOptional<z.ZodArray<z.ZodEnum<["injection_defense", "xss_defense", "csrf_protection", "auth_configuration", "sensitive_exposure", "misconfiguration", "dependency_vuln"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    categories?: ("injection_defense" | "xss_defense" | "csrf_protection" | "auth_configuration" | "sensitive_exposure" | "misconfiguration" | "dependency_vuln")[] | undefined;
}, {
    categories?: ("injection_defense" | "xss_defense" | "csrf_protection" | "auth_configuration" | "sensitive_exposure" | "misconfiguration" | "dependency_vuln")[] | undefined;
}>;
export type RunSecuritySimInput = z.infer<typeof RunSecuritySimSchema>;
export declare const GenerateAiRemediationSchema: z.ZodObject<{
    findingId: z.ZodString;
    framework: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    framework: string;
    findingId: string;
}, {
    findingId: string;
    framework?: string | undefined;
}>;
export type GenerateAiRemediationInput = z.infer<typeof GenerateAiRemediationSchema>;
export type CyberLabV3ExecutionState = 'QUEUED' | 'VALIDATING' | 'CONNECTING' | 'BROWSER_STARTING' | 'DISCOVERING' | 'FUNCTIONAL_TESTING' | 'PERFORMANCE_TESTING' | 'SECURITY_TESTING' | 'CORRELATING_FINDINGS' | 'GENERATING_REPORT' | 'GENERATING_FIX_PROMPT' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED';
export type UrlValidationErrorCode = 'INVALID_URL' | 'DOMAIN_NOT_FOUND' | 'CONNECTION_TIMEOUT' | 'CONNECTION_REFUSED' | 'ACCESS_RESTRICTED' | 'CERTIFICATE_ERROR' | 'SERVER_ERROR' | 'SSRF_BLOCKED' | 'REDIRECT_LOOP' | 'PARKED_DOMAIN';
export interface UrlPreflightValidationResult {
    isValid: boolean;
    normalizedUrl: string;
    originalInput: string;
    hostname: string;
    ipAddress?: string;
    statusCode?: number;
    tlsValid: boolean;
    isParkedDomain: boolean;
    isSpaFallback: boolean;
    errorCode?: UrlValidationErrorCode;
    errorMessage?: string;
    technicalDetails?: string;
    redirectChain: string[];
}
export interface DiscoveredPage {
    url: string;
    path: string;
    title?: string;
    statusCode: number;
    discoverySource: 'navigation' | 'sitemap' | 'internal_link' | 'canonical' | 'homepage';
    loadTimeMs: number;
    isBroken: boolean;
    contentType?: string;
}
export interface FunctionalIssue {
    id: string;
    type: 'broken_link' | 'missing_asset' | 'console_error' | 'soft_404' | 'horizontal_overflow' | 'invalid_form' | 'missing_title';
    severity: FindingSeverity;
    url: string;
    message: string;
    evidence: Record<string, any>;
    selector?: string;
}
export interface FunctionalTestSummary {
    pagesTested: number;
    brokenLinksCount: number;
    missingAssetsCount: number;
    consoleErrorsCount: number;
    soft404Count: number;
    horizontalOverflowDetected: boolean;
    issues: FunctionalIssue[];
}
export interface SecurityTxtResult {
    present: boolean;
    url?: string;
    rfc9116Valid: boolean;
    contact?: string[];
    expires?: string;
    encryption?: string[];
    acknowledgments?: string[];
    preferredLanguages?: string;
    canonical?: string;
    policy?: string;
    rawContent?: string;
    issues: string[];
}
export interface CyberLabV3Run {
    id: string;
    targetUrl: string;
    normalizedUrl: string;
    state: CyberLabV3ExecutionState;
    progressPercent: number;
    currentStepTitle: string;
    currentStepDetail: string;
    startedAt: string;
    completedAt?: string;
    preflight: UrlPreflightValidationResult;
    snapshot: VirtualSnapshot;
    discoveredPages: DiscoveredPage[];
    functional: FunctionalTestSummary;
    performanceMetrics: {
        fcpMs: number;
        lcpMs: number;
        clsScore: number;
        ttfbMs: number;
        tbtMs: number;
        speedIndexMs: number;
        transferSizeBytes: number;
        requestCount: number;
        renderBlockingResources: number;
        domContentLoadedMs: number;
    };
    securityAudit: {
        tlsGrade: string;
        certificateExpiresDays: number;
        httpsEnforced: boolean;
        hstsPresent: boolean;
        cspStrictness: 'strong' | 'weak' | 'missing';
        securityTxt: SecurityTxtResult;
        headersScore: number;
    };
    trafficSimulation?: TrafficSimulationResult;
    findings: ScanFinding[];
    evidenceLog: Array<{
        timestamp: string;
        level: 'info' | 'warn' | 'error' | 'success';
        category: string;
        message: string;
        data?: Record<string, any>;
    }>;
    aiFixMasterPrompt: string;
    isCancelled?: boolean;
}
export declare const StartCyberLabV3Schema: z.ZodObject<{
    url: z.ZodString;
    isVerifiedOwner: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sandboxScope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    isVerifiedOwner: boolean;
    sandboxScope?: string | undefined;
}, {
    url: string;
    isVerifiedOwner?: boolean | undefined;
    sandboxScope?: string | undefined;
}>;
export type StartCyberLabV3Input = z.infer<typeof StartCyberLabV3Schema>;
export type VerificationFindingStatus = 'VERIFIED_FIXED' | 'STILL_PRESENT' | 'REGRESSION' | 'IMPROVED' | 'INCONCLUSIVE' | 'NOT_RETESTED' | 'NO_LONGER_APPLICABLE';
export interface FindingComparisonItem {
    findingId: string;
    ruleId: string;
    title: string;
    category: SecurityCategory;
    severity: FindingSeverity;
    status: VerificationFindingStatus;
    statusReason: string;
    baselineEvidence?: Record<string, any>;
    latestEvidence?: Record<string, any>;
    explanation: string;
    remediation: string;
}
export interface PerformanceMetricDiff {
    metric: string;
    unit: string;
    baseline: number;
    latest: number;
    delta: number;
    percentageChange: number;
    verdict: 'improved' | 'regressed' | 'neutral';
    isMeaningful: boolean;
}
export interface PerformanceComparisonSummary {
    fcp: PerformanceMetricDiff;
    lcp: PerformanceMetricDiff;
    cls: PerformanceMetricDiff;
    ttfb: PerformanceMetricDiff;
    transferSize: PerformanceMetricDiff;
    requestCount: PerformanceMetricDiff;
    overallPerformanceDelta: number;
}
export interface FunctionalRegressionItem {
    id: string;
    type: 'broken_link' | 'missing_asset' | 'console_error' | 'soft_404' | 'horizontal_overflow';
    url: string;
    message: string;
    evidence: Record<string, any>;
}
export interface VerificationSessionSummary {
    totalBaselineFindings: number;
    verifiedFixedCount: number;
    stillPresentCount: number;
    regressionsCount: number;
    improvedCount: number;
    overallVerdict: 'PASS_CLEAN' | 'PASS_IMPROVED' | 'REGRESSIONS_DETECTED' | 'PARTIAL_FIX' | 'NO_CHANGE';
    scoreDelta: number;
}
export interface VerificationSession {
    id: string;
    targetUrl: string;
    baselineRunId: string;
    baselineRun: CyberLabV3Run;
    latestRunId?: string;
    latestRun?: CyberLabV3Run;
    status: 'baseline_captured' | 'awaiting_deployment' | 'verifying' | 'completed' | 'failed';
    createdAt: string;
    verifiedAt?: string;
    summary: VerificationSessionSummary;
    findingComparisons: FindingComparisonItem[];
    performanceComparison: PerformanceComparisonSummary;
    functionalRegressions: FunctionalRegressionItem[];
    updatedAiFixPrompt: string;
    deploymentInfo?: {
        provider?: 'github' | 'vercel' | 'netlify' | 'manual' | 'custom';
        commitSha?: string;
        deploymentId?: string;
        detectedAt?: string;
        notes?: string;
    };
}
export declare const CreateVerificationSessionSchema: z.ZodObject<{
    runId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    runId: string;
}, {
    runId: string;
}>;
export type CreateVerificationSessionInput = z.infer<typeof CreateVerificationSessionSchema>;
export declare const TriggerVerificationSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
    commitSha: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    commitSha?: string | undefined;
}, {
    notes?: string | undefined;
    commitSha?: string | undefined;
}>;
export type TriggerVerificationInput = z.infer<typeof TriggerVerificationSchema>;
export declare const DeploymentWebhookSchema: z.ZodObject<{
    targetUrl: z.ZodString;
    provider: z.ZodDefault<z.ZodEnum<["github", "vercel", "netlify", "custom"]>>;
    commitSha: z.ZodOptional<z.ZodString>;
    deploymentId: z.ZodOptional<z.ZodString>;
    autoVerify: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    targetUrl: string;
    provider: "custom" | "github" | "vercel" | "netlify";
    autoVerify: boolean;
    commitSha?: string | undefined;
    deploymentId?: string | undefined;
}, {
    targetUrl: string;
    commitSha?: string | undefined;
    provider?: "custom" | "github" | "vercel" | "netlify" | undefined;
    deploymentId?: string | undefined;
    autoVerify?: boolean | undefined;
}>;
export type DeploymentWebhookInput = z.infer<typeof DeploymentWebhookSchema>;
