import * as ipaddr from 'ipaddr.js';

export function isIpInCidrs(ip: string, cidrs: string[]): boolean {
  try {
    const parsed = ipaddr.parse(ip);
    return cidrs.some((cidr) => {
      const [range, prefixLengthStr] = cidr.split('/');
      if (!prefixLengthStr) return false;
      const prefixLength = parseInt(prefixLengthStr, 10);
      const rangeAddr = ipaddr.parse(range);
      return parsed.match(rangeAddr, prefixLength);
    });
  } catch {
    return false;
  }
}

export function validateCidr(cidr: string): boolean {
  try {
    const [range, prefixLengthStr] = cidr.split('/');
    if (!prefixLengthStr) return false;
    const prefixLength = parseInt(prefixLengthStr, 10);
    if (Number.isNaN(prefixLength)) return false;
    ipaddr.parse(range);
    return true;
  } catch {
    return false;
  }
}

export function validateIpAllowlist(allowlist: unknown): string[] {
  if (!Array.isArray(allowlist)) {
    throw new Error('ipAllowlist must be an array of CIDR strings');
  }

  const cidrs: string[] = [];
  for (const entry of allowlist) {
    if (typeof entry !== 'string') {
      throw new Error('ipAllowlist entries must be strings');
    }
    if (!validateCidr(entry)) {
      throw new Error(`Invalid CIDR: ${entry}`);
    }
    cidrs.push(entry);
  }

  return cidrs;
}
