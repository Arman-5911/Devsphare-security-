import {
  ScanFinding,
  UrlPreflightValidationResult,
  FunctionalTestSummary,
  DiscoveredPage,
} from '@devsphere/shared';

export interface GenerateFixPromptOptions {
  targetUrl: string;
  framework?: string;
  preflight: UrlPreflightValidationResult;
  findings: ScanFinding[];
  functional: FunctionalTestSummary;
  discoveredPages: DiscoveredPage[];
  performanceMetrics: {
    fcpMs: number;
    lcpMs: number;
    clsScore: number;
    ttfbMs: number;
  };
}

/**
 * Generates an Enterprise-Grade AI Coding-Agent Master Fix Prompt
 * formatted in Markdown for direct use in Cursor, Claude, GPT, Antigravity, or Copilot.
 */
export function generateAiFixMasterPrompt(options: GenerateFixPromptOptions): string {
  const {
    targetUrl,
    framework = 'Detected Web Stack',
    preflight,
    findings,
    functional,
    discoveredPages,
    performanceMetrics,
  } = options;

  const criticalFindings = findings.filter((f) => f.severity === 'critical');
  const highFindings = findings.filter((f) => f.severity === 'high');
  const mediumFindings = findings.filter((f) => f.severity === 'medium');
  const lowFindings = findings.filter((f) => f.severity === 'low' || f.severity === 'info');

  const nowIso = new Date().toISOString();

  return `# DEVSPHERE CYBERLAB V3 — AI WEBSITE REPAIR MASTER PROMPT
> **Target Website:** \`${targetUrl}\`  
> **Host:** \`${preflight.hostname}\` (IP: \`${preflight.ipAddress || 'Dynamic/CDN'}\`)  
> **Framework / Runtime:** \`${framework}\`  
> **Generated Timestamp:** \`${nowIso}\`  
> **Scan Status:** \`${preflight.statusCode || 200} OK (TLS Valid: ${preflight.tlsValid ? 'Yes' : 'No'})\`  

---

## 0. MANDATORY INSTRUCTIONS FOR THE AI CODING AGENT
You are acting as an elite Principal Software & Application Security Engineer.
Your task is to fix the **CONFIRMED defects, security misconfigurations, and performance bottlenecks** discovered by DevSphere CyberLab V3 on \`${targetUrl}\`.

Follow these non-negotiable rules:
1. **Inspect Existing Code First:** Thoroughly examine the repository architecture, config files, router patterns, and dependencies before modifying any code.
2. **Preserve All Working Features:** Do NOT rewrite unrelated code or replace working UI components. Deliver minimal, high-precision surgical fixes.
3. **Evidence-Driven Remediation:** Every code change must directly resolve a verified finding documented in Section 2 below.
4. **No Placeholders or Mocks in Production:** Write real, fully implemented code and configurations.
5. **Add Regression Tests:** Write automated unit or integration tests (e.g. Jest, Vitest, Playwright) that reproduce the failure and assert the fix.
6. **Local Verification:** Run the development server locally and verify that the target endpoints respond cleanly without regression.

---

## 1. EXECUTIVE SCAN SUMMARY & METRICS
* **Total Discovered Pages:** ${discoveredPages.length}
* **Functional Broken Links:** ${functional.brokenLinksCount}
* **Console Errors:** ${functional.consoleErrorsCount}
* **Core Web Vitals:**
  * **TTFB:** ${performanceMetrics.ttfbMs} ms
  * **First Contentful Paint (FCP):** ${(performanceMetrics.fcpMs / 1000).toFixed(2)} s
  * **Largest Contentful Paint (LCP):** ${(performanceMetrics.lcpMs / 1000).toFixed(2)} s
  * **Cumulative Layout Shift (CLS):** ${performanceMetrics.clsScore.toFixed(3)}
* **Security & Resilience Findings:**
  * **Critical:** ${criticalFindings.length}
  * **High:** ${highFindings.length}
  * **Medium:** ${mediumFindings.length}
  * **Low / Info:** ${lowFindings.length}

---

## 2. PRIORITIZED DEFECTS & TECHNICAL EVIDENCE

${
  findings.length === 0
    ? 'No severe defects detected. The website demonstrates strong baseline resilience.'
    : findings
        .map(
          (f, idx) => `### Finding #${idx + 1}: [${f.severity.toUpperCase()}] ${f.title}
* **ID:** \`${f.id}\`
* **Category:** \`${f.category}\` (Confidence: \`${f.confidence}\`)
* **Affected Area:** \`${f.ruleId}\`
* **Observed Defect / Behavior:**
  ${f.description}
* **Technical Evidence:**
\`\`\`json
${JSON.stringify(f.evidence, null, 2)}
\`\`\`
* **Likely Root Cause:**
  ${f.explanation}
* **Potential Impact:**
  ${f.potentialImpact}
* **Recommended Remediation:**
  ${f.remediation}
${
  f.snippets && f.snippets.length > 0
    ? `* **Reference Code Snippet (${f.snippets[0].server || f.snippets[0].language}):**
\`\`\`${f.snippets[0].language || 'text'}
${f.snippets[0].code}
\`\`\``
    : ''
}
* **Verification Steps:**
${f.verificationSteps.map((step) => `  - ${step}`).join('\n')}
`
        )
        .join('\n---\n\n')
}

---

## 3. FUNCTIONAL & ASSET DEFECTS

${
  functional.issues.length === 0
    ? 'Zero broken links or asset load failures observed across tested pages.'
    : functional.issues
        .map(
          (iss, i) => `* **Issue #${i + 1} [${iss.type}]:** \`${iss.url}\`
  - Message: ${iss.message}
  - Details: ${JSON.stringify(iss.evidence)}`
        )
        .join('\n')
}

---

## 4. ACTIONABLE REMEDIATION PLAN FOR THE DEVELOPER

1. **Phase 1 — Critical Security Hardening:**
   - Configure modern HTTP security headers (\`Content-Security-Policy\` with nonces, \`Strict-Transport-Security\`, \`X-Content-Type-Options: nosniff\`, \`X-Frame-Options: DENY\`).
   - Audit session cookies: enforce \`SameSite=Lax\` (or \`Strict\`), \`HttpOnly\`, and \`Secure\`.
   - Ensure parameterized SQL queries across all database access layers.

2. **Phase 2 — Functional Link & Route Repair:**
   - Fix all 404 broken routes identified above. Replace dead internal links with canonical destinations.
   - Verify all static asset paths (images, fonts, scripts) resolve with valid MIME types.

3. **Phase 3 — Performance & Core Web Vitals Optimization:**
   - Preload critical fonts and hero images to reduce LCP.
   - Add explicit \`width\` and \`height\` dimensions to layout containers and images to eliminate Cumulative Layout Shift (CLS).
   - Defer non-critical third-party analytics scripts to minimize main-thread execution time.

4. **Phase 4 — Automated Verification:**
   - Execute test suite locally: \`npm test\`
   - Re-scan with DevSphere CyberLab V3 to confirm 100% remediation score.

---
*DevSphere CyberLab V3 Autonomous Engine • Evidence-Grounded AI Prompt*
`;
}
