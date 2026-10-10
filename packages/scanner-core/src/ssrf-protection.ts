import * as dns from 'dns';
import ipaddr from 'ipaddr.js';

export interface SsrfValidationResult {
  isAllowed: boolean;
  resolvedIps: string[];
  blockedReason?: string;
}

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
export function isPrivateIp(ipString: string): boolean {
  try {
    const addr = ipaddr.parse(ipString);
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
      const octets = (addr as ipaddr.IPv4).octets;
      if (octets[0] === 169 && octets[1] === 254) return true;
      if (octets[0] === 127) return true;
      if (octets[0] === 10) return true;
      if (octets[0] === 192 && octets[1] === 168) return true;
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
      if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) return true;
      if (octets[0] === 0) return true;
    } else if (addr.kind() === 'ipv6') {
      const ipv6 = addr as ipaddr.IPv6;
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
  } catch {
    // If it cannot be parsed as a valid IP, treat with caution
    return true;
  }
}

/**
 * Validates a target hostname against SSRF, internal network traversal,
 * and cloud metadata exfiltration rules. Resolves DNS records and verifies every IP.
 */
export async function validatePublicTarget(
  hostname: string,
  allowPrivate = false
): Promise<SsrfValidationResult> {
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
  if (ipaddr.isValid(lowerHost)) {
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
  } catch (err: any) {
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
} catch {}

/**
 * Resolves both IPv4 and IPv6 addresses for a hostname using system DNS.
 * Combines c-ares with OS getaddrinfo (dns.lookup) fallback for maximum reliability.
 */
export async function resolveAllIps(hostname: string): Promise<string[]> {
  const ips: string[] = [];

  // Tier 1: Try OS getaddrinfo
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });
    for (const res of lookupResults) {
      if (res && res.address) {
        ips.push(res.address);
      }
    }
  } catch {}

  // Tier 2: Try resolve4 / resolve6 if lookup was empty
  if (ips.length === 0) {
    try {
      const aRecords = await dns.promises.resolve4(hostname);
      ips.push(...aRecords);
    } catch {}

    try {
      const aaaaRecords = await dns.promises.resolve6(hostname);
      ips.push(...aaaaRecords);
    } catch {}
  }

  return Array.from(new Set(ips));
}
