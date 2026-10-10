import { UrlPreflightValidationResult } from '@devsphere/shared';
/**
 * Intelligent URL Validation & Reachability Preflight Engine for CyberLab V3
 * Handles all network, TLS, DNS, parking, and HTTP reachability states.
 */
export declare function validateAndPreflightUrl(rawInput: string): Promise<UrlPreflightValidationResult>;
