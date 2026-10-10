import {
  CyberLabV3Run,
  ScanFinding,
  VerificationSession,
  FindingComparisonItem,
  PerformanceComparisonSummary,
  PerformanceMetricDiff,
  FunctionalRegressionItem,
  VerificationSessionSummary,
} from '@devsphere/shared';

export interface RunComparisonResult {
  summary: VerificationSessionSummary;
  findingComparisons: FindingComparisonItem[];
  performanceComparison: PerformanceComparisonSummary;
  functionalRegressions: FunctionalRegressionItem[];
  updatedAiFixPrompt: string;
}

/**
 * DevSphere Auto-Fix Verification Engine V1
 * Deterministic finding matching, regression detection, performance comparison,
 * and updated AI remediation prompt generation.
 */
export class AutoFixVerificationEngine {
  /**
   * Compares an immutable Baseline CyberLab run with a newly executed re-scan run.
   */
  compareRuns(baselineRun: CyberLabV3Run, latestRun: CyberLabV3Run): RunComparisonResult {
    // 1. Finding Matching & Status Classification
    const findingComparisons: FindingComparisonItem[] = [];
    const baselineFindings = baselineRun.findings || [];
    const latestFindings = latestRun.findings || [];

    // Helper to generate a fingerprint for matching
    const getFingerprint = (f: ScanFinding): string => {
      const headerKey = f.evidence?.header ? `_hdr_${f.evidence.header}` : '';
      const pathKey = f.evidence?.path ? `_path_${f.evidence.path}` : '';
      return `${f.ruleId || f.id}_${f.category}${headerKey}${pathKey}`.toLowerCase();
    };

    const latestMatchedSet = new Set<string>();

    // Process all baseline findings
    for (const bFinding of baselineFindings) {
      const bFp = getFingerprint(bFinding);
      const matchedLatest = latestFindings.find(
        (lF) => getFingerprint(lF) === bFp || lF.ruleId === bFinding.ruleId || (lF.title === bFinding.title && lF.category === bFinding.category)
      );

      if (matchedLatest) {
        latestMatchedSet.add(getFingerprint(matchedLatest));

        // Check if severity or impact improved
        if (matchedLatest.scoreDeduction < bFinding.scoreDeduction) {
          findingComparisons.push({
            findingId: bFinding.id,
            ruleId: bFinding.ruleId,
            title: bFinding.title,
            category: bFinding.category,
            severity: matchedLatest.severity,
            status: 'IMPROVED',
            statusReason: `Issue impact improved: score deduction reduced from -${bFinding.scoreDeduction} to -${matchedLatest.scoreDeduction}.`,
            baselineEvidence: bFinding.evidence,
            latestEvidence: matchedLatest.evidence,
            explanation: matchedLatest.explanation,
            remediation: matchedLatest.remediation,
          });
        } else {
          findingComparisons.push({
            findingId: bFinding.id,
            ruleId: bFinding.ruleId,
            title: bFinding.title,
            category: bFinding.category,
            severity: matchedLatest.severity,
            status: 'STILL_PRESENT',
            statusReason: 'Issue remains reproducible in re-scan verification under matching test conditions.',
            baselineEvidence: bFinding.evidence,
            latestEvidence: matchedLatest.evidence,
            explanation: matchedLatest.explanation,
            remediation: matchedLatest.remediation,
          });
        }
      } else {
        // Finding disappeared in re-scan -> Verified Fixed!
        findingComparisons.push({
          findingId: bFinding.id,
          ruleId: bFinding.ruleId,
          title: bFinding.title,
          category: bFinding.category,
          severity: bFinding.severity,
          status: 'VERIFIED_FIXED',
          statusReason: 'Verified resolved in re-scan. Check executed successfully and finding was no longer detected.',
          baselineEvidence: bFinding.evidence,
          latestEvidence: { status: 'CLEAN', checkedAt: latestRun.startedAt },
          explanation: bFinding.explanation,
          remediation: bFinding.remediation,
        });
      }
    }

    // Process newly introduced findings (Regressions)
    for (const lFinding of latestFindings) {
      const lFp = getFingerprint(lFinding);
      if (!latestMatchedSet.has(lFp)) {
        const isBaselinePresent = baselineFindings.some(
          (bF) => getFingerprint(bF) === lFp || bF.ruleId === lFinding.ruleId || (bF.title === lFinding.title && bF.category === lFinding.category)
        );

        if (!isBaselinePresent) {
          findingComparisons.push({
            findingId: lFinding.id,
            ruleId: lFinding.ruleId,
            title: lFinding.title,
            category: lFinding.category,
            severity: lFinding.severity,
            status: 'REGRESSION',
            statusReason: 'NEW REGRESSION: Defect was not present in baseline scan and was introduced in this deployment.',
            latestEvidence: lFinding.evidence,
            explanation: lFinding.explanation,
            remediation: lFinding.remediation,
          });
        }
      }
    }

    // 2. Functional Regression Detection
    const functionalRegressions: FunctionalRegressionItem[] = [];
    const baselinePages = baselineRun.discoveredPages || [];
    const latestPages = latestRun.discoveredPages || [];

    // Check for newly broken routes (which worked in baseline)
    for (const lPage of latestPages) {
      if (lPage.isBroken || lPage.statusCode >= 400) {
        const bMatch = baselinePages.find((bp) => bp.path === lPage.path);
        if (bMatch && !bMatch.isBroken && bMatch.statusCode < 400) {
          functionalRegressions.push({
            id: `REG_ROUTE_${Math.random().toString(36).substring(7)}`,
            type: 'broken_link',
            url: lPage.url,
            message: `Route regression: "${lPage.path}" returned HTTP ${lPage.statusCode} in latest scan (previously HTTP ${bMatch.statusCode} in baseline).`,
            evidence: { previousStatus: bMatch.statusCode, currentStatus: lPage.statusCode, path: lPage.path },
          });
        }
      }
    }

    // Check for newly introduced console errors or functional issues
    const baselineIssues = baselineRun.functional?.issues || [];
    const latestIssues = latestRun.functional?.issues || [];
    for (const lIssue of latestIssues) {
      const existsInBaseline = baselineIssues.some((bi) => bi.url === lIssue.url && bi.type === lIssue.type);
      if (!existsInBaseline) {
        functionalRegressions.push({
          id: `REG_FUNC_${Math.random().toString(36).substring(7)}`,
          type: lIssue.type as any,
          url: lIssue.url,
          message: `Functional regression: ${lIssue.message}`,
          evidence: lIssue.evidence,
        });
      }
    }

    // 3. Performance Metrics Comparison
    const bPerf = baselineRun.performanceMetrics || { fcpMs: 0, lcpMs: 0, clsScore: 0, ttfbMs: 0, transferSizeBytes: 0, requestCount: 0 };
    const lPerf = latestRun.performanceMetrics || { fcpMs: 0, lcpMs: 0, clsScore: 0, ttfbMs: 0, transferSizeBytes: 0, requestCount: 0 };

    const computeDiff = (
      metric: string,
      unit: string,
      bVal: number,
      lVal: number,
      lowerIsBetter: boolean = true,
      noiseThreshold: number = 30
    ): PerformanceMetricDiff => {
      const delta = parseFloat((lVal - bVal).toFixed(2));
      const percentageChange = bVal > 0 ? parseFloat((((lVal - bVal) / bVal) * 100).toFixed(1)) : 0;
      const isMeaningful = Math.abs(delta) >= noiseThreshold;

      let verdict: 'improved' | 'regressed' | 'neutral' = 'neutral';
      if (isMeaningful) {
        if (lowerIsBetter) {
          verdict = delta < 0 ? 'improved' : 'regressed';
        } else {
          verdict = delta > 0 ? 'improved' : 'regressed';
        }
      }

      return {
        metric,
        unit,
        baseline: bVal,
        latest: lVal,
        delta,
        percentageChange,
        verdict,
        isMeaningful,
      };
    };

    const performanceComparison: PerformanceComparisonSummary = {
      fcp: computeDiff('First Contentful Paint (FCP)', 'ms', bPerf.fcpMs, lPerf.fcpMs, true, 40),
      lcp: computeDiff('Largest Contentful Paint (LCP)', 'ms', bPerf.lcpMs, lPerf.lcpMs, true, 60),
      cls: computeDiff('Cumulative Layout Shift (CLS)', '', bPerf.clsScore, lPerf.clsScore, true, 0.01),
      ttfb: computeDiff('Time to First Byte (TTFB)', 'ms', bPerf.ttfbMs, lPerf.ttfbMs, true, 25),
      transferSize: computeDiff('Transfer Size', 'bytes', bPerf.transferSizeBytes, lPerf.transferSizeBytes, true, 2048),
      requestCount: computeDiff('Requests', '', bPerf.requestCount, lPerf.requestCount, true, 1),
      overallPerformanceDelta: parseFloat(
        (
          (bPerf.lcpMs - lPerf.lcpMs) / 10 +
          (bPerf.fcpMs - lPerf.fcpMs) / 10 +
          (bPerf.clsScore - lPerf.clsScore) * 100
        ).toFixed(1)
      ),
    };

    // 4. Summaries & Verdicts
    const verifiedFixedCount = findingComparisons.filter((f) => f.status === 'VERIFIED_FIXED').length;
    const stillPresentCount = findingComparisons.filter((f) => f.status === 'STILL_PRESENT').length;
    const regressionsCount = findingComparisons.filter((f) => f.status === 'REGRESSION').length + functionalRegressions.length;
    const improvedCount = findingComparisons.filter((f) => f.status === 'IMPROVED').length;

    let overallVerdict: VerificationSessionSummary['overallVerdict'] = 'NO_CHANGE';
    if (regressionsCount > 0) {
      overallVerdict = 'REGRESSIONS_DETECTED';
    } else if (verifiedFixedCount > 0 && stillPresentCount === 0) {
      overallVerdict = 'PASS_CLEAN';
    } else if (verifiedFixedCount > 0 && stillPresentCount > 0) {
      overallVerdict = 'PASS_IMPROVED';
    } else if (improvedCount > 0 && verifiedFixedCount === 0) {
      overallVerdict = 'PARTIAL_FIX';
    }

    const baselineScore = baselineRun.securityAudit?.headersScore || 70;
    const latestScore = latestRun.securityAudit?.headersScore || 70;
    const scoreDelta = latestScore - baselineScore;

    const summary: VerificationSessionSummary = {
      totalBaselineFindings: baselineFindings.length,
      verifiedFixedCount,
      stillPresentCount,
      regressionsCount,
      improvedCount,
      overallVerdict,
      scoreDelta,
    };

    // 5. Generate Updated AI Remediation Loop Master Prompt
    const updatedAiFixPrompt = this.generateUpdatedFixPrompt({
      targetUrl: latestRun.targetUrl,
      summary,
      findingComparisons,
      functionalRegressions,
      performanceComparison,
      latestRun,
    });

    return {
      summary,
      findingComparisons,
      performanceComparison,
      functionalRegressions,
      updatedAiFixPrompt,
    };
  }

  /**
   * Generates an evidence-grounded Updated AI Website Fix Master Prompt
   * explicitly highlighting verified resolutions, still-present issues, and regressions.
   */
  private generateUpdatedFixPrompt(options: {
    targetUrl: string;
    summary: VerificationSessionSummary;
    findingComparisons: FindingComparisonItem[];
    functionalRegressions: FunctionalRegressionItem[];
    performanceComparison: PerformanceComparisonSummary;
    latestRun: CyberLabV3Run;
  }): string {
    const { targetUrl, summary, findingComparisons, functionalRegressions, performanceComparison, latestRun } = options;

    const fixed = findingComparisons.filter((f) => f.status === 'VERIFIED_FIXED');
    const stillPresent = findingComparisons.filter((f) => f.status === 'STILL_PRESENT');
    const regressions = findingComparisons.filter((f) => f.status === 'REGRESSION');

    const nowIso = new Date().toISOString();

    return `# DEVSPHERE CYBERLAB V3 — AUTO-FIX VERIFICATION REMEDIATION LOOP
> **Target Website:** \`${targetUrl}\`  
> **Verification Run ID:** \`${latestRun.id}\`  
> **Timestamp:** \`${nowIso}\`  
> **Verification Verdict:** \`${summary.overallVerdict}\`  
> **Resolved Issues:** \`${summary.verifiedFixedCount} of ${summary.totalBaselineFindings}\`  
> **New Regressions:** \`${summary.regressionsCount}\`  

---

## 0. DIRECTIVES FOR THE AI CODING AGENT
You are acting as an elite Principal Software & Application Security Engineer in an **Auto-Fix Verification Loop**.
A previous fix was applied and re-tested by DevSphere CyberLab V3.
Your task is to fix the **remaining unresolved defects** and **immediately revert/fix newly introduced regressions** below.

### Rules of Engagement:
1. **Do NOT break verified fixes:** The ${fixed.length} items listed in Section 1 were confirmed fixed. Do NOT re-introduce those vulnerabilities or defects.
2. **Prioritize Regressions First:** If any regressions exist in Section 2, they represent newly broken functionality or security regressions. Resolve them immediately.
3. **Resolve Still-Present Issues:** Surgical fixes for findings that remain open in Section 3.
4. **Preserve All Working Code:** Minimal diffs, no unnecessary refactoring.
5. **Add Automated Regression Tests:** Every fix must be accompanied by an automated test case assertively preventing regressions.

---

## 1. VERIFIED FIXED ISSUES (CONFIRMED RESOLVED)
These issues were successfully fixed in the deployment and verified by DevSphere:
${
  fixed.length === 0
    ? '* None verified fixed yet.'
    : fixed
        .map(
          (f, idx) => `* **[RESOLVED]** Finding #${idx + 1}: \`${f.title}\` (${f.ruleId})
  - Status: ${f.statusReason}`
        )
        .join('\n')
}

---

## 2. NEW REGRESSIONS DETECTED (URGENT HOTFIX REQUIRED)
${
  regressions.length === 0 && functionalRegressions.length === 0
    ? 'Zero regressions detected. Good job maintaining functional stability!'
    : [
        ...regressions.map(
          (r, idx) => `### Regression #${idx + 1}: [${r.severity.toUpperCase()}] ${r.title}
* **Rule ID:** \`${r.ruleId}\` (Category: \`${r.category}\`)
* **Detection:** This defect was NOT present in baseline and was introduced by recent changes.
* **Observed Evidence:**
\`\`\`json
${JSON.stringify(r.latestEvidence, null, 2)}
\`\`\`
* **Recommended Hotfix:** ${r.remediation}`
        ),
        ...functionalRegressions.map(
          (fr, idx) => `### Functional Regression #${idx + 1}: [${fr.type}] ${fr.url}
* **Message:** ${fr.message}
* **Evidence:** ${JSON.stringify(fr.evidence)}`
        ),
      ].join('\n\n')
}

---

## 3. UNRESOLVED ISSUES (STILL PRESENT)
${
  stillPresent.length === 0
    ? 'All original baseline findings have been successfully resolved!'
    : stillPresent
        .map(
          (sp, idx) => `### Unresolved #${idx + 1}: [${sp.severity.toUpperCase()}] ${sp.title}
* **Rule ID:** \`${sp.ruleId}\`
* **Status Reason:** ${sp.statusReason}
* **Latest Evidence:**
\`\`\`json
${JSON.stringify(sp.latestEvidence, null, 2)}
\`\`\`
* **Remediation Guide:**
${sp.remediation}`
        )
        .join('\n\n')
}

---

## 4. PERFORMANCE DELTAS (CORE WEB VITALS)
* **LCP Delta:** ${performanceComparison.lcp.baseline}ms -> ${performanceComparison.lcp.latest}ms (${performanceComparison.lcp.delta > 0 ? '+' : ''}${performanceComparison.lcp.delta}ms, verdict: \`${performanceComparison.lcp.verdict.toUpperCase()}\`)
* **FCP Delta:** ${performanceComparison.fcp.baseline}ms -> ${performanceComparison.fcp.latest}ms (${performanceComparison.fcp.delta > 0 ? '+' : ''}${performanceComparison.fcp.delta}ms)
* **CLS Delta:** ${performanceComparison.cls.baseline} -> ${performanceComparison.cls.latest} (${performanceComparison.cls.delta > 0 ? '+' : ''}${performanceComparison.cls.delta})
* **TTFB Delta:** ${performanceComparison.ttfb.baseline}ms -> ${performanceComparison.ttfb.latest}ms (${performanceComparison.ttfb.delta > 0 ? '+' : ''}${performanceComparison.ttfb.delta}ms)

---

## 5. FINAL ACTION PLAN
1. Inspect the codebase for the causes of the ${regressions.length + functionalRegressions.length} regressions above.
2. Implement surgical corrections for remaining unresolved defects.
3. Run tests locally and redeploy.
4. Re-run DevSphere CyberLab Auto-Fix Verification to achieve \`PASS_CLEAN\`.
`;
  }
}
