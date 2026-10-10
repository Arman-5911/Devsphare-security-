"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RULE_CATALOG = void 0;
exports.RULE_CATALOG = {
    'TLS-001': {
        id: 'TLS-001',
        category: 'ssl_tls',
        severity: 'critical',
        confidence: 'confirmed',
        title: 'Unencrypted HTTP Protocol in Use',
        description: 'The target website communicates exclusively or primarily over plaintext HTTP.',
        defaultDeduction: 25,
        explanation: 'Transmitting traffic without TLS encryption allows eavesdroppers and attackers on the local network path to intercept credentials, session tokens, and sensitive business data.',
        potentialImpact: 'Full eavesdropping, man-in-the-middle credential theft, session hijacking, and search engine ranking penalties.',
        remediation: 'Install a valid TLS certificate from Let\'s Encrypt or a trusted Certificate Authority and enforce HTTPS redirects.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A02:2021', title: 'Cryptographic Failures' },
            { framework: 'NIST CSF', identifier: 'PR.DS-2', title: 'Data-in-transit is protected' },
            { framework: 'RFC', identifier: 'RFC 8446', title: 'The Transport Layer Security (TLS) Protocol' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx HTTPS Redirection',
                code: `server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}`,
            },
            {
                language: 'apache',
                server: 'apache',
                title: 'Apache .htaccess HTTPS Enforcement',
                code: `RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
            },
            {
                language: 'caddy',
                server: 'caddy',
                title: 'Caddy Automatic HTTPS',
                code: `example.com {
    # Caddy enables automatic HTTPS by default
    reverse_proxy localhost:3000
}`,
            },
        ],
        verificationSteps: [
            'curl -I http://<domain> to check for 301 redirect to https://',
            'Verify padlock icon in browser address bar',
        ],
    },
    'TLS-002': {
        id: 'TLS-002',
        category: 'ssl_tls',
        severity: 'critical',
        confidence: 'confirmed',
        title: 'SSL/TLS Certificate Expired',
        description: 'The server certificate validity period has expired.',
        defaultDeduction: 25,
        explanation: 'An expired certificate triggers browser security warnings, blocking normal users from accessing the site and exposing connections to MitM attacks.',
        potentialImpact: 'Total site inaccessibility, loss of customer trust, broken API integrations, and vulnerability to spoofing.',
        remediation: 'Immediately renew and deploy a new SSL/TLS certificate. Configure automated certificate renewals (e.g. Certbot with cron/systemd timers).',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A02:2021', title: 'Cryptographic Failures' },
            { framework: 'RFC', identifier: 'RFC 5280', title: 'X.509 PKI Certificate and CRL Profile' },
        ],
        snippets: [
            {
                language: 'bash',
                server: 'general',
                title: 'Certbot Renewal Command',
                code: `certbot renew --force-renewal
systemctl reload nginx`,
            },
        ],
        verificationSteps: [
            'openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates',
        ],
    },
    'TLS-003': {
        id: 'TLS-003',
        category: 'ssl_tls',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'SSL/TLS Certificate Expiring Soon (< 30 Days)',
        description: 'The server certificate will expire in less than 30 days.',
        defaultDeduction: 8,
        explanation: 'Proactive monitoring is necessary to avoid sudden service outages and browser security warnings when the certificate expires.',
        potentialImpact: 'Impending service disruption and browser security warning if renewal is delayed.',
        remediation: 'Ensure automated renewal hooks (Certbot / ACME) are functioning or renew the commercial certificate.',
        standards: [
            { framework: 'NIST CSF', identifier: 'PR.MA-1', title: 'Maintenance and certificate monitoring' },
        ],
        snippets: [
            {
                language: 'bash',
                server: 'general',
                title: 'Test Certbot Dry Run',
                code: `certbot renew --dry-run`,
            },
        ],
        verificationSteps: ['Check expiry date in certificate inspection details.'],
    },
    'TLS-004': {
        id: 'TLS-004',
        category: 'ssl_tls',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Self-Signed or Untrusted SSL/TLS Certificate',
        description: 'The SSL certificate is not signed by a recognized Certificate Authority.',
        defaultDeduction: 18,
        explanation: 'Self-signed certificates cannot be verified by standard browsers or mobile clients without manual trust store modifications, making connections vulnerable to interception.',
        potentialImpact: 'Severe browser warning barriers, users prompted with security errors, API client rejection.',
        remediation: 'Obtain a certificate signed by a trusted CA such as Let\'s Encrypt, Cloudflare, DigiCert, or Google Trust Services.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A02:2021', title: 'Cryptographic Failures' },
            { framework: 'CWE', identifier: 'CWE-295', title: 'Improper Certificate Validation' },
        ],
        snippets: [
            {
                language: 'bash',
                server: 'general',
                title: 'Issue Free Trusted Cert with Let\'s Encrypt',
                code: `sudo certbot --nginx -d example.com -d www.example.com`,
            },
        ],
        verificationSteps: ['Verify authorized: true in TLS handshake details.'],
    },
    'TLS-005': {
        id: 'TLS-005',
        category: 'ssl_tls',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Deprecated TLS Protocol Version (TLS 1.0 / 1.1)',
        description: 'Server negotiated a legacy TLS protocol version.',
        defaultDeduction: 15,
        explanation: 'TLS 1.0 and 1.1 have known cryptographic vulnerabilities (e.g. BEAST, POODLE) and have been deprecated by NIST, PCI-DSS, and major browser vendors.',
        potentialImpact: 'PCI-DSS compliance failure, cipher downgrade vulnerability, weakened encryption.',
        remediation: 'Disable TLS 1.0 and TLS 1.1. Enforce TLS 1.2 and TLS 1.3 exclusively.',
        standards: [
            { framework: 'NIST CSF', identifier: 'PR.DS-2', title: 'Protect data in transit' },
            { framework: 'RFC', identifier: 'RFC 8996', title: 'Deprecating TLS 1.0 and TLS 1.1' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Modern TLS Protocol Setting',
                code: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5:!3DES;`,
            },
        ],
        verificationSteps: [
            'nmap --script ssl-enum-ciphers -p 443 <domain>',
        ],
    },
    'HDR-001': {
        id: 'HDR-001',
        category: 'security_headers',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        description: 'The HTTP Strict-Transport-Security header is not present on HTTPS responses.',
        defaultDeduction: 15,
        explanation: 'Without HSTS, attackers on the network path can perform SSL-stripping attacks, transparently downgrading user traffic from HTTPS to unencrypted HTTP.',
        potentialImpact: 'SSL stripping, cookie hijacking, and eavesdropping during initial unencrypted connections.',
        remediation: 'Add the Strict-Transport-Security header with a max-age of at least 31536000 seconds (1 year) and includeSubDomains.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
            { framework: 'RFC', identifier: 'RFC 6797', title: 'HTTP Strict Transport Security (HSTS)' },
            { framework: 'OWASP ASVS', identifier: '14.4.5', title: 'HSTS Verification' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx HSTS Configuration',
                code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
            },
            {
                language: 'apache',
                server: 'apache',
                title: 'Apache HSTS Configuration',
                code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`,
            },
            {
                language: 'typescript',
                server: 'express',
                title: 'Express / Helmet HSTS Configuration',
                code: `app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));`,
            },
            {
                language: 'javascript',
                server: 'nextjs',
                title: 'Next.js next.config.js Headers',
                code: `// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i strict-transport-security'],
    },
    'HDR-002': {
        id: 'HDR-002',
        category: 'security_headers',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Suboptimal HSTS Configuration',
        description: 'HSTS is enabled but uses a short max-age duration or omits subdomains.',
        defaultDeduction: 4,
        explanation: 'An HSTS max-age duration shorter than 6 months (15552000s) does not offer durable protection for infrequent visitors, and omitting includeSubDomains leaves subdomain origins unprotected.',
        potentialImpact: 'Reduced window of protection against downgrade attacks on subdomains.',
        remediation: 'Increase max-age to 31536000 (1 year) and append includeSubDomains.',
        standards: [
            { framework: 'OWASP ASVS', identifier: '14.4.5', title: 'HSTS Verification' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Optimal HSTS',
                code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`,
            },
        ],
        verificationSteps: ['Verify max-age >= 31536000 and includeSubDomains in response headers.'],
    },
    'HDR-003': {
        id: 'HDR-003',
        category: 'security_headers',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Missing Content Security Policy (CSP)',
        description: 'No Content-Security-Policy header was detected.',
        defaultDeduction: 15,
        explanation: 'Content Security Policy is the primary defense-in-depth barrier against Cross-Site Scripting (XSS), malicious script injection, data exfiltration, and UI redress attacks.',
        potentialImpact: 'Heightened vulnerability to Stored/Reflected XSS, malicious third-party script loading, and rogue token exfiltration.',
        remediation: 'Implement a Content-Security-Policy that defines trusted sources for scripts, styles, images, and frame-ancestors.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A03:2021', title: 'Injection (XSS)' },
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
            { framework: 'CWE', identifier: 'CWE-79', title: 'Improper Neutralization of Input During Web Page Generation' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Standard Strict CSP',
                code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https: data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;`,
            },
            {
                language: 'typescript',
                server: 'express',
                title: 'Helmet CSP Configuration',
                code: `app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i content-security-policy'],
    },
    'HDR-004': {
        id: 'HDR-004',
        category: 'security_headers',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Permissive Content Security Policy (unsafe-inline / unsafe-eval)',
        description: 'Content-Security-Policy includes unsafe-inline or unsafe-eval directives.',
        defaultDeduction: 8,
        explanation: "Allowing 'unsafe-inline' scripts negates one of CSP's greatest benefits, allowing injected scripts to execute within the victim's session.",
        potentialImpact: 'XSS payloads can execute via inline script tags, bypassing CSP protections.',
        remediation: 'Refactor inline scripts into external files or utilize cryptographic nonces (nonce-...) or SHA-256 hashes.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A03:2021', title: 'Injection' },
            { framework: 'CWE', identifier: 'CWE-79', title: 'Cross-site Scripting' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'Nonce-based Script Loading',
                code: `<!-- Use cryptographic nonce in CSP -->
<script nonce="rAnd0m123" src="/app.js"></script>`,
            },
        ],
        verificationSteps: ['Inspect CSP directives and ensure unsafe-inline is removed.'],
    },
    'HDR-005': {
        id: 'HDR-005',
        category: 'security_headers',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Missing Clickjacking Protection (X-Frame-Options / frame-ancestors)',
        description: 'Neither X-Frame-Options nor CSP frame-ancestors is configured.',
        defaultDeduction: 10,
        explanation: 'Without clickjacking defenses, malicious websites can embed your site inside a transparent iframe, tricking authenticated users into clicking buttons or performing unauthorized actions.',
        potentialImpact: 'Clickjacking attacks, unauthorized financial transactions, unintentional consent grants.',
        remediation: 'Set "X-Frame-Options: DENY" (or SAMEORIGIN), or configure CSP "frame-ancestors \'none\'".',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
            { framework: 'CWE', identifier: 'CWE-1021', title: 'Improper Restriction of Rendered UI Layers or Frames' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx X-Frame-Options',
                code: `add_header X-Frame-Options "DENY" always;`,
            },
            {
                language: 'apache',
                server: 'apache',
                title: 'Apache X-Frame-Options',
                code: `Header always set X-Frame-Options "DENY"`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i x-frame-options'],
    },
    'HDR-006': {
        id: 'HDR-006',
        category: 'security_headers',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Missing X-Content-Type-Options: nosniff',
        description: 'The X-Content-Type-Options header is absent or not set to nosniff.',
        defaultDeduction: 5,
        explanation: 'Browsers can attempt to MIME-sniff response content, potentially interpreting user-uploaded images or text files as executable JavaScript.',
        potentialImpact: 'MIME-confusion attacks leading to Cross-Site Scripting (XSS).',
        remediation: 'Set "X-Content-Type-Options: nosniff" on all responses.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
            { framework: 'CWE', identifier: 'CWE-79', title: 'MIME Confusion XSS' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx nosniff',
                code: `add_header X-Content-Type-Options "nosniff" always;`,
            },
            {
                language: 'apache',
                server: 'apache',
                title: 'Apache nosniff',
                code: `Header always set X-Content-Type-Options "nosniff"`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i x-content-type-options'],
    },
    'HDR-007': {
        id: 'HDR-007',
        category: 'security_headers',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Missing or Permissive Referrer-Policy',
        description: 'Referrer-Policy header is absent or set to unsafe-url.',
        defaultDeduction: 4,
        explanation: 'Browsers default to sending the full origin and path in Referer headers when navigating away, which may expose private URL tokens, session IDs, or sensitive parameter values.',
        potentialImpact: 'Information disclosure of sensitive URL query parameters to external third-party hosts.',
        remediation: 'Set "Referrer-Policy: strict-origin-when-cross-origin" or "no-referrer".',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A01:2021', title: 'Broken Access Control' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Referrer-Policy',
                code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i referrer-policy'],
    },
    'HDR-008': {
        id: 'HDR-008',
        category: 'security_headers',
        severity: 'info',
        confidence: 'confirmed',
        title: 'Permissions-Policy Header Not Configured',
        description: 'The Permissions-Policy header is not explicitly defined.',
        defaultDeduction: 0,
        explanation: 'Permissions-Policy enables developers to disable sensitive browser APIs such as microphone, camera, geolocation, and payment request within the origin and embedded frames.',
        potentialImpact: 'Embedded third-party scripts or iframes could invoke hardware APIs without origin-level restrictions.',
        remediation: 'Define a Permissions-Policy header restricting unused browser hardware capabilities.',
        standards: [
            { framework: 'W3C', identifier: 'Permissions Policy', title: 'W3C Recommendation' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Permissions-Policy',
                code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;`,
            },
        ],
        verificationSteps: ['curl -I https://<domain> | grep -i permissions-policy'],
    },
    'CKI-001': {
        id: 'CKI-001',
        category: 'cookie_security',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Cookie Missing Secure Flag',
        description: 'One or more cookies are set without the Secure attribute.',
        defaultDeduction: 12,
        explanation: 'Cookies lacking the Secure flag will be transmitted over unencrypted HTTP connections whenever a user accesses an http:// link on the same domain.',
        potentialImpact: 'Plaintext interception of session tokens over public Wi-Fi or compromised routers.',
        remediation: 'Ensure all Set-Cookie headers include the "; Secure" directive.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A07:2021', title: 'Identification and Authentication Failures' },
            { framework: 'CWE', identifier: 'CWE-614', title: 'Sensitive Cookie in HTTPS Session Without "Secure" Attribute' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'express',
                title: 'Express Session Secure Cookie',
                code: `app.use(session({
  cookie: { secure: true, httpOnly: true, sameSite: 'lax' }
}));`,
            },
        ],
        verificationSteps: ['Check Set-Cookie response headers for the Secure keyword.'],
    },
    'CKI-002': {
        id: 'CKI-002',
        category: 'cookie_security',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Cookie Missing HttpOnly Flag',
        description: 'One or more cookies lack the HttpOnly attribute.',
        defaultDeduction: 8,
        explanation: 'Cookies without HttpOnly can be accessed and exfiltrated by JavaScript through document.cookie in the event of an XSS vulnerability.',
        potentialImpact: 'Immediate session takeover if any script injection vulnerability exists on the origin.',
        remediation: 'Append "; HttpOnly" to all authentication and session identifiers.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A07:2021', title: 'Authentication Failures' },
            { framework: 'CWE', identifier: 'CWE-1004', title: 'Sensitive Cookie Without "HttpOnly" Flag' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'express',
                title: 'Express HttpOnly Cookie',
                code: `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'lax' });`,
            },
        ],
        verificationSteps: ['Check Set-Cookie header contains HttpOnly.'],
    },
    'CKI-003': {
        id: 'CKI-003',
        category: 'cookie_security',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Cookie Missing SameSite Attribute',
        description: 'One or more cookies omit the SameSite attribute.',
        defaultDeduction: 6,
        explanation: 'Without an explicit SameSite attribute (Lax or Strict), cookies are vulnerable to Cross-Site Request Forgery (CSRF) in cross-site requests.',
        potentialImpact: 'Cross-Site Request Forgery (CSRF) attacks allowing malicious external sites to perform actions as the victim.',
        remediation: 'Set SameSite=Lax (for top-level navigation) or SameSite=Strict on all sensitive cookies.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A01:2021', title: 'Broken Access Control' },
            { framework: 'CWE', identifier: 'CWE-1275', title: 'Sensitive Cookie with Improper SameSite Attribute' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'general',
                title: 'SameSite Cookie Attribute',
                code: `Set-Cookie: sessionId=xyz; Secure; HttpOnly; SameSite=Lax; Path=/`,
            },
        ],
        verificationSteps: ['Verify SameSite=Lax or SameSite=Strict in Set-Cookie header.'],
    },
    'RED-001': {
        id: 'RED-001',
        category: 'network_redirects',
        severity: 'high',
        confidence: 'confirmed',
        title: 'HTTP Traffic Does Not Redirect to HTTPS',
        description: 'Requests to HTTP port 80 do not redirect to HTTPS port 443.',
        defaultDeduction: 15,
        explanation: 'When users type a domain without specifying a protocol, browsers default to HTTP. If port 80 does not issue an immediate 301/308 redirect to HTTPS, users remain on an unencrypted connection.',
        potentialImpact: 'Users vulnerable to interception, network manipulation, and credential exposure.',
        remediation: 'Configure port 80 server block with an unconditional 301 permanent redirect to https://$host$request_uri.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A02:2021', title: 'Cryptographic Failures' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx Port 80 Redirect',
                code: `server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}`,
            },
        ],
        verificationSteps: ['curl -I http://<domain> and verify HTTP 301/308 status code.'],
    },
    'RED-002': {
        id: 'RED-002',
        category: 'network_redirects',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Excessive Redirect Hops Detected',
        description: 'The target URL underwent more than 3 redirect hops before reaching final destination.',
        defaultDeduction: 5,
        explanation: 'Long redirect chains degrade page load performance, increase vulnerability to open-redirect manipulation, and can cause TLS state fragmentation.',
        potentialImpact: 'Increased latency, SEO crawl budget penalty, risk of open redirect traversal.',
        remediation: 'Consolidate redirect rules into a single direct hop to the canonical final URL.',
        standards: [
            { framework: 'RFC', identifier: 'RFC 9110', title: 'HTTP Semantics - Redirection' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Direct Canonical Redirection',
                code: `return 301 https://example.com$request_uri;`,
            },
        ],
        verificationSteps: ['Trace redirect hops via curl -IL <url>.'],
    },
    'INF-001': {
        id: 'INF-001',
        category: 'info_disclosure',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Server Version Information Disclosure',
        description: 'The "Server" header leaks precise web server version numbers.',
        defaultDeduction: 5,
        explanation: 'Advertising specific web server versions (e.g. Apache/2.4.41 or nginx/1.18.0) assists attackers in fingerprinting target systems and matching known CVE vulnerabilities.',
        potentialImpact: 'Aids automated threat actors and scanners in targeting version-specific exploits.',
        remediation: 'Disable server version banners in server config (e.g. server_tokens off in Nginx, ServerTokens Prod in Apache).',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
            { framework: 'CWE', identifier: 'CWE-200', title: 'Exposure of Sensitive Information' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx server_tokens off',
                code: `server_tokens off;`,
            },
            {
                language: 'apache',
                server: 'apache',
                title: 'Apache ServerTokens Prod',
                code: `ServerTokens Prod
ServerSignature Off`,
            },
        ],
        verificationSteps: ['curl -I <url> | grep -i server'],
    },
    'INF-002': {
        id: 'INF-002',
        category: 'info_disclosure',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Technology Stack Disclosure via X-Powered-By',
        description: 'Response headers contain X-Powered-By or framework version banners.',
        defaultDeduction: 4,
        explanation: 'Exposing runtime technologies (e.g. Express, PHP/7.4, ASP.NET) provides attackers with precise architecture insights, narrowing down relevant exploit candidates.',
        potentialImpact: 'Information disclosure aiding vulnerability research and targeted exploits.',
        remediation: 'Disable the X-Powered-By header in application or framework middleware.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A05:2021', title: 'Security Misconfiguration' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'express',
                title: 'Express Disable X-Powered-By',
                code: `app.disable('x-powered-by');`,
            },
            {
                language: 'ini',
                server: 'general',
                title: 'php.ini expose_php',
                code: `expose_php = Off`,
            },
        ],
        verificationSteps: ['curl -I <url> | grep -i x-powered-by'],
    },
    'DNS-001': {
        id: 'DNS-001',
        category: 'network_redirects',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Missing SPF Email Authentication Record',
        description: 'No TXT record starting with v=spf1 was discovered for the domain.',
        defaultDeduction: 4,
        explanation: 'Sender Policy Framework (SPF) specifies which mail servers are authorized to send email on behalf of your domain. Without SPF, attackers can forge sender addresses for phishing.',
        potentialImpact: 'Phishing impersonation, domain email spoofing, decreased deliverability of legitimate mail.',
        remediation: 'Publish an SPF TXT record in DNS (e.g. "v=spf1 -all" if domain sends no mail, or include mail providers).',
        standards: [
            { framework: 'RFC', identifier: 'RFC 7208', title: 'Sender Policy Framework (SPF)' },
        ],
        snippets: [
            {
                language: 'dns',
                server: 'general',
                title: 'DNS TXT Record for Non-Sending Domain',
                code: `example.com. IN TXT "v=spf1 -all"`,
            },
        ],
        verificationSteps: ['dig +short TXT example.com | grep v=spf1'],
    },
    'DNS-002': {
        id: 'DNS-002',
        category: 'network_redirects',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Missing DMARC Email Security Record',
        description: 'No DMARC record found at _dmarc.<domain>.',
        defaultDeduction: 4,
        explanation: 'Domain-based Message Authentication, Reporting, and Conformance (DMARC) provides instructions to receiving mail servers on how to handle emails that fail SPF/DKIM verification.',
        potentialImpact: 'Lack of policy enforcement against email spoofing and absence of abuse reporting.',
        remediation: 'Add a TXT record at _dmarc.<domain> with policy p=reject or p=quarantine.',
        standards: [
            { framework: 'RFC', identifier: 'RFC 7489', title: 'DMARC' },
        ],
        snippets: [
            {
                language: 'dns',
                server: 'general',
                title: 'DMARC TXT Record',
                code: `_dmarc.example.com. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com"`,
            },
        ],
        verificationSteps: ['dig +short TXT _dmarc.example.com'],
    },
    'HYG-001': {
        id: 'HYG-001',
        category: 'info_disclosure',
        severity: 'info',
        confidence: 'confirmed',
        title: 'Missing RFC 9116 security.txt Vulnerability Disclosure Policy',
        description: 'No security.txt file found at /.well-known/security.txt.',
        defaultDeduction: 0,
        explanation: 'RFC 9116 defines a standard location for organizations to define security contact channels, PGP keys, and vulnerability disclosure policies for ethical researchers.',
        potentialImpact: 'Ethical security researchers may be unable to report responsibly disclosed vulnerabilities.',
        remediation: 'Deploy a security.txt file at /.well-known/security.txt following RFC 9116 specifications.',
        standards: [
            { framework: 'RFC', identifier: 'RFC 9116', title: 'A File Format to Aid in Security Vulnerability Disclosure' },
        ],
        snippets: [
            {
                language: 'text',
                server: 'general',
                title: '/.well-known/security.txt example',
                code: `Contact: mailto:security@example.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Policy: https://example.com/security-policy`,
            },
        ],
        verificationSteps: ['curl -s https://<domain>/.well-known/security.txt'],
    },
    'PERF-001': {
        id: 'PERF-001',
        category: 'performance',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'High Unused JavaScript / Low Code Coverage',
        description: 'Over 60% of transferred JavaScript bundles are unused on the initial page load.',
        defaultDeduction: 8,
        explanation: 'Shipping large, un-split JavaScript bundles forces mobile browsers to parse and compile unnecessary code before executing user interactions, delaying FCP and LCP.',
        potentialImpact: 'Severe mobile latency, degraded Core Web Vitals, and bounce rate increases on slower networks.',
        remediation: 'Implement route-based code splitting, lazy load below-the-fold components with dynamic imports, and tree-shake unused vendor dependencies.',
        standards: [
            { framework: 'Core Web Vitals', identifier: 'LCP / TBT', title: 'JavaScript Execution Optimization' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'nextjs',
                title: 'Next.js Dynamic Import / Code Splitting',
                code: `import dynamic from 'next/dynamic';

const HeavyModal = dynamic(() => import('@/components/HeavyModal'), {
  ssr: false,
  loading: () => <p>Loading modal...</p>,
});`,
            },
            {
                language: 'javascript',
                server: 'react',
                title: 'React.lazy Suspense Splitting',
                code: `import React, { Suspense, lazy } from 'react';

const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanel />
    </Suspense>
  );
}`,
            },
        ],
        verificationSteps: ['Inspect Chrome DevTools > Coverage tab to verify unused JS < 30%.'],
    },
    'PERF-002': {
        id: 'PERF-002',
        category: 'performance',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Largest Contentful Paint (LCP) Exceeds Target',
        description: 'The largest visible content element takes longer than 2.5 seconds to render.',
        defaultDeduction: 15,
        explanation: 'LCP marks the point in the page load timeline when the main content has likely loaded. High LCP causes users to perceive the site as sluggish.',
        potentialImpact: 'Direct search engine ranking penalty from Google Core Web Vitals and lower conversion rates.',
        remediation: 'Preload priority hero images with <link rel="preload">, eliminate render-blocking CSS, and optimize TTFB.',
        standards: [
            { framework: 'Core Web Vitals', identifier: 'LCP', title: 'Target < 2.5s on mobile' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'Preload Hero LCP Image',
                code: `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />`,
            },
        ],
        verificationSteps: ['Run Lighthouse performance test or inspect Web Vitals extension.'],
    },
    'PERF-003': {
        id: 'PERF-003',
        category: 'performance',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Images Missing Explicit Width and Height Attributes',
        description: 'Images without width and height cause Cumulative Layout Shift (CLS).',
        defaultDeduction: 4,
        explanation: 'When browsers do not know an image aspect ratio ahead of time, page layout unexpectedly shifts when the image finishes loading.',
        potentialImpact: 'Cumulative Layout Shift (CLS) penalty, frustrating accidental clicks for mobile users.',
        remediation: 'Set explicit width and height attributes or style="aspect-ratio: ...;" on all <img> tags.',
        standards: [
            { framework: 'Core Web Vitals', identifier: 'CLS', title: 'Target < 0.1 CLS' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'Explicit Aspect Ratio on Images',
                code: `<img src="/photo.webp" width="800" height="600" alt="Descriptive text" loading="lazy" />`,
            },
        ],
        verificationSteps: ['Inspect DevTools layout shift markers.'],
    },
    'A11Y-001': {
        id: 'A11Y-001',
        category: 'accessibility',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Images Missing Meaningful Alternative Text',
        description: 'One or more <img> elements lack an alt attribute.',
        defaultDeduction: 12,
        explanation: 'Screen readers rely on alt attributes to read descriptions of images to visually impaired users. Without alt text, the screen reader may read the raw file URL.',
        potentialImpact: 'Severe accessibility barrier for assistive technology users; non-compliance with ADA / WCAG 2.1 AA.',
        remediation: 'Add descriptive alt text to informative images or alt="" for purely decorative elements.',
        standards: [
            { framework: 'WCAG 2.1 AA', identifier: '1.1.1', title: 'Non-text Content (Level A)' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'Accessible Image Alt Text',
                code: `<!-- Informative image -->
<img src="/dashboard.png" alt="DevSphere security dashboard overview showing score gauge" />

<!-- Decorative image -->
<img src="/background-glow.svg" alt="" role="presentation" />`,
            },
        ],
        verificationSteps: ['Inspect images with axe DevTools or screen reader.'],
    },
    'A11Y-002': {
        id: 'A11Y-002',
        category: 'accessibility',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Interactive Buttons Missing Accessible Names',
        description: 'Buttons contain no readable text, aria-label, or title attribute.',
        defaultDeduction: 10,
        explanation: 'Icon-only buttons without text or an aria-label are completely silent to screen readers, preventing blind users from understanding their function.',
        potentialImpact: 'Inoperable interface for assistive technology users.',
        remediation: 'Add aria-label="Description" to icon-only buttons.',
        standards: [
            { framework: 'WCAG 2.1 AA', identifier: '4.1.2', title: 'Name, Role, Value (Level A)' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'Accessible Icon Button',
                code: `<button type="button" aria-label="Close dialog">
  <svg class="icon-close" aria-hidden="true"></svg>
</button>`,
            },
        ],
        verificationSteps: ['Verify button has accessible name in Accessibility tree.'],
    },
    'A11Y-003': {
        id: 'A11Y-003',
        category: 'accessibility',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Low Color Contrast Ratio',
        description: 'Text elements do not meet the minimum 4.5:1 contrast ratio against their background.',
        defaultDeduction: 8,
        explanation: 'Low contrast text (such as light gray on white or dark gray on black) is difficult or impossible to read for users with low vision or when viewing under sunlight.',
        potentialImpact: 'Reduced readability and WCAG 2.1 AA compliance failure.',
        remediation: 'Darken body copy or lighten background to achieve at least 4.5:1 contrast for standard text and 3:1 for large text.',
        standards: [
            { framework: 'WCAG 2.1 AA', identifier: '1.4.3', title: 'Contrast (Minimum) (Level AA)' },
        ],
        snippets: [
            {
                language: 'css',
                server: 'general',
                title: 'High Contrast Color Tokens',
                code: `/* Meets 7:1 AAA contrast */
--color-foreground: #F8FAFC; /* on #060913 */
--color-muted-text: #94A3B8; /* on #060913 (4.8:1 AA compliant) */`,
            },
        ],
        verificationSteps: ['Measure color contrast using WebAIM Contrast Checker.'],
    },
    'SEO-001': {
        id: 'SEO-001',
        category: 'seo',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Single-Page Application (SPA) Blank Initial HTML (AI Search / GEO Risk)',
        description: 'The initial HTML snapshot contains fewer than 35 words while rendering via client-side JavaScript.',
        defaultDeduction: 15,
        explanation: 'Because the server returns an empty shell (<div id="root"></div>) requiring client-side JavaScript execution, AI search engines (like Claude, ChatGPT, Perplexity) and lightweight crawlers index an essentially blank document.',
        potentialImpact: 'Severe penalty in AI search citations, zero organic snippet generation, and poor traditional search indexing.',
        remediation: 'Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) with frameworks like Next.js, Remix, or Astro.',
        standards: [
            { framework: 'RFC', identifier: 'GEO Best Practice', title: 'Generative Engine Optimization' },
        ],
        snippets: [
            {
                language: 'javascript',
                server: 'nextjs',
                title: 'Next.js Server Component (Default SSR)',
                code: `// Next.js App Router renders HTML on the server by default
export default async function Page() {
  const data = await getWebsiteData();
  return (
    <article>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </article>
  );
}`,
            },
        ],
        verificationSteps: ['curl -s <url> and verify meaningful article text is present in raw HTML.'],
    },
    'SEO-002': {
        id: 'SEO-002',
        category: 'seo',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'Unknown Routes Return HTTP 200 Instead of 404 (Soft 404)',
        description: 'Requests for non-existent paths return HTTP 200 OK instead of HTTP 404 Not Found.',
        defaultDeduction: 8,
        explanation: 'Returning HTTP 200 for missing pages causes search engines to report soft 404 errors, crawl budgets are wasted indexing duplicate empty shells, and broken links cannot be reliably detected.',
        potentialImpact: 'Search engine index bloat, loss of crawl budget, and inaccurate link monitoring.',
        remediation: 'Configure web server or routing middleware to return a true HTTP 404 status code for unmapped routes.',
        standards: [
            { framework: 'RFC', identifier: 'RFC 9110', title: 'HTTP Status 404 Not Found' },
        ],
        snippets: [
            {
                language: 'nginx',
                server: 'nginx',
                title: 'Nginx 404 Fallback',
                code: `location / {
    try_files $uri $uri/ =404;
}`,
            },
        ],
        verificationSteps: ['curl -I <domain>/nonexistent-test-path-123 and verify HTTP 404.'],
    },
    'SEO-003': {
        id: 'SEO-003',
        category: 'seo',
        severity: 'low',
        confidence: 'confirmed',
        title: 'Missing Schema.org / JSON-LD Structured Data',
        description: 'No structured data entities were discovered on the page.',
        defaultDeduction: 5,
        explanation: 'Structured data allows search engines and generative AI agents to parse entity relationships (Organization, WebSite, SoftwareApplication) without ambiguous NLP heuristics.',
        potentialImpact: 'Ineligibility for rich snippets (breadcrumbs, site search boxes, ratings) in search results.',
        remediation: 'Include a <script type="application/ld+json"> tag declaring relevant Schema.org types.',
        standards: [
            { framework: 'W3C', identifier: 'Schema.org', title: 'Structured Data Web Standards' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'JSON-LD Organization Schema',
                code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "DevSphere Security",
  "applicationCategory": "SecurityApplication",
  "operatingSystem": "All"
}
</script>`,
            },
        ],
        verificationSteps: ['Test with Google Rich Results Test tool.'],
    },
    'SEO-004': {
        id: 'SEO-004',
        category: 'seo',
        severity: 'medium',
        confidence: 'confirmed',
        title: 'AI Search Crawlers Blocked in robots.txt',
        description: 'One or more major AI search crawlers (GPTBot, ClaudeBot, PerplexityBot) are disallowed.',
        defaultDeduction: 6,
        explanation: 'Explicitly disallowing AI crawlers in robots.txt prevents AI search engines from indexing, summarizing, and citing your website in generative answer overviews.',
        potentialImpact: 'Total omission from AI search results (ChatGPT search, Perplexity, Claude citations).',
        remediation: 'If you wish to receive AI search traffic, allow GPTBot, ClaudeBot, and PerplexityBot in robots.txt.',
        standards: [
            { framework: 'RFC', identifier: 'RFC 9309', title: 'Robots Exclusion Protocol' },
        ],
        snippets: [
            {
                language: 'text',
                server: 'general',
                title: 'robots.txt AI Search Allowed',
                code: `User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /`,
            },
        ],
        verificationSteps: ['Check robots.txt directives for AI crawler names.'],
    },
    'SEC-001': {
        id: 'SEC-001',
        category: 'security_headers',
        severity: 'high',
        confidence: 'confirmed',
        title: 'Mixed Content Detected on HTTPS Origin',
        description: 'One or more insecure HTTP resources are referenced within an HTTPS page.',
        defaultDeduction: 15,
        explanation: 'Loading unencrypted HTTP scripts, images, or stylesheets on an HTTPS page creates an opening for network attackers to modify or inject malicious content.',
        potentialImpact: 'Browser console blocking of scripts, broken styling, and compromised connection integrity.',
        remediation: 'Update all internal asset URLs to https:// or use relative paths. Configure CSP upgrade-insecure-requests.',
        standards: [
            { framework: 'W3C', identifier: 'Mixed Content', title: 'W3C Recommendation' },
        ],
        snippets: [
            {
                language: 'html',
                server: 'general',
                title: 'CSP upgrade-insecure-requests directive',
                code: `<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">`,
            },
        ],
        verificationSteps: ['Check browser console for Mixed Content warnings.'],
    },
    'SEC-002': {
        id: 'SEC-002',
        category: 'security_headers',
        severity: 'critical',
        confidence: 'confirmed',
        title: 'Potential Client-Side Secret / API Key Exposure',
        description: 'Patterns matching cloud provider access keys or sensitive tokens were found in client bundles.',
        defaultDeduction: 25,
        explanation: 'Bundling private credentials (AWS keys, Stripe secret keys, private tokens) in frontend scripts exposes them to any visitor viewing page source.',
        potentialImpact: 'Unauthorized access to cloud infrastructure, database compromise, and financial abuse.',
        remediation: 'Immediately rotate the exposed credential. Move API calls requiring private secrets to a secure backend endpoint.',
        standards: [
            { framework: 'OWASP Top 10', identifier: 'A07:2021', title: 'Identification and Authentication Failures' },
            { framework: 'CWE', identifier: 'CWE-798', title: 'Use of Hard-coded Credentials' },
        ],
        snippets: [
            {
                language: 'bash',
                server: 'general',
                title: 'Revoke and rotate credentials',
                code: `# Rotate exposed key immediately in Cloud provider IAM console`,
            },
        ],
        verificationSteps: ['Inspect source code bundles and remove hardcoded tokens.'],
    },
};
