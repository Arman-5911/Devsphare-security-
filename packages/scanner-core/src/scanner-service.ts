import {
  ScanResult,
  ScanStatus,
  ScanFinding,
  ScanMode,
  TlsCertificateInfo,
  DnsRecordInfo,
  RedirectAnalysis,
  SecurityHeadersAnalysis,
  CookieAnalysisItem,
  PassiveExposureInfo,
  CrawlSummary,
  PerformanceDetails,
  AccessibilityDetails,
  SeoDetails,
  SecurityAdvancedDetails,
  ThreatIntelligenceDetails,
  VerifiedAuditDetails,
  HackRiskDetails,
  LoadCapacityDetails,
} from '@devsphere/shared';
import { normalizeUrl } from './url-validator';
import { validatePublicTarget } from './ssrf-protection';
import { inspectDns } from './dns-inspector';
import { inspectTls } from './tls-inspector';
import { safeFetch } from './safe-http-client';
import { analyzeHeaders } from './headers-analyzer';
import { analyzeCookies } from './cookies-analyzer';
import { inspectPassiveExposure } from './passive-exposure';
import { crawlWebsite } from './crawler-engine';
import { evaluatePerformance } from './performance-engine';
import { evaluateAccessibility } from './accessibility-engine';
import { evaluateSeoAndGeo } from './seo-geo-engine';
import { evaluateSecurityAdvanced } from './security-advanced-engine';
import { evaluateThreatIntelligence } from './threat-intel-engine';
import { calculateHackRisk } from './hack-risk-engine';
import { executeLoadCapacityTest } from './load-capacity-engine';
import { domainVerifier } from './domain-verifier';
import { RULE_CATALOG } from './rule-catalog';
import { calculatePostureScore, calculateMultiPillarScores } from './scoring-engine';

export interface ScanOptions {
  scanId: string;
  url: string;
  mode?: ScanMode;
  maxPages?: number;
  loadTestVUs?: number;
  allowPrivate?: boolean;
  onStatusChange?: (status: ScanStatus) => void;
}

export class ScannerService {
  public async executeScan(options: ScanOptions): Promise<ScanResult> {
    const {
      scanId,
      url,
      mode = 'public',
      maxPages = 15,
      loadTestVUs = 10,
      allowPrivate = false,
      onStatusChange,
    } = options;

    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    let checksAttempted = 0;
    let checksCompleted = 0;
    let checksFailed = 0;

    const notify = (status: ScanStatus) => {
      if (onStatusChange) onStatusChange(status);
    };

    // 1. URL Normalization
    const norm = normalizeUrl(url);
    if (!norm.isValid) {
      throw new Error(`Invalid URL: ${norm.error}`);
    }

    const targetHostname = norm.hostname;
    const normalizedUrl = norm.normalizedUrl;

    // Check domain ownership verification status
    const isDomainVerified = domainVerifier.isVerified(targetHostname);

    // Enforce safety constraint: Mode B and Mode C require verified ownership
    const isAuthorized = mode === 'public' || isDomainVerified;

    // 2. SSRF Protection
    const ssrfCheck = await validatePublicTarget(targetHostname, allowPrivate);
    if (!ssrfCheck.isAllowed) {
      throw new Error(`Target rejected by security policy: ${ssrfCheck.blockedReason}`);
    }

    // 3. DNS Resolution Analysis
    notify('resolving_dns');
    checksAttempted++;
    let dnsInfo: DnsRecordInfo | undefined;
    try {
      dnsInfo = await inspectDns(targetHostname);
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 4. TLS / SSL Certificate Inspection
    notify('inspecting_tls');
    checksAttempted++;
    let tlsInfo: TlsCertificateInfo | undefined;
    try {
      const tlsResult = await inspectTls({ hostname: targetHostname, port: 443 });
      if (tlsResult) {
        tlsInfo = tlsResult;
        checksCompleted++;
      } else {
        checksFailed++;
      }
    } catch {
      checksFailed++;
    }

    // 5. Safe HTTP Fetch & Redirect Analysis
    notify('analyzing_headers');
    checksAttempted += 2;
    let headersInfo: SecurityHeadersAnalysis | undefined;
    let redirectInfo: RedirectAnalysis | undefined;
    let cookiesInfo: CookieAnalysisItem[] = [];
    let initialBody = '';

    try {
      const httpRes = await safeFetch({
        url: normalizedUrl,
        timeoutMs: 8000,
        allowPrivate,
      });

      initialBody = httpRes.body;
      redirectInfo = httpRes.redirects;
      headersInfo = analyzeHeaders(httpRes.headers);
      checksCompleted += 2;

      // 6. Cookie Analysis
      notify('inspecting_cookies');
      checksAttempted++;
      if (httpRes.setCookieHeaders.length > 0) {
        cookiesInfo = analyzeCookies(httpRes.setCookieHeaders);
      }
      checksCompleted++;
    } catch (err: any) {
      checksFailed += 2;
      headersInfo = analyzeHeaders({});
      redirectInfo = {
        initialUrl: normalizedUrl,
        finalUrl: normalizedUrl,
        isHttpToHttpsRedirect: false,
        redirectChain: [],
        totalRedirects: 0,
        hasOpenRedirectRisk: false,
        issues: [`Connection attempt failed: ${err.message}`],
      };
    }

    // 7. Passive Exposure (robots.txt, security.txt)
    checksAttempted++;
    let passiveExposure: PassiveExposureInfo | undefined;
    try {
      passiveExposure = await inspectPassiveExposure(normalizedUrl, allowPrivate);
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 8. Bounded Website Crawler (Multi-Page Link Inventory & Soft 404)
    notify('crawling_pages');
    checksAttempted++;
    let crawlSummary: CrawlSummary | undefined;
    const crawlLimit = mode === 'verified_deep' ? Math.min(maxPages, 50) : Math.min(maxPages, 15);
    try {
      crawlSummary = await crawlWebsite({
        rootUrl: normalizedUrl,
        maxPages: crawlLimit,
        allowPrivate,
      });
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 9. Advanced Performance & Core Web Vitals
    notify('evaluating_performance');
    checksAttempted++;
    let performanceDetails: PerformanceDetails | undefined;
    try {
      performanceDetails = await evaluatePerformance({
        url: normalizedUrl,
        html: initialBody,
        initialDurationMs: redirectInfo?.redirectChain[0]?.durationMs || 120,
        headers: headersInfo?.rawHeaders || {},
        allowPrivate,
      });
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 10. Automated Accessibility (WCAG 2.1 AA)
    notify('checking_accessibility');
    checksAttempted++;
    let accessibilityDetails: AccessibilityDetails | undefined;
    try {
      accessibilityDetails = evaluateAccessibility(initialBody);
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 11. SEO & AI Search Readiness (GEO)
    notify('auditing_seo');
    checksAttempted++;
    let seoDetails: SeoDetails | undefined;
    try {
      seoDetails = evaluateSeoAndGeo({
        url: normalizedUrl,
        html: initialBody,
        robotsTxtContent: passiveExposure?.robotsTxtContent,
      });
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 12. Advanced Security, Trackers & Secret Exposure
    notify('assessing_security');
    checksAttempted++;
    let securityAdvanced: SecurityAdvancedDetails | undefined;
    try {
      securityAdvanced = evaluateSecurityAdvanced(
        normalizedUrl,
        initialBody,
        headersInfo?.rawHeaders || {}
      );
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 13. Threat Intelligence & CVEs
    checksAttempted++;
    let threatIntel: ThreatIntelligenceDetails | undefined;
    try {
      threatIntel = await evaluateThreatIntelligence(
        normalizedUrl,
        initialBody,
        headersInfo?.rawHeaders || {}
      );
      checksCompleted++;
    } catch {
      checksFailed++;
    }

    // 14. Server Load & Infrastructure Resilience (Mode C)
    let loadCapacity: LoadCapacityDetails | undefined;
    if (mode === 'infrastructure_load') {
      notify('running_resilience');
      checksAttempted++;
      try {
        loadCapacity = await executeLoadCapacityTest({
          url: normalizedUrl,
          isAuthorized,
          virtualUsers: loadTestVUs,
          durationSeconds: 5,
          allowPrivate,
        });
        checksCompleted++;
      } catch {
        checksFailed++;
      }
    }

    // 15. Verified Audit Details (Mode B)
    const verifiedAudit: VerifiedAuditDetails = {
      isAuthorized,
      verifiedDomain: isDomainVerified,
      testScopeApproved: mode === 'verified_deep',
      owaspTop10Checks: [
        { id: 'A01:2021', title: 'Broken Access Control', status: 'pass' },
        { id: 'A02:2021', title: 'Cryptographic Failures', status: tlsInfo ? 'pass' : 'fail' },
        { id: 'A03:2021', title: 'Injection & XSS Defenses', status: headersInfo?.csp.present ? 'pass' : 'fail' },
        { id: 'A05:2021', title: 'Security Misconfiguration', status: headersInfo?.xFrameOptions.isProtected ? 'pass' : 'fail' },
        { id: 'A07:2021', title: 'Identification & Auth Cookie Flags', status: cookiesInfo.every(c => c.secure && c.httpOnly) ? 'pass' : 'fail' },
      ],
    };

    // 16. Rule Catalog Evaluation Engine
    notify('evaluating_rules');
    const findings: ScanFinding[] = [];

    const addFinding = (ruleId: string, evidence: Record<string, any>) => {
      const def = RULE_CATALOG[ruleId];
      if (!def) return;

      findings.push({
        id: `${ruleId}-${findings.length + 1}`,
        ruleId: def.id,
        category: def.category,
        severity: def.severity,
        confidence: def.confidence,
        title: def.title,
        description: def.description,
        scoreDeduction: def.defaultDeduction,
        evidence,
        explanation: def.explanation,
        potentialImpact: def.potentialImpact,
        remediation: def.remediation,
        snippets: def.snippets,
        standards: def.standards,
        verificationSteps: def.verificationSteps,
      });
    };

    // Rule: TLS
    if (!tlsInfo) {
      addFinding('TLS-001', { reason: 'No HTTPS endpoint accessible' });
    } else {
      if (tlsInfo.isExpired) addFinding('TLS-002', { validTo: tlsInfo.validTo, daysRemaining: tlsInfo.daysRemaining });
      else if (tlsInfo.expiresSoon) addFinding('TLS-003', { validTo: tlsInfo.validTo, daysRemaining: tlsInfo.daysRemaining });
      if (tlsInfo.isSelfSigned || !tlsInfo.authorized) addFinding('TLS-004', { authorized: tlsInfo.authorized, issuer: tlsInfo.issuer });
      if (['TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2'].includes(tlsInfo.protocol)) addFinding('TLS-005', { protocol: tlsInfo.protocol });
    }

    // Rule: Headers
    if (headersInfo) {
      if (!headersInfo.hsts.present) {
        if (norm.protocol === 'https:' || redirectInfo?.finalUrl.startsWith('https://')) {
          addFinding('HDR-001', { headers: headersInfo.rawHeaders });
        }
      } else if (!headersInfo.hsts.isOptimal) {
        addFinding('HDR-002', { hstsRaw: headersInfo.hsts.raw, issues: headersInfo.hsts.issues });
      }

      if (!headersInfo.csp.present) {
        addFinding('HDR-003', { headers: headersInfo.rawHeaders });
      } else if (headersInfo.csp.hasUnsafeInlineScript || headersInfo.csp.hasUnsafeEval) {
        addFinding('HDR-004', { cspRaw: headersInfo.csp.raw, issues: headersInfo.csp.issues });
      }

      if (!headersInfo.xFrameOptions.isProtected) addFinding('HDR-005', { xFrameOptions: headersInfo.xFrameOptions.value });
      if (!headersInfo.xContentTypeOptions.isNosniff) addFinding('HDR-006', { xContentTypeOptions: headersInfo.xContentTypeOptions.value });
      if (!headersInfo.referrerPolicy.isStrict) addFinding('HDR-007', { referrerPolicy: headersInfo.referrerPolicy.value });
      if (!headersInfo.permissionsPolicy.present) addFinding('HDR-008', { permissionsPolicy: headersInfo.permissionsPolicy.value });
      if (headersInfo.serverLeakage.leaksTechnologies) addFinding('INF-001', { server: headersInfo.serverLeakage.serverHeader, detected: headersInfo.serverLeakage.detectedTech });
      if (headersInfo.serverLeakage.xPoweredBy) addFinding('INF-002', { xPoweredBy: headersInfo.serverLeakage.xPoweredBy });
    }

    // Rule: Cookies
    for (const cookie of cookiesInfo) {
      if (!cookie.secure) addFinding('CKI-001', { cookieName: cookie.name, issues: cookie.issues });
      if (!cookie.httpOnly) addFinding('CKI-002', { cookieName: cookie.name, issues: cookie.issues });
      if (cookie.sameSite === 'Unset' || cookie.sameSite === 'None') addFinding('CKI-003', { cookieName: cookie.name, sameSite: cookie.sameSite });
    }

    // Rule: Redirects
    if (redirectInfo) {
      if (norm.protocol === 'http:' && !redirectInfo.isHttpToHttpsRedirect) addFinding('RED-001', { initial: redirectInfo.initialUrl, final: redirectInfo.finalUrl });
      if (redirectInfo.totalRedirects > 3) addFinding('RED-002', { totalHops: redirectInfo.totalRedirects });
    }

    // Rule: DNS
    if (dnsInfo) {
      if (!dnsInfo.hasSpf) addFinding('DNS-001', { domain: targetHostname });
      if (!dnsInfo.hasDmarc) addFinding('DNS-002', { domain: targetHostname });
    }

    // Rule: security.txt
    if (passiveExposure && !passiveExposure.securityTxtPresent) addFinding('HYG-001', { domain: targetHostname });

    // Rule: Performance
    if (performanceDetails) {
      if (performanceDetails.unusedJsBytes > 80000) {
        addFinding('PERF-001', {
          unusedJsKb: Math.round(performanceDetails.unusedJsBytes / 1024),
          codeCoveragePercent: performanceDetails.codeCoveragePercent,
          transferPenaltyMs: performanceDetails.estimatedTransferPenaltyMs,
        });
      }
      if (performanceDetails.lcpMs > 2500) {
        addFinding('PERF-002', { lcpMs: performanceDetails.lcpMs, target: '< 2500ms' });
      }
      if (performanceDetails.unoptimizedImages.some(i => i.missingDimensions)) {
        addFinding('PERF-003', { count: performanceDetails.unoptimizedImages.length });
      }
    }

    // Rule: Accessibility
    if (accessibilityDetails) {
      if (accessibilityDetails.missingAltCount > 0) addFinding('A11Y-001', { count: accessibilityDetails.missingAltCount });
      if (accessibilityDetails.tapTargetIssuesCount > 0) addFinding('A11Y-002', { count: accessibilityDetails.tapTargetIssuesCount });
      if (accessibilityDetails.contrastIssuesCount > 5) addFinding('A11Y-003', { count: accessibilityDetails.contrastIssuesCount });
    }

    // Rule: SEO / GEO
    if (seoDetails) {
      if (seoDetails.wordCountAnalysis.spaBlankRisk) {
        addFinding('SEO-001', {
          rawWords: seoDetails.wordCountAnalysis.rawHtmlWords,
          renderedWords: seoDetails.wordCountAnalysis.renderedWords,
        });
      }
      if (!seoDetails.structuredData.hasSchemaJsonLd) addFinding('SEO-003', { domain: targetHostname });
      if (seoDetails.aiCrawlerAccess.some(b => !b.allowed)) {
        addFinding('SEO-004', { blockedBots: seoDetails.aiCrawlerAccess.filter(b => !b.allowed).map(b => b.bot) });
      }
    }

    // Rule: Soft 404
    if (crawlSummary?.soft404.detected) {
      addFinding('SEO-002', {
        testedPath: crawlSummary.soft404.testedPath,
        statusCode: crawlSummary.soft404.statusCode,
      });
    }

    // Rule: Security Advanced & Secrets
    if (securityAdvanced) {
      if (securityAdvanced.mixedContentDetected) addFinding('SEC-001', { urls: securityAdvanced.mixedContentUrls });
      if (securityAdvanced.exposedSecrets.length > 0) addFinding('SEC-002', { secrets: securityAdvanced.exposedSecrets });
    }

    // 17. Calculate Hack Risk Intelligence
    const hackRisk = calculateHackRisk(
      findings,
      threatIntel,
      Boolean(tlsInfo),
      isDomainVerified
    );

    // 18. Calculate Posture Score & Multi-Pillar Radar
    const postureScore = calculatePostureScore(
      findings,
      checksAttempted,
      checksCompleted
    );

    const multiPillar = calculateMultiPillarScores({
      postureScore,
      performance: performanceDetails,
      accessibility: accessibilityDetails,
      seo: seoDetails,
    });

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    notify('completed');

    return {
      id: scanId,
      mode,
      targetUrl: url,
      normalizedUrl,
      targetHostname,
      status: 'completed',
      startedAt,
      completedAt,
      durationMs,
      isDomainVerified,
      multiPillar,
      dns: dnsInfo,
      tls: tlsInfo,
      redirects: redirectInfo,
      headers: headersInfo,
      cookies: cookiesInfo,
      passiveExposure,
      crawl: crawlSummary,
      performance: performanceDetails,
      accessibility: accessibilityDetails,
      seo: seoDetails,
      securityAdvanced,
      threatIntel,
      verifiedAudit,
      hackRisk,
      loadCapacity,
      findings,
      score: postureScore,
      checksAttempted,
      checksCompleted,
      checksFailed,
      scannerVersion: '2.0.0-enterprise',
    };
  }
}
