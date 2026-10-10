import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../src/url-validator';

describe('URL Validator & Normalizer', () => {
  it('should accept valid https URLs', () => {
    const res = normalizeUrl('https://example.com/test');
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com/test');
    expect(res.hostname).toBe('example.com');
    expect(res.port).toBe(443);
  });

  it('should add https:// prefix if protocol is omitted', () => {
    const res = normalizeUrl('example.com/path');
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com/path');
    expect(res.hostname).toBe('example.com');
  });

  it('should reject ftp or file schemes', () => {
    const res = normalizeUrl('ftp://example.com/file.txt');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unsupported protocol');
  });

  it('should strip credentials and fragments', () => {
    const res = normalizeUrl('https://user:pass@example.com:443/login#section');
    expect(res.isValid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com/login');
  });

  it('should reject empty or malformed strings', () => {
    expect(normalizeUrl('').isValid).toBe(false);
    expect(normalizeUrl('     ').isValid).toBe(false);
  });
});
