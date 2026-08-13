import { isIpInCidrs, validateCidr, validateIpAllowlist } from './ip-allowlist.util';

describe('ip-allowlist.util', () => {
  describe('isIpInCidrs', () => {
    it('should return true for exact IP match', () => {
      expect(isIpInCidrs('192.168.1.10', ['192.168.1.10/32'])).toBe(true);
    });

    it('should return true for IP within CIDR range', () => {
      expect(isIpInCidrs('192.168.1.50', ['192.168.1.0/24'])).toBe(true);
    });

    it('should return false for IP outside CIDR range', () => {
      expect(isIpInCidrs('192.168.2.10', ['192.168.1.0/24'])).toBe(false);
    });

    it('should return false for invalid IP', () => {
      expect(isIpInCidrs('not-an-ip', ['192.168.1.0/24'])).toBe(false);
    });

    it('should handle multiple CIDRs', () => {
      expect(isIpInCidrs('10.0.0.5', ['192.168.1.0/24', '10.0.0.0/8'])).toBe(true);
    });

    it('should handle IPv6', () => {
      expect(isIpInCidrs('2001:db8::1', ['2001:db8::/32'])).toBe(true);
    });

    it('should return false for empty CIDR list', () => {
      expect(isIpInCidrs('192.168.1.1', [])).toBe(false);
    });
  });

  describe('validateCidr', () => {
    it('should return true for valid IPv4 CIDR', () => {
      expect(validateCidr('192.168.1.0/24')).toBe(true);
    });

    it('should return true for valid IPv6 CIDR', () => {
      expect(validateCidr('2001:db8::/32')).toBe(true);
    });

    it('should return false for missing prefix length', () => {
      expect(validateCidr('192.168.1.0')).toBe(false);
    });

    it('should return false for invalid IP', () => {
      expect(validateCidr('not-an-ip/24')).toBe(false);
    });

    it('should return false for non-numeric prefix length', () => {
      expect(validateCidr('192.168.1.0/abc')).toBe(false);
    });
  });

  describe('validateIpAllowlist', () => {
    it('should return validated CIDRs for valid input', () => {
      expect(validateIpAllowlist(['192.168.1.0/24', '10.0.0.0/8'])).toEqual(['192.168.1.0/24', '10.0.0.0/8']);
    });

    it('should throw for non-array input', () => {
      expect(() => validateIpAllowlist('192.168.1.0/24' as any)).toThrow('ipAllowlist must be an array of CIDR strings');
    });

    it('should throw for non-string entries', () => {
      expect(() => validateIpAllowlist([192.168] as any)).toThrow('ipAllowlist entries must be strings');
    });

    it('should throw for invalid CIDR', () => {
      expect(() => validateIpAllowlist(['invalid-cidr'])).toThrow('Invalid CIDR: invalid-cidr');
    });
  });
});
