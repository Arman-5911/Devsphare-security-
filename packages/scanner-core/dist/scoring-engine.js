"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePostureScore = calculatePostureScore;
exports.calculateMultiPillarScores = calculateMultiPillarScores;
const CATEGORY_CONFIG = {
    ssl_tls: { name: 'SSL/TLS Cryptography', weight: 0.2 },
    security_headers: { name: 'HTTP Security Headers', weight: 0.25 },
    cookie_security: { name: 'Cookie Security & Attributes', weight: 0.1 },
    network_redirects: { name: 'Network & Redirects', weight: 0.1 },
    info_disclosure: { name: 'Information Disclosure & Hygiene', weight: 0.1 },
    performance: { name: 'Core Web Vitals & Speed', weight: 0.1 },
    accessibility: { name: 'WCAG Accessibility', weight: 0.05 },
    seo: { name: 'SEO & AI Search Readiness', weight: 0.1 },
};
function calculatePostureScore(findings, checksAttempted, checksCompleted) {
    const categoryScores = {
        ssl_tls: {
            category: 'ssl_tls',
            name: CATEGORY_CONFIG.ssl_tls.name,
            weight: CATEGORY_CONFIG.ssl_tls.weight,
            score: 100,
            deductions: 0,
            findingsCount: 0,
        },
        security_headers: {
            category: 'security_headers',
            name: CATEGORY_CONFIG.security_headers.name,
            weight: CATEGORY_CONFIG.security_headers.weight,
            score: 100,
            deductions: 0,
            findingsCount: 0,
        },
        cookie_security: {
            category: 'cookie_security',
            name: CATEGORY_CONFIG.cookie_security.name,
            weight: CATEGORY_CONFIG.cookie_security.weight,
            score: 100,
            deductions: 0,
            findingsCount: 0,
        },
        network_redirects: {
            category: 'network_redirects',
            name: CATEGORY_CONFIG.network_redirects.name,
            weight: CATEGORY_CONFIG.network_redirects.weight,
            score: 100,
            deductions: 0,
            findingsCount: 0,
        },
        info_disclosure: {
            category: 'info_disclosure',
            name: CATEGORY_CONFIG.info_disclosure.name,
            weight: CATEGORY_CONFIG.info_disclosure.weight,
            score: 100,
            deductions: 0,
            findingsCount: 0,
        },
    };
    const findingsBySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
    };
    for (const finding of findings) {
        findingsBySeverity[finding.severity]++;
        const cat = categoryScores[finding.category];
        if (cat) {
            cat.findingsCount++;
            cat.deductions += finding.scoreDeduction;
        }
    }
    // Calculate each category score
    let weightedSum = 0;
    for (const key of Object.keys(categoryScores)) {
        const cat = categoryScores[key];
        cat.score = Math.max(0, Math.min(100, 100 - cat.deductions));
        weightedSum += cat.score * cat.weight;
    }
    // Normalize by sum of weights
    const totalWeight = Object.values(categoryScores).reduce((acc, c) => acc + c.weight, 0);
    let overallScore = Math.round(weightedSum / totalWeight);
    // Critical penalty rule: If there are confirmed critical vulnerabilities, cap the score
    if (findingsBySeverity.critical > 0) {
        overallScore = Math.min(overallScore, 49);
    }
    else if (findingsBySeverity.high > 2) {
        overallScore = Math.min(overallScore, 69);
    }
    // Assign letter grade
    let letterGrade = 'F';
    if (overallScore >= 95 && findingsBySeverity.critical === 0 && findingsBySeverity.high === 0) {
        letterGrade = 'A+';
    }
    else if (overallScore >= 85 && findingsBySeverity.critical === 0) {
        letterGrade = 'A';
    }
    else if (overallScore >= 75 && findingsBySeverity.critical === 0) {
        letterGrade = 'B';
    }
    else if (overallScore >= 65 && findingsBySeverity.critical === 0) {
        letterGrade = 'C';
    }
    else if (overallScore >= 50) {
        letterGrade = 'D';
    }
    else {
        letterGrade = 'F';
    }
    const coverageScore = checksAttempted > 0
        ? Math.round((checksCompleted / checksAttempted) * 100)
        : 100;
    const summary = `Evaluated ${findings.length} findings across security and architecture boundaries. Posture score is ${overallScore}/100 (${letterGrade}) with ${coverageScore}% check coverage.`;
    return {
        overallScore,
        letterGrade,
        coverageScore,
        categoryScores,
        summary,
        totalFindings: findings.length,
        findingsBySeverity,
        isGuaranteedSecure: false,
    };
}
function calculateMultiPillarScores(options) {
    const { postureScore, performance, accessibility, seo } = options;
    const security = postureScore.overallScore;
    const perf = performance?.score ?? 80;
    const a11y = accessibility?.score ?? 85;
    const seoScore = seo?.score ?? 85;
    const codeQa = Math.round((performance?.codeCoveragePercent ?? 75) * 0.5 + (perf * 0.5));
    // Overall Health weighted composite
    // Security 30%, Performance 25%, SEO 20%, Accessibility 15%, Code QA 10%
    const composite = Math.round(security * 0.3 +
        perf * 0.25 +
        seoScore * 0.2 +
        a11y * 0.15 +
        codeQa * 0.1);
    let grade = 'F';
    if (composite >= 95)
        grade = 'A+';
    else if (composite >= 85)
        grade = 'A';
    else if (composite >= 75)
        grade = 'B';
    else if (composite >= 65)
        grade = 'C';
    else if (composite >= 50)
        grade = 'D';
    else
        grade = 'F';
    return {
        overallHealth: composite,
        grade,
        radar: {
            performance: perf,
            accessibility: a11y,
            seo: seoScore,
            security,
            codeQa,
        },
        summary: `Overall Health Score is ${composite}/100 (${grade}). Multi-pillar radar: Perf (${perf}), A11y (${a11y}), SEO (${seoScore}), Security (${security}), Code QA (${codeQa}).`,
    };
}
