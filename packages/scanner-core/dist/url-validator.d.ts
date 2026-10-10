export interface NormalizedUrlResult {
    isValid: boolean;
    normalizedUrl: string;
    hostname: string;
    protocol: 'http:' | 'https:';
    port: number;
    path: string;
    error?: string;
}
/**
 * Validates and normalizes user-provided target URLs.
 * Ensures consistent scheme, valid hostname, standard ports, and prevents malformed URLs.
 */
export declare function normalizeUrl(input: string): NormalizedUrlResult;
