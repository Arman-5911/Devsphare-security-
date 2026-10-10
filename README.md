# DevSphere Security 🛡️
> AI-Powered Website Security Analysis & Cybersecurity Intelligence Platform (Phase 1)

DevSphere Security is a modern, production-grade cybersecurity posture auditing platform. It evaluates publicly observable security attributes of websites, identifies misconfigurations, inspects SSL/TLS certificates and ciphers, evaluates HTTP security headers, audits cookie attributes, and delivers deterministic remediation recommendations with copyable configuration snippets.

---

## 🚀 Key Features (Phase 1)

1. **Automated URL Security Scanner**:
   - URL validation, normalization, and protocol enforcement
   - SSL/TLS certificate chain analysis, cipher suite negotiation, and expiration countdown
   - HTTP-to-HTTPS redirect inspection and hop-by-hop latency tracking
   - HTTP Security Header evaluation (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
   - Cookie hygiene analysis (`Secure`, `HttpOnly`, `SameSite`, `__Secure-` / `__Host-` prefixes)
   - DNS email security analysis (SPF and DMARC verification)
   - Passive technology disclosure detection (`Server` headers, `X-Powered-By`)
   - Passive probe for RFC 9116 `/.well-known/security.txt` and `robots.txt`

2. **Security-First Architecture & SSRF Defense**:
   - Comprehensive multi-layer SSRF prevention
   - Disallows loopback (`127.0.0.1`, `::1`), private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and carrier-grade NAT
   - Blocks cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`)
   - Destination IP pinning and recursive hop re-validation on every redirect
   - Strict timeout limits (8s) and decompression bounds (2MB)

3. **Transparent & Deterministic Scoring Engine**:
   - Weighted categories:
     - SSL/TLS Cryptography: **25%**
     - HTTP Security Headers: **30%**
     - Cookie Security: **15%**
     - Network & Redirects: **15%**
     - Information Disclosure: **15%**
   - Letter grades from **A+** down to **F**
   - Automatic score caps when critical findings exist
   - Disclaims 100% security guarantees (`isGuaranteedSecure: false`)

4. **Actionable Remediation Engine**:
   - 25+ built-in security rules
   - Copyable server configs: **Nginx**, **Apache**, **Caddy**, **Express/Helmet**, and **Next.js**
   - Standards mapping: OWASP Top 10, OWASP ASVS, NIST CSF, CWE, and RFCs

5. **Premium UI/UX (UI UX Pro Max)**:
   - Dark-first interface, deep midnight `#060913` with electric blue `#3B82F6` and cyan `#06B6D4`
   - Plus Jakarta Sans + JetBrains Mono typography
   - Circular posture score gauge
   - Historical scan comparison tool with side-by-side delta
   - Print/PDF export stylesheet

---

## 📦 Project Architecture

```
devsphere-security/
├── apps/
│   ├── web/               # Next.js 14 App Router, React, Tailwind CSS, Lucide
│   └── api/               # Fastify, TypeScript, Zod, OpenAPI/Swagger docs
├── packages/
│   ├── scanner-core/      # SSRF-safe fetcher, TLS inspector, Rule catalog, Scoring engine
│   └── shared/            # Shared TypeScript schemas, types, models
├── docker/
│   ├── Dockerfile.api
│   └── Dockerfile.web
├── docker-compose.yml     # PostgreSQL 16, Redis 7, API, Web
└── .github/workflows/ci.yml
```

---

## ⚡ Quickstart (Local Development)

### Prerequisites
- Node.js >= 18 (Tested on v22)
- npm >= 9

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Monorepo Packages
```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/scanner-core
```

### 3. Start API Backend (Fastify)
In terminal 1:
```bash
npm run dev --workspace=apps/api
```
- API starts at: `http://localhost:4000`
- Interactive OpenAPI / Swagger Docs: `http://localhost:4000/docs`

### 4. Start Web Application (Next.js)
In terminal 2:
```bash
npm run dev --workspace=apps/web
```
- Web Application starts at: `http://localhost:3000`

---

## 🐳 Docker Deployment

To launch the full containerized stack including PostgreSQL, Redis, Backend API, and Frontend:

```bash
docker compose up -d --build
```

Access services:
- Frontend: `http://localhost:3000`
- API & Docs: `http://localhost:4000/docs`

---

## 🧪 Automated Testing

Run the Vitest test suites:

```bash
# Test scanner core (SSRF protection, scoring, headers, URL normalization)
npm run test --workspace=packages/scanner-core

# Test API endpoints
npm run test --workspace=apps/api
```

---

## 🛡️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/scans` | Launch a new passive security scan |
| `GET` | `/api/v1/scans` | List historical scans with query/filter/sort |
| `GET` | `/api/v1/scans/:id` | Get scan progress and posture result |
| `GET` | `/api/v1/scans/:id/findings` | Retrieve actionable findings for a scan |
| `GET` | `/api/v1/scans/:id/report` | Retrieve structured report summary |
| `GET` | `/api/v1/scans/compare` | Compare two scans (`?scanA=:id&scanB=:id`) |
| `POST` | `/api/v1/scans/:id/cancel` | Cancel an active or queued scan |
| `GET` | `/api/v1/health` | Service health status and worker stats |
