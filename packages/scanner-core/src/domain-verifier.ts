import * as dns from 'dns';
import * as cheerio from 'cheerio';
import { DomainVerificationInfo } from '@devsphere/shared';
import { safeFetch } from './safe-http-client';
import crypto from 'crypto';

export class DomainVerifier {
  private verifiedDomains: Map<string, DomainVerificationInfo> = new Map();

  public generateTokenForDomain(domain: string, method: 'dns_txt' | 'meta_tag' = 'dns_txt'): DomainVerificationInfo {
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    const existing = this.verifiedDomains.get(cleanDomain);
    if (existing) return existing;

    const token = `dvs-${crypto.createHash('sha256').update(cleanDomain + '-devsphere-salt').digest('hex').slice(0, 16)}`;
    const info: DomainVerificationInfo = {
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

  public async verifyDomainOwnership(domain: string, method?: 'dns_txt' | 'meta_tag'): Promise<DomainVerificationInfo> {
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    const info = this.generateTokenForDomain(cleanDomain, method || 'dns_txt');

    if (info.isVerified) return info;

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
    } catch {}

    // Check method 2: HTML Meta Tag
    try {
      const res = await safeFetch({
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
    } catch {}

    return info;
  }

  public isVerified(domain: string): boolean {
    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    return this.verifiedDomains.get(cleanDomain)?.isVerified ?? false;
  }
}

export const domainVerifier = new DomainVerifier();
