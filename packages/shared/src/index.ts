import { z } from 'zod';

export type ScanStatus =
  | 'queued'
  | 'resolving_dns'
  | 'inspecting_tls'
  | 'analyzing_headers'
  | 'inspecting_cookies'
  | 'crawling_pages'
  | 'evaluating_performance'
  | 'checking_accessibility'
  | 'auditing_seo'
  | 'assessing_security'
  | 'running_resilience'
  | 'evaluating_rules'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ScanMode = 'public' | 'verified_deep' | 'infrastructure_load';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingConfidence = 'confirmed' | 'probable' | 'heuristic';

export type AuditPillar =
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'security'
  | 'code_qa';

export type SecurityCategory =
  | 'ssl_tls'
  | 'security_headers'
  | 'cookie_security'
  | 'network_redirects'
  | 'info_disclosure'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'code_qa'
  | 'threat_intel'
  | 'load_capacity';

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
  expiresSoon: boolean; // < 30 days
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
  mxRecords: { exchange: string; priority: number }[];
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
  weight: number; // e.g. 0.25 (25%)
  score: number; // 0 - 100
  deductions: number;
  findingsCount: number;
}

export interface MultiPillarScores {
  overallHealth: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  radar: {
    performance: number; // 0 - 100
    accessibility: number; // 0 - 100
    seo: number; // 0 - 100
    security: number; // 0 - 100
    codeQa: number; // 0 - 100
  };
  summary: string;
}

export interface PostureScore {
  overallScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  coverageScore: number; // 0 - 100% of checks successfully performed
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

// -------------------------------------------------------------
// ENGINE 02: CRAWLER & LINK INVENTORY
// -------------------------------------------------------------
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
  brokenInternalLinks: { url: string; sourcePage: string; statusCode: number }[];
  brokenExternalLinks: { url: string; sourcePage: string; statusCode: number }[];
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
  consoleErrors: { page: string; message: string; type: string }[];
  networkFailures: { url: string; error: string }[];
  pages: CrawledPageItem[];
}

// -------------------------------------------------------------
// ENGINE 03: ADVANCED PERFORMANCE & CORE WEB VITALS
// -------------------------------------------------------------
export interface NetworkWaterfallItem {
  url: string;
  resourceType: 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'other';
  transferredBytes: number;
  durationMs: number;
  status: number;
}

export interface PerformanceDetails {
  ttfbMs: number; // Time to First Byte (target < 800ms)
  fcpMs: number;  // First Contentful Paint (target < 1800ms)
  lcpMs: number;  // Largest Contentful Paint (target < 2500ms)
  cls: number;    // Cumulative Layout Shift (target < 0.1)
  tbtMs: number;  // Total Blocking Time (target < 200ms)
  speedIndex: number;
  score: number;  // 0 - 100
  rating: 'Good' | 'Needs Improvement' | 'Poor';
  totalTransferredBytes: number;
  unusedJsBytes: number;
  unusedCssBytes: number;
  codeCoveragePercent: number; // e.g. 64% used
  estimatedTransferPenaltyMs: number; // On 1.6 Mbps link
  renderBlockingCount: number;
  unoptimizedImages: {
    url: string;
    sizeKb: number;
    missingDimensions: boolean;
    notModernFormat: boolean;
  }[];
  waterfall: NetworkWaterfallItem[];
}

// -------------------------------------------------------------
// ENGINE 04: ACCESSIBILITY (WCAG 2.1 AA)
// -------------------------------------------------------------
export interface AccessibilityViolationItem {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl?: string;
  nodes: { html: string; target: string[]; failureSummary?: string }[];
}

export interface AccessibilityDetails {
  score: number; // 0 - 100
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

// -------------------------------------------------------------
// ENGINE 05: SEO & AI SEARCH READINESS (GEO)
// -------------------------------------------------------------
export interface AiCrawlerAudit {
  bot: string;
  platform: string;
  allowed: boolean;
  statusCode: number;
  directiveFound?: string;
}

export interface SeoDetails {
  score: number; // 0 - 100
  geoScore: number; // 0 - 100 (AI search readiness)
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
    spaBlankRisk: boolean; // rawWords < 50 while rendered > 300
    detail: string;
  };
  aiCrawlerAccess: AiCrawlerAudit[];
}

// -------------------------------------------------------------
// ENGINE 06: ADVANCED SECURITY & SECRETS
// -------------------------------------------------------------
export interface SecurityAdvancedDetails {
  mixedContentDetected: boolean;
  mixedContentUrls: string[];
  detectedTrackers: { name: string; domain: string; category: string }[];
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

// -------------------------------------------------------------
// ENGINE 07: THREAT INTELLIGENCE & CVEs
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// ENGINE 08: VERIFIED VULNERABILITY AUDIT (MODE B)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// ENGINE 09 & 4: HACK RISK & EXPLOITABILITY INTELLIGENCE
// -------------------------------------------------------------
export interface HackRiskDetails {
  exposureScore: number; // 0 - 100 (0 = low exposure, 100 = critical exposure)
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

// -------------------------------------------------------------
// ENGINE 5: INFRASTRUCTURE RESILIENCE & LOAD CAPACITY (MODE C)
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// DOMAIN VERIFICATION MODEL
// -------------------------------------------------------------
export interface DomainVerificationInfo {
  domain: string;
  token: string;
  isVerified: boolean;
  verifiedAt?: string;
  method: 'dns_txt' | 'meta_tag';
  txtRecordExpected: string;
  metaTagExpected: string;
}

// -------------------------------------------------------------
// FULL SCAN RESULT (ENTERPRISE AUDIT V2)
// -------------------------------------------------------------
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

  // Multi-Pillar Engine Metrics
  multiPillar?: MultiPillarScores;
  dns?: DnsRecordInfo;
  tls?: TlsCertificateInfo;
  redirects?: RedirectAnalysis;
  headers?: SecurityHeadersAnalysis;
  cookies?: CookieAnalysisItem[];
  passiveExposure?: PassiveExposureInfo;

  // New Audit Engines
  crawl?: CrawlSummary;
  performance?: PerformanceDetails;
  accessibility?: AccessibilityDetails;
  seo?: SeoDetails;
  securityAdvanced?: SecurityAdvancedDetails;
  threatIntel?: ThreatIntelligenceDetails;
  verifiedAudit?: VerifiedAuditDetails;
  hackRisk?: HackRiskDetails;
  loadCapacity?: LoadCapacityDetails;

  // Unified Evaluated Findings & Scores
  findings: ScanFinding[];
  score: PostureScore;

  // Metadata
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

// Zod validation schemas for API
export const CreateScanSchema = z.object({
  url: z
    .string({ required_error: 'URL is required' })
    .min(3, 'URL must be at least 3 characters')
    .max(2048, 'URL must not exceed 2048 characters')
    .refine(
      (val) => {
        try {
          const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
          const parsed = new URL(withProto);
          const host = parsed.hostname;
          return (
            ['http:', 'https:'].includes(parsed.protocol) &&
            host.length > 0 &&
            (host.includes('.') || host === 'localhost') &&
            !host.includes(' ')
          );
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL format. Must be a valid domain or web address (e.g. example.com).' }
    ),
  mode: z.enum(['public', 'verified_deep', 'infrastructure_load']).default('public'),
  maxPages: z.number().min(1).max(100).optional().default(15),
  loadTestVUs: z.number().min(1).max(50).optional().default(10),
  allowPrivateNetwork: z.boolean().optional().default(false),
  userAgent: z.string().optional(),
});

export type CreateScanInput = z.infer<typeof CreateScanSchema>;

export const VerifyDomainSchema = z.object({
  domain: z.string().min(3),
  method: z.enum(['dns_txt', 'meta_tag']).default('dns_txt'),
});

export type VerifyDomainInput = z.infer<typeof VerifyDomainSchema>;

export const ScanFilterSchema = z.object({
  query: z.string().optional(),
  mode: z.enum(['public', 'verified_deep', 'infrastructure_load']).optional(),
  status: z.enum([
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
  grade: z.enum(['A+', 'A', 'B', 'C', 'D', 'F']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['startedAt', 'overallScore']).default('startedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ScanFilterInput = z.infer<typeof ScanFilterSchema>;

// ==========================================
// DEVSPHERE CYBERLAB TYPES & SCHEMAS
// ==========================================

export type CyberLabMode = 'public_preview' | 'verified_sandbox';

export type CyberLabSessionStatus =
  | 'initializing'
  | 'ready'
  | 'simulating'
  | 'fault_testing'
  | 'security_testing'
  | 'destroyed';

export interface VirtualSnapshot {
  url: string;
  title: string;
  description?: string;
  domStructure: {
    title: string;
    metaTags: Record<string, string>;
    headers: Array<{ level: number; text: string }>;
    links: Array<{ text: string; href: string; isExternal: boolean }>;
    forms: Array<{
      action: string;
      method: string;
      inputs: Array<{ name: string; type: string; placeholder?: string }>;
    }>;
    buttons: string[];
    scripts: string[];
    stylesheets: string[];
    images: Array<{ src: string; alt?: string }>;
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
    desktop: { width: number; height: number; layoutShiftScore: number };
    tablet: { width: number; height: number; layoutShiftScore: number };
    mobile: { width: number; height: number; layoutShiftScore: number };
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

export type FaultType =
  | 'db_latency'
  | 'db_connection_refusal'
  | 'cache_service_down'
  | 'upstream_503'
  | 'network_jitter'
  | 'worker_crash_recovery';

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
  category:
    | 'injection_defense'
    | 'xss_defense'
    | 'csrf_protection'
    | 'auth_configuration'
    | 'sensitive_exposure'
    | 'misconfiguration'
    | 'dependency_vuln';
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
  framework?:
    | 'react'
    | 'nextjs'
    | 'vue'
    | 'angular'
    | 'vite'
    | 'express'
    | 'fastify'
    | 'python_fastapi'
    | 'static'
    | 'unknown';
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

// Zod schemas for CyberLab
export const CreateCyberLabSessionSchema = z.object({
  targetUrl: z
    .string({ required_error: 'URL is required' })
    .min(3, 'URL must be at least 3 characters')
    .max(2048, 'URL must not exceed 2048 characters')
    .refine(
      (val) => {
        try {
          const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
          const parsed = new URL(withProto);
          const host = parsed.hostname;
          return (
            ['http:', 'https:'].includes(parsed.protocol) &&
            host.length > 0 &&
            (host.includes('.') || host === 'localhost') &&
            !host.includes(' ')
          );
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL format. Must be a valid domain or web address.' }
    ),
  mode: z.enum(['public_preview', 'verified_sandbox']).default('public_preview'),
  name: z.string().optional(),
  framework: z
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
  repositoryUrl: z.string().url().optional(),
  verifiedDomainToken: z.string().optional(),
});

export type CreateCyberLabSessionInput = z.infer<typeof CreateCyberLabSessionSchema>;

export const SimulateTrafficSchema = z.object({
  vus: z.union([z.literal(10), z.literal(100), z.literal(500), z.literal(1000)]),
  durationSec: z.number().min(5).max(60).default(10),
  targetEndpoint: z.string().default('/'),
  circuitBreakerLatencyMs: z.number().min(200).max(10000).default(3000),
  circuitBreakerErrorRatePercent: z.number().min(5).max(100).default(50),
});

export type SimulateTrafficInput = z.infer<typeof SimulateTrafficSchema>;

export const InjectFaultSchema = z.object({
  faultType: z.enum([
    'db_latency',
    'db_connection_refusal',
    'cache_service_down',
    'upstream_503',
    'network_jitter',
    'worker_crash_recovery',
  ]),
  latencyMs: z.number().min(50).max(10000).optional().default(1500),
  failureRatePercent: z.number().min(1).max(100).optional().default(100),
  durationSec: z.number().min(5).max(60).optional().default(15),
});

export type InjectFaultInput = z.infer<typeof InjectFaultSchema>;

export const RunSecuritySimSchema = z.object({
  categories: z
    .array(
      z.enum([
        'injection_defense',
        'xss_defense',
        'csrf_protection',
        'auth_configuration',
        'sensitive_exposure',
        'misconfiguration',
        'dependency_vuln',
      ])
    )
    .optional(),
});

export type RunSecuritySimInput = z.infer<typeof RunSecuritySimSchema>;

export const GenerateAiRemediationSchema = z.object({
  findingId: z.string(),
  framework: z.string().optional().default('nextjs'),
});

export type GenerateAiRemediationInput = z.infer<typeof GenerateAiRemediationSchema>;

// ==========================================
// DEVSPHERE CYBERLAB V3 AUTONOMOUS ENGINE
// ==========================================

export type CyberLabV3ExecutionState =
  | 'QUEUED'
  | 'VALIDATING'
  | 'CONNECTING'
  | 'BROWSER_STARTING'
  | 'DISCOVERING'
  | 'FUNCTIONAL_TESTING'
  | 'PERFORMANCE_TESTING'
  | 'SECURITY_TESTING'
  | 'CORRELATING_FINDINGS'
  | 'GENERATING_REPORT'
  | 'GENERATING_FIX_PROMPT'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type UrlValidationErrorCode =
  | 'INVALID_URL'
  | 'DOMAIN_NOT_FOUND'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'ACCESS_RESTRICTED'
  | 'CERTIFICATE_ERROR'
  | 'SERVER_ERROR'
  | 'SSRF_BLOCKED'
  | 'REDIRECT_LOOP'
  | 'PARKED_DOMAIN';

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
  type:
    | 'broken_link'
    | 'missing_asset'
    | 'console_error'
    | 'soft_404'
    | 'horizontal_overflow'
    | 'invalid_form'
    | 'missing_title';
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

export const StartCyberLabV3Schema = z.object({
  url: z
    .string({ required_error: 'URL is required' })
    .min(1, 'Please enter a URL')
    .max(2048, 'URL must not exceed 2048 characters'),
  isVerifiedOwner: z.boolean().optional().default(false),
  sandboxScope: z.string().optional(),
});

export type StartCyberLabV3Input = z.infer<typeof StartCyberLabV3Schema>;

// ==========================================
// AUTO-FIX VERIFICATION ENGINE V1 TYPES
// ==========================================

export type VerificationFindingStatus =
  | 'VERIFIED_FIXED'
  | 'STILL_PRESENT'
  | 'REGRESSION'
  | 'IMPROVED'
  | 'INCONCLUSIVE'
  | 'NOT_RETESTED'
  | 'NO_LONGER_APPLICABLE';

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
  overallVerdict:
    | 'PASS_CLEAN'
    | 'PASS_IMPROVED'
    | 'REGRESSIONS_DETECTED'
    | 'PARTIAL_FIX'
    | 'NO_CHANGE';
  scoreDelta: number;
}

export interface VerificationSession {
  id: string;
  targetUrl: string;
  baselineRunId: string;
  baselineRun: CyberLabV3Run;
  latestRunId?: string;
  latestRun?: CyberLabV3Run;
  status:
    | 'baseline_captured'
    | 'awaiting_deployment'
    | 'verifying'
    | 'completed'
    | 'failed';
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

export const CreateVerificationSessionSchema = z.object({
  runId: z.string({ required_error: 'Baseline CyberLab run ID is required' }),
});

export type CreateVerificationSessionInput = z.infer<typeof CreateVerificationSessionSchema>;

export const TriggerVerificationSchema = z.object({
  notes: z.string().optional(),
  commitSha: z.string().optional(),
});

export type TriggerVerificationInput = z.infer<typeof TriggerVerificationSchema>;

export const DeploymentWebhookSchema = z.object({
  targetUrl: z.string(),
  provider: z.enum(['github', 'vercel', 'netlify', 'custom']).default('custom'),
  commitSha: z.string().optional(),
  deploymentId: z.string().optional(),
  autoVerify: z.boolean().default(true),
});

export type DeploymentWebhookInput = z.infer<typeof DeploymentWebhookSchema>;
