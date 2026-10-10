import { describe, it, expect } from 'vitest';
import { isPrivateIp, validatePublicTarget } from '../src/ssrf-protection';

describe('SSRF & IP Restrictions', () => {
  it('should identify RFC1918 private IPv4 ranges as private', () => {
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('172.16.5.1')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
  });

  it('should identify loopback and link-local addresses as private', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true); // AWS/GCP metadata
    expect(isPrivateIp('::1')).toBe(true);
  });

  it('should permit public IPv4 addresses', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('93.184.216.34')).toBe(false); // example.com
  });

  it('should reject localhost and internal hostnames', async () => {
    const res1 = await validatePublicTarget('localhost');
    expect(res1.isAllowed).toBe(false);
    expect(res1.blockedReason).toContain('SSRF');

    const res2 = await validatePublicTarget('service.internal');
    expect(res2.isAllowed).toBe(false);

    const res3 = await validatePublicTarget('metadata.google.internal');
    expect(res3.isAllowed).toBe(false);
  });
});
