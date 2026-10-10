import { DomainVerificationInfo } from '@devsphere/shared';
export declare class DomainVerifier {
    private verifiedDomains;
    generateTokenForDomain(domain: string, method?: 'dns_txt' | 'meta_tag'): DomainVerificationInfo;
    verifyDomainOwnership(domain: string, method?: 'dns_txt' | 'meta_tag'): Promise<DomainVerificationInfo>;
    isVerified(domain: string): boolean;
}
export declare const domainVerifier: DomainVerifier;
