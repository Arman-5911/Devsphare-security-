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
export function normalizeUrl(input: string): NormalizedUrlResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalizedUrl: '',
      hostname: '',
      protocol: 'https:',
      port: 443,
      path: '/',
      error: 'URL cannot be empty',
    };
  }

  let cleaned = input.trim();

  // If explicit scheme is provided, verify it is http or https
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(cleaned)) {
    if (!/^https?:\/\//i.test(cleaned)) {
      const scheme = cleaned.split('://')[0];
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        protocol: 'https:',
        port: 443,
        path: '/',
        error: `Unsupported protocol "${scheme}:". Only HTTP and HTTPS are permitted.`,
      };
    }
  } else {
    // No scheme provided, default to https://
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);

    // Only allow http and https schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        protocol: 'https:',
        port: 443,
        path: '/',
        error: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check for empty hostname, invalid characters, or missing domain extension
    if (
      !hostname ||
      hostname.length === 0 ||
      hostname.includes(' ') ||
      (!hostname.includes('.') && hostname !== 'localhost')
    ) {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        protocol: parsed.protocol as 'http:' | 'https:',
        port: parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80,
        path: '/',
        error: 'Invalid hostname provided. Must be a valid domain or IP address.',
      };
    }

    // Default ports
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : parsed.protocol === 'https:'
      ? 443
      : 80;

    if (isNaN(port) || port < 1 || port > 65535) {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname,
        protocol: parsed.protocol as 'http:' | 'https:',
        port: 443,
        path: '/',
        error: 'Invalid port number.',
      };
    }

    // Reconstruct canonical clean URL (strip user credentials and fragment)
    const normalizedUrl = `${parsed.protocol}//${hostname}${
      (parsed.protocol === 'https:' && port === 443) ||
      (parsed.protocol === 'http:' && port === 80)
        ? ''
        : `:${port}`
    }${parsed.pathname || '/'}${parsed.search || ''}`;

    return {
      isValid: true,
      normalizedUrl,
      hostname,
      protocol: parsed.protocol as 'http:' | 'https:',
      port,
      path: parsed.pathname || '/',
    };
  } catch (err: any) {
    return {
      isValid: false,
      normalizedUrl: '',
      hostname: '',
      protocol: 'https:',
      port: 443,
      path: '/',
      error: `URL parsing failed: ${err.message}`,
    };
  }
}
