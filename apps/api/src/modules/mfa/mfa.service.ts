import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  async setup(userId: string, type: 'totp' | 'sms' | 'email' = 'totp') {
    const secret = crypto.randomBytes(20).toString('base32' as BufferEncoding);
    const existing = await this.prisma.mFAFactor.findFirst({ where: { userId } });
    if (existing) {
      await this.prisma.mFAFactor.update({
        where: { id: existing.id },
        data: { secret, type, verified: false },
      });
    } else {
      await this.prisma.mFAFactor.create({
        data: { userId, secret, type, verified: false },
      });
    }
    return { secret };
  }

  async verify(userId: string, code: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId } });
    if (!factor) throw new BadRequestException('MFA not set up');
    if (factor.verified) throw new BadRequestException('MFA already verified');
    const secret = factor.secret;
    const isValid = this.verifyTOTP(secret, code);
    if (!isValid) throw new UnauthorizedException('Invalid code');
    await this.prisma.mFAFactor.update({
      where: { id: factor.id },
      data: { verified: true },
    });
    return { verified: true };
  }

  async disable(userId: string, code: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId } });
    if (!factor || !factor.verified) throw new BadRequestException('MFA not enabled');
    const isValid = this.verifyTOTP(factor.secret, code);
    if (!isValid) throw new UnauthorizedException('Invalid code');
    await this.prisma.mFAFactor.delete({ where: { id: factor.id } });
    return { disabled: true };
  }

  verifyTOTP(secret: string, token: string): boolean {
    try {
      const key = this.base32Decode(secret);
      const epoch = Math.floor(Date.now() / 30000);
      for (let i = -1; i <= 1; i++) {
        const counter = BigInt(epoch + i);
        const hash = crypto.createHmac('sha1', key);
        const buf = Buffer.alloc(8);
        buf.writeBigUInt64BE(counter);
        hash.update(buf);
        const digest = hash.digest();
        const offset = digest[19] & 0x0f;
        const code = ((digest[offset] & 0x7f) << 24) |
                     ((digest[offset + 1] & 0xff) << 16) |
                     ((digest[offset + 2] & 0xff) << 8) |
                     (digest[offset + 3] & 0xff);
        const otp = (code % 1000000).toString().padStart(6, '0');
        if (otp === token) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    for (const char of encoded) {
      const idx = alphabet.indexOf(char.toUpperCase());
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }
}
