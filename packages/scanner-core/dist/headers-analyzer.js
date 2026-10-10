"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeHeaders = analyzeHeaders;
function analyzeHeaders(headers) {
    const items = [];
    // 1. Analyze HSTS
    const hstsRaw = headers['strict-transport-security'];
    const hstsIssues = [];
    let hstsMaxAge;
    let hstsIncludeSubDomains = false;
    let hstsPreload = false;
    let hstsOptimal = false;
    if (hstsRaw) {
        const parts = hstsRaw.split(';').map((p) => p.trim());
        for (const part of parts) {
            if (part.toLowerCase().startsWith('max-age=')) {
                const val = parseInt(part.split('=')[1], 10);
                if (!isNaN(val))
                    hstsMaxAge = val;
            }
            else if (part.toLowerCase() === 'includesubdomains') {
                hstsIncludeSubDomains = true;
            }
            else if (part.toLowerCase() === 'preload') {
                hstsPreload = true;
            }
        }
        if (hstsMaxAge === undefined) {
            hstsIssues.push('HSTS header is missing max-age directive.');
        }
        else if (hstsMaxAge < 15552000) {
            // less than 180 days
            hstsIssues.push(`HSTS max-age is set to ${hstsMaxAge}s, which is lower than the recommended 15,552,000s (180 days).`);
        }
        if (!hstsIncludeSubDomains) {
            hstsIssues.push('HSTS does not include "includeSubDomains", leaving subdomains vulnerable to MITM attacks.');
        }
        hstsOptimal = (hstsMaxAge || 0) >= 15552000 && hstsIncludeSubDomains;
        items.push({
            name: 'Strict-Transport-Security',
            present: true,
            value: hstsRaw,
            status: hstsOptimal ? 'optimal' : 'warning',
            feedback: hstsOptimal
                ? 'HSTS is properly configured with adequate max-age and subdomain protection.'
                : `HSTS configured with caveats: ${hstsIssues.join(' ')}`,
            recommendation: 'Set "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload"',
        });
    }
    else {
        items.push({
            name: 'Strict-Transport-Security',
            present: false,
            status: 'critical',
            feedback: 'Missing HSTS header. Users may be downgraded to unencrypted HTTP via SSL-stripping attacks.',
            recommendation: 'Enforce HSTS with "Strict-Transport-Security: max-age=31536000; includeSubDomains"',
        });
    }
    // 2. Analyze CSP
    const cspRaw = headers['content-security-policy'];
    const cspReportOnly = headers['content-security-policy-report-only'];
    const activeCsp = cspRaw || cspReportOnly;
    const cspIssues = [];
    const cspDirectives = [];
    let hasUnsafeInlineScript = false;
    let hasUnsafeEval = false;
    let hasWildcardHost = false;
    let hasDefaultOrScript = false;
    if (activeCsp) {
        const rawDirectives = activeCsp.split(';').map((d) => d.trim()).filter(Boolean);
        for (const d of rawDirectives) {
            const parts = d.split(/\s+/);
            const name = parts[0].toLowerCase();
            const values = parts.slice(1);
            const dIssues = [];
            let isDangerous = false;
            if (['script-src', 'default-src'].includes(name)) {
                hasDefaultOrScript = true;
                if (values.includes("'unsafe-inline'")) {
                    hasUnsafeInlineScript = true;
                    isDangerous = true;
                    dIssues.push("Allows 'unsafe-inline' which bypasses XSS protection.");
                }
                if (values.includes("'unsafe-eval'")) {
                    hasUnsafeEval = true;
                    isDangerous = true;
                    dIssues.push("Allows 'unsafe-eval' string-to-code execution.");
                }
                if (values.includes('*') || values.includes('http:') || values.includes('https:')) {
                    hasWildcardHost = true;
                    isDangerous = true;
                    dIssues.push('Uses wildcards or schemes without host restriction.');
                }
            }
            cspDirectives.push({
                directive: name,
                values,
                isDangerous,
                issues: dIssues,
            });
        }
        if (!hasDefaultOrScript) {
            cspIssues.push('CSP does not define default-src or script-src.');
        }
        if (hasUnsafeInlineScript) {
            cspIssues.push("CSP permits 'unsafe-inline' in script directives.");
        }
        if (hasUnsafeEval) {
            cspIssues.push("CSP permits 'unsafe-eval'.");
        }
        if (Boolean(cspReportOnly && !cspRaw)) {
            cspIssues.push('CSP is only deployed in Content-Security-Policy-Report-Only mode (not enforced).');
        }
        items.push({
            name: 'Content-Security-Policy',
            present: true,
            value: activeCsp,
            status: cspIssues.length === 0 ? 'optimal' : 'warning',
            feedback: cspIssues.length === 0
                ? 'Robust Content-Security-Policy actively restricts execution and resources.'
                : `CSP is present but has vulnerabilities: ${cspIssues.join(' ')}`,
            recommendation: 'Remove unsafe-inline and unsafe-eval; restrict sources to nonces, hashes, or trusted origins.',
        });
    }
    else {
        items.push({
            name: 'Content-Security-Policy',
            present: false,
            status: 'critical',
            feedback: 'Missing Content-Security-Policy header. Site is vulnerable to Content Injection, XSS, and clickjacking.',
            recommendation: "Implement a strict CSP restricting script-src, style-src, frame-ancestors, and object-src 'none'.",
        });
    }
    // 3. X-Frame-Options
    const xfo = headers['x-frame-options'];
    const hasFrameAncestors = cspDirectives.some((d) => d.directive === 'frame-ancestors');
    const isXfoProtected = Boolean((xfo && ['deny', 'sameorigin'].includes(xfo.toLowerCase().trim())) || hasFrameAncestors);
    items.push({
        name: 'X-Frame-Options / frame-ancestors',
        present: Boolean(xfo || hasFrameAncestors),
        value: xfo || (hasFrameAncestors ? 'CSP frame-ancestors defined' : undefined),
        status: isXfoProtected ? 'optimal' : 'critical',
        feedback: isXfoProtected
            ? 'Framing is appropriately restricted to prevent Clickjacking.'
            : 'Neither X-Frame-Options nor CSP frame-ancestors is present. Site can be embedded in malicious iframes.',
        recommendation: 'Set "X-Frame-Options: DENY" or CSP "frame-ancestors \'none\'".',
    });
    // 4. X-Content-Type-Options
    const xcto = headers['x-content-type-options'];
    const isNosniff = xcto?.toLowerCase().trim() === 'nosniff';
    items.push({
        name: 'X-Content-Type-Options',
        present: Boolean(xcto),
        value: xcto,
        status: isNosniff ? 'optimal' : 'warning',
        feedback: isNosniff
            ? 'MIME-sniffing protection is active (nosniff).'
            : 'Missing X-Content-Type-Options: nosniff. Browsers may execute non-executable MIME types.',
        recommendation: 'Set "X-Content-Type-Options: nosniff".',
    });
    // 5. Referrer-Policy
    const refPol = headers['referrer-policy'];
    const secureReferrers = [
        'no-referrer',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'no-referrer-when-downgrade',
    ];
    const isRefSecure = Boolean(refPol && secureReferrers.includes(refPol.toLowerCase().trim()));
    items.push({
        name: 'Referrer-Policy',
        present: Boolean(refPol),
        value: refPol,
        status: isRefSecure ? 'optimal' : 'warning',
        feedback: isRefSecure
            ? `Referrer policy is configured securely (${refPol}).`
            : 'Referrer-Policy is missing or permissive. Sensitive URL parameters may leak to external referrers.',
        recommendation: 'Set "Referrer-Policy: strict-origin-when-cross-origin".',
    });
    // 6. Permissions-Policy
    const permPol = headers['permissions-policy'] || headers['feature-policy'];
    items.push({
        name: 'Permissions-Policy',
        present: Boolean(permPol),
        value: permPol,
        status: permPol ? 'optimal' : 'informational',
        feedback: permPol
            ? 'Permissions-Policy restricts sensitive browser features (camera, microphone, geolocation).'
            : 'Permissions-Policy is not defined. Browser features default to standard permission prompts.',
        recommendation: 'Set "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()".',
    });
    // 7. Passive Information Leakage in Headers
    const serverHeader = headers['server'];
    const xPoweredBy = headers['x-powered-by'];
    const aspNetVersion = headers['x-aspnet-version'] || headers['x-aspnetmvc-version'];
    const detectedTech = [];
    if (serverHeader) {
        if (/\d+\.\d+/.test(serverHeader)) {
            detectedTech.push(`Server version leaked: ${serverHeader}`);
        }
    }
    if (xPoweredBy) {
        detectedTech.push(`X-Powered-By: ${xPoweredBy}`);
    }
    if (aspNetVersion) {
        detectedTech.push(`ASP.NET version: ${aspNetVersion}`);
    }
    const leaksTechnologies = detectedTech.length > 0;
    items.push({
        name: 'Information Disclosure (Server / Powered-By)',
        present: Boolean(serverHeader || xPoweredBy || aspNetVersion),
        value: [serverHeader, xPoweredBy, aspNetVersion].filter(Boolean).join(' | '),
        status: leaksTechnologies ? 'warning' : 'optimal',
        feedback: leaksTechnologies
            ? `Software versions or technology stacks exposed in response headers: ${detectedTech.join(', ')}.`
            : 'Server header is obscured or stripped of sensitive version numbers.',
        recommendation: 'Strip or obscure the "Server" and "X-Powered-By" headers in web server configuration.',
    });
    return {
        rawHeaders: headers,
        items,
        hsts: {
            present: Boolean(hstsRaw),
            raw: hstsRaw,
            maxAgeSeconds: hstsMaxAge,
            includeSubDomains: hstsIncludeSubDomains,
            preload: hstsPreload,
            isOptimal: hstsOptimal,
            issues: hstsIssues,
        },
        csp: {
            present: Boolean(activeCsp),
            raw: activeCsp,
            isReportOnly: Boolean(cspReportOnly && !cspRaw),
            hasUnsafeInlineScript,
            hasUnsafeEval,
            hasWildcardHost,
            hasDefaultSrcOrScriptSrc: hasDefaultOrScript,
            directives: cspDirectives,
            issues: cspIssues,
        },
        xFrameOptions: {
            present: Boolean(xfo),
            value: xfo,
            isProtected: isXfoProtected,
            issues: isXfoProtected ? [] : ['Missing clickjacking protection via X-Frame-Options or CSP.'],
        },
        xContentTypeOptions: {
            present: Boolean(xcto),
            value: xcto,
            isNosniff,
        },
        referrerPolicy: {
            present: Boolean(refPol),
            value: refPol,
            isStrict: isRefSecure,
        },
        permissionsPolicy: {
            present: Boolean(permPol),
            value: permPol,
            directivesCount: permPol ? permPol.split(',').length : 0,
        },
        serverLeakage: {
            serverHeader,
            xPoweredBy,
            aspNetVersion,
            leaksTechnologies,
            detectedTech,
        },
    };
}
