import { SecurityTxtResult } from '@devsphere/shared';
import { safeFetch } from './safe-http-client';

/**
 * RFC 9116 security.txt parser and validator
 */
export async function auditSecurityTxt(rootUrl: string): Promise<SecurityTxtResult> {
  const parsed = new URL(rootUrl);
  const candidates = [
    `${parsed.origin}/.well-known/security.txt`,
    `${parsed.origin}/security.txt`,
  ];

  for (const target of candidates) {
    try {
      const res = await safeFetch({
        url: target,
        timeoutMs: 5000,
        maxBodyBytes: 256 * 1024,
      });

      if (res.statusCode === 200 && res.body && !res.body.toLowerCase().includes('<!doctype html>')) {
        return parseSecurityTxtContent(res.body, target);
      }
    } catch {
      // Continue to fallback candidate
    }
  }

  return {
    present: false,
    rfc9116Valid: false,
    issues: ['No valid RFC 9116 security.txt discovered at /.well-known/security.txt or /security.txt.'],
  };
}

function parseSecurityTxtContent(content: string, url: string): SecurityTxtResult {
  const lines = content.split(/\r?\n/);
  const contact: string[] = [];
  const encryption: string[] = [];
  const acknowledgments: string[] = [];
  let expires: string | undefined;
  let preferredLanguages: string | undefined;
  let canonical: string | undefined;
  let policy: string | undefined;
  const issues: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    switch (field) {
      case 'contact':
        contact.push(value);
        break;
      case 'expires':
        expires = value;
        break;
      case 'encryption':
        encryption.push(value);
        break;
      case 'acknowledgments':
        acknowledgments.push(value);
        break;
      case 'preferred-languages':
        preferredLanguages = value;
        break;
      case 'canonical':
        canonical = value;
        break;
      case 'policy':
        policy = value;
        break;
    }
  }

  // RFC 9116 Validation:
  // 1. Mandatory field: Contact
  if (contact.length === 0) {
    issues.push('Missing mandatory "Contact:" directive (RFC 9116 Section 2.5.3).');
  } else {
    for (const c of contact) {
      if (!c.startsWith('mailto:') && !c.startsWith('https://') && !c.startsWith('http://') && !c.startsWith('tel:')) {
        issues.push(`Invalid Contact URI scheme in "${c}". Must begin with mailto:, https:, or tel:.`);
      }
    }
  }

  // 2. Mandatory field: Expires
  if (!expires) {
    issues.push('Missing mandatory "Expires:" directive (RFC 9116 Section 2.5.5).');
  } else {
    const expiryDate = new Date(expires);
    if (isNaN(expiryDate.getTime())) {
      issues.push(`Malformed date string in "Expires: ${expires}". Must follow RFC 3339 format.`);
    } else if (expiryDate.getTime() < Date.now()) {
      issues.push(`security.txt expired on ${expiryDate.toISOString()}. Policy must be renewed.`);
    }
  }

  const rfc9116Valid = issues.length === 0;

  return {
    present: true,
    url,
    rfc9116Valid,
    contact: contact.length > 0 ? contact : undefined,
    expires,
    encryption: encryption.length > 0 ? encryption : undefined,
    acknowledgments: acknowledgments.length > 0 ? acknowledgments : undefined,
    preferredLanguages,
    canonical,
    policy,
    rawContent: content.slice(0, 4000),
    issues,
  };
}
