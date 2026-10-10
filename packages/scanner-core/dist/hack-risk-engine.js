"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHackRisk = calculateHackRisk;
function calculateHackRisk(findings, threatIntel, hasTls = true, isDomainVerified = false) {
    const criticalCount = findings.filter((f) => f.severity === 'critical').length;
    const highCount = findings.filter((f) => f.severity === 'high').length;
    const mediumCount = findings.filter((f) => f.severity === 'medium').length;
    const knownCves = threatIntel?.knownCves || [];
    const cveCount = knownCves.length;
    // Calculate attack surface score (0 - 100)
    // Higher = more exposed attack surface
    let attackSurfaceScore = 20; // baseline
    if (!hasTls)
        attackSurfaceScore += 35;
    attackSurfaceScore += criticalCount * 25;
    attackSurfaceScore += highCount * 12;
    attackSurfaceScore += mediumCount * 4;
    attackSurfaceScore += cveCount * 15;
    attackSurfaceScore = Math.min(100, attackSurfaceScore);
    // Exposure score
    const exposureScore = attackSurfaceScore;
    // Determine exploitability level
    let exploitabilityLevel = 'Low';
    if (criticalCount > 0 || knownCves.some((c) => c.cvssScore >= 9.0)) {
        exploitabilityLevel = 'Critical';
    }
    else if (highCount > 1 || knownCves.some((c) => c.cvssScore >= 7.0)) {
        exploitabilityLevel = 'High';
    }
    else if (highCount > 0 || mediumCount > 2) {
        exploitabilityLevel = 'Medium';
    }
    // Business impact estimate
    let estimatedBusinessImpact = 'Low';
    if (criticalCount > 0) {
        estimatedBusinessImpact = 'Catastrophic';
    }
    else if (highCount > 1) {
        estimatedBusinessImpact = 'High';
    }
    else if (highCount > 0 || mediumCount > 2) {
        estimatedBusinessImpact = 'Moderate';
    }
    // Key Attack Vectors identified from real evidence
    const keyAttackVectors = [];
    if (!hasTls) {
        keyAttackVectors.push('Unencrypted network transmission (Man-in-the-Middle credential interception)');
    }
    if (findings.some((f) => f.ruleId === 'HDR-003')) {
        keyAttackVectors.push('Cross-Site Scripting (XSS) due to absent Content-Security-Policy');
    }
    if (findings.some((f) => f.ruleId === 'HDR-005')) {
        keyAttackVectors.push('UI Redress / Clickjacking due to missing frame-ancestors & X-Frame-Options');
    }
    if (findings.some((f) => f.ruleId === 'CKI-001' || f.ruleId === 'CKI-002')) {
        keyAttackVectors.push('Session token theft via insecure cookie flags (Missing HttpOnly / Secure)');
    }
    if (cveCount > 0) {
        keyAttackVectors.push(`Known public CVE exploits targeting ${knownCves.map((c) => c.affectedComponent).join(', ')}`);
    }
    if (keyAttackVectors.length === 0) {
        keyAttackVectors.push('Standard perimeter defense; no severe entry points identified in passive checks');
    }
    // Calculate EPSS / CVSS averages if CVEs exist
    const cvssMax = knownCves.length > 0 ? Math.max(...knownCves.map((c) => c.cvssScore)) : undefined;
    const epssAverage = knownCves.length > 0 && knownCves.some((c) => c.epssScore !== undefined)
        ? knownCves.reduce((sum, c) => sum + (c.epssScore || 0), 0) / knownCves.length
        : undefined;
    // Residual risk calculation
    const residualRisk = criticalCount > 0 || highCount > 2
        ? 'Substantial residual risk remains until critical defenses (HTTPS, CSP, HSTS) are applied.'
        : mediumCount > 0
            ? 'Moderate residual risk; resolve security header warnings and update dependencies to achieve low exposure.'
            : 'Low residual exposure based on current passive observation.';
    const confidenceLevel = findings.length > 0 ? 'High' : 'Medium';
    const summary = `Exploitability assessed as ${exploitabilityLevel} with an attack surface exposure score of ${exposureScore}/100. ${criticalCount > 0
        ? `Found ${criticalCount} critical vulnerability requiring immediate patching.`
        : 'No critical exploits observed from public surface.'}`;
    return {
        exposureScore,
        exploitabilityLevel,
        attackSurfaceScore,
        estimatedBusinessImpact,
        confidenceLevel,
        epssAverage,
        cvssMax,
        residualRisk,
        summary,
        keyAttackVectors,
    };
}
