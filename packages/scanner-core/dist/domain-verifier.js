"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainVerifier = exports.DomainVerifier = void 0;
const dns = __importStar(require("dns"));
const cheerio = __importStar(require("cheerio"));
const safe_http_client_1 = require("./safe-http-client");
const crypto_1 = __importDefault(require("crypto"));
class DomainVerifier {
    verifiedDomains = new Map();
    generateTokenForDomain(domain, method = 'dns_txt') {
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
        const existing = this.verifiedDomains.get(cleanDomain);
        if (existing)
            return existing;
        const token = `dvs-${crypto_1.default.createHash('sha256').update(cleanDomain + '-devsphere-salt').digest('hex').slice(0, 16)}`;
        const info = {
            domain: cleanDomain,
            token,
            isVerified: false,
            method,
            txtRecordExpected: `devsphere-site-verification=${token}`,
            metaTagExpected: `<meta name="devsphere-verification" content="${token}">`,
        };
        this.verifiedDomains.set(cleanDomain, info);
        return info;
    }
    async verifyDomainOwnership(domain, method) {
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
        const info = this.generateTokenForDomain(cleanDomain, method || 'dns_txt');
        if (info.isVerified)
            return info;
        // Check method 1: DNS TXT
        try {
            const txtRecords = await dns.promises.resolveTxt(cleanDomain);
            for (const group of txtRecords) {
                const full = group.join('');
                if (full.includes(`devsphere-site-verification=${info.token}`)) {
                    info.isVerified = true;
                    info.verifiedAt = new Date().toISOString();
                    return info;
                }
            }
        }
        catch { }
        // Check method 2: HTML Meta Tag
        try {
            const res = await (0, safe_http_client_1.safeFetch)({
                url: `https://${cleanDomain}`,
                timeoutMs: 4000,
                allowPrivate: false,
            });
            if (res.statusCode === 200 && res.body) {
                const $ = cheerio.load(res.body);
                const metaVal = $('meta[name="devsphere-verification"]').attr('content');
                if (metaVal === info.token) {
                    info.isVerified = true;
                    info.verifiedAt = new Date().toISOString();
                    return info;
                }
            }
        }
        catch { }
        return info;
    }
    isVerified(domain) {
        const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
        return this.verifiedDomains.get(cleanDomain)?.isVerified ?? false;
    }
}
exports.DomainVerifier = DomainVerifier;
exports.domainVerifier = new DomainVerifier();
