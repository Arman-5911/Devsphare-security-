export interface SsrfValidationResult {
    isAllowed: boolean;
    resolvedIps: string[];
    blockedReason?: string;
}
/**
 * Checks if a single IP address (IPv4 or IPv6) belongs to a private, loopback,
 * link-local, carrier-grade NAT, or cloud metadata network.
 */
export declare function isPrivateIp(ipString: string): boolean;
/**
 * Validates a target hostname against SSRF, internal network traversal,
 * and cloud metadata exfiltration rules. Resolves DNS records and verifies every IP.
 */
export declare function validatePublicTarget(hostname: string, allowPrivate?: boolean): Promise<SsrfValidationResult>;
/**
 * Resolves both IPv4 and IPv6 addresses for a hostname using system DNS.
 * Combines c-ares with OS getaddrinfo (dns.lookup) fallback for maximum reliability.
 */
export declare function resolveAllIps(hostname: string): Promise<string[]>;
