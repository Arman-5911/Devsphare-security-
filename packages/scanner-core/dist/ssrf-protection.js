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
exports.isPrivateIp = isPrivateIp;
exports.validatePublicTarget = validatePublicTarget;
exports.resolveAllIps = resolveAllIps;
const dns = __importStar(require("dns"));
const ipaddr_js_1 = __importDefault(require("ipaddr.js"));
// Hostnames that should never be scanned under passive public policy
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    '127.0.0.1',
    '::1',
    'metadata.google.internal',
    'instance-data',
    '169.254.169.254',
    'metadata',
]);
const BLOCKED_SUFFIXES = [
    '.local',
    '.internal',
    '.lan',
    '.home.arpa',
    '.corp',
    '.intranet',
    '.priv',
    '.test',
    '.example',
    '.invalid',
    '.localhost',
];
/**
 * Checks if a single IP address (IPv4 or IPv6) belongs to a private, loopback,
 * link-local, carrier-grade NAT, or cloud metadata network.
 */
function isPrivateIp(ipString) {
    try {
        const addr = ipaddr_js_1.default.parse(ipString);
        const range = addr.range();
        // In ipaddr.js:
        // IPv4 ranges: 'unicast', 'unspecified', 'broadcast', 'multicast', 'linkLocal', 'loopback', 'carrierGradeNat', 'private', 'reserved'
        // IPv6 ranges: 'unicast', 'unspecified', 'linkLocal', 'multicast', 'loopback', 'uniqueLocal', 'ipv4Mapped', 'rfc6145', 'rfc6052', '6to4', 'teredo', 'reserved'
        if (addr.kind() === 'ipv4') {
            const blockedRanges = [
                'unspecified',
                'broadcast',
                'multicast',
                'linkLocal',
                'loopback',
                'carrierGradeNat',
                'private',
                'reserved',
            ];
            if (blockedRanges.includes(range)) {
                return true;
            }
            // Check specific cloud metadata 169.254.169.254
            const octets = addr.octets;
            if (octets[0] === 169 && octets[1] === 254)
                return true;
            if (octets[0] === 127)
                return true;
            if (octets[0] === 10)
                return true;
            if (octets[0] === 192 && octets[1] === 168)
                return true;
            if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
                return true;
            if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
                return true;
            if (octets[0] === 0)
                return true;
        }
        else if (addr.kind() === 'ipv6') {
            const ipv6 = addr;
            if (ipv6.isIPv4MappedAddress()) {
                const mappedIpv4 = ipv6.toIPv4Address();
                return isPrivateIp(mappedIpv4.toString());
            }
            const blockedRanges = [
                'unspecified',
                'linkLocal',
                'multicast',
                'loopback',
                'uniqueLocal',
                'reserved',
            ];
            if (blockedRanges.includes(range)) {
                return true;
            }
        }
        return false;
    }
    catch {
        // If it cannot be parsed as a valid IP, treat with caution
        return true;
    }
}
/**
 * Validates a target hostname against SSRF, internal network traversal,
 * and cloud metadata exfiltration rules. Resolves DNS records and verifies every IP.
 */
async function validatePublicTarget(hostname, allowPrivate = false) {
    const lowerHost = hostname.toLowerCase();
    // If allowPrivate is explicitly enabled (e.g. In authorized test environment), skip restriction
    if (allowPrivate) {
        return { isAllowed: true, resolvedIps: ['127.0.0.1'] };
    }
    // 1. Direct blocked hostname check
    if (BLOCKED_HOSTNAMES.has(lowerHost)) {
        return {
            isAllowed: false,
            resolvedIps: [],
            blockedReason: `Scanning of internal/loopback host "${hostname}" is prohibited by SSRF security policy.`,
        };
    }
    // 2. Blocked suffix check (.local, .internal, etc.)
    for (const suffix of BLOCKED_SUFFIXES) {
        if (lowerHost.endsWith(suffix)) {
            return {
                isAllowed: false,
                resolvedIps: [],
                blockedReason: `Domain "${hostname}" matches restricted internal suffix "${suffix}".`,
            };
        }
    }
    // 3. Direct IP format check (e.g. User entered 127.0.0.1 or 192.168.1.1 or 169.254.169.254)
    if (ipaddr_js_1.default.isValid(lowerHost)) {
        if (isPrivateIp(lowerHost)) {
            return {
                isAllowed: false,
                resolvedIps: [lowerHost],
                blockedReason: `Target IP ${hostname} is in a reserved/private/link-local address range.`,
            };
        }
        return { isAllowed: true, resolvedIps: [lowerHost] };
    }
    // 4. DNS resolution and check each resolved address
    try {
        const addresses = await resolveAllIps(lowerHost);
        if (!addresses || addresses.length === 0) {
            return {
                isAllowed: false,
                resolvedIps: [],
                blockedReason: `DNS resolution failed: No A or AAAA records found for "${hostname}".`,
            };
        }
        for (const ip of addresses) {
            if (isPrivateIp(ip)) {
                return {
                    isAllowed: false,
                    resolvedIps: addresses,
                    blockedReason: `SSRF Violation: Hostname "${hostname}" resolved to restricted IP address "${ip}".`,
                };
            }
        }
        return {
            isAllowed: true,
            resolvedIps: addresses,
        };
    }
    catch (err) {
        return {
            isAllowed: false,
            resolvedIps: [],
            blockedReason: `DNS lookup failed for "${hostname}": ${err.message}`,
        };
    }
}
// Ensure resilient DNS resolution across OS environments (especially Windows)
try {
    const currentServers = dns.getServers();
    if (!currentServers || currentServers.length === 0 || currentServers[0] === '127.0.0.1') {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }
}
catch { }
/**
 * Resolves both IPv4 and IPv6 addresses for a hostname using system DNS.
 * Combines c-ares with OS getaddrinfo (dns.lookup) fallback for maximum reliability.
 */
async function resolveAllIps(hostname) {
    const ips = [];
    // Tier 1: Try OS getaddrinfo
    try {
        const lookupResults = await dns.promises.lookup(hostname, { all: true });
        for (const res of lookupResults) {
            if (res && res.address) {
                ips.push(res.address);
            }
        }
    }
    catch { }
    // Tier 2: Try resolve4 / resolve6 if lookup was empty
    if (ips.length === 0) {
        try {
            const aRecords = await dns.promises.resolve4(hostname);
            ips.push(...aRecords);
        }
        catch { }
        try {
            const aaaaRecords = await dns.promises.resolve6(hostname);
            ips.push(...aaaaRecords);
        }
        catch { }
    }
    return Array.from(new Set(ips));
}
