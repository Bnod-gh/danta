import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

function base32Decode(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of value.replace(/=+$/, '').toUpperCase()) bits += alphabet.indexOf(char).toString(2).padStart(5, '0');
  return Buffer.from(bits.match(/.{8}/g)?.map((byte) => parseInt(byte, 2)) ?? []);
}

function generateTotp(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(code % 1_000_000).padStart(6, '0');
}

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  generateSecret(): string {
    return crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/gi, '').slice(0, 32).toUpperCase();
  }

  generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () => crypto.randomInt(100000, 1000000).toString());
  }

  hashBackupCode(code: string): string {
    return bcrypt.hashSync(code, 12);
  }

  verifyTOTP(secret: string, token: string): boolean {
    const counter = Math.floor(Date.now() / 1000 / 30);
    return [-1, 0, 1].some((offset) => generateTotp(secret, counter + offset) === token);
  }

  async setup(_userId: string) {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const existing = await this.prisma.mFAFactor.findFirst({ where: { userId: _userId } });
    const data = { secret, type: 'totp' as const, verified: false, backupCodes: backupCodes.map((code) => this.hashBackupCode(code)) };
    if (existing) await this.prisma.mFAFactor.update({ where: { id: existing.id }, data });
    else await this.prisma.mFAFactor.create({ data: { userId: _userId, ...data } });
    return { secret, backupCodes };
  }

  async verify(userId: string, code: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId } });
    if (!factor) throw new BadRequestException('MFA not set up');
    if (!this.verifyTOTP(factor.secret, code)) throw new UnauthorizedException('Invalid code');
    await this.prisma.mFAFactor.update({ where: { id: factor.id }, data: { verified: true } });
    return { verified: true };
  }

  async disable(userId: string, code: string) {
    const factor = await this.prisma.mFAFactor.findFirst({ where: { userId, verified: true } });
    if (!factor) throw new BadRequestException('MFA not enabled');
    if (!this.verifyTOTP(factor.secret, code)) throw new UnauthorizedException('Invalid code');
    await this.prisma.mFAFactor.delete({ where: { id: factor.id } });
    return { disabled: true };
  }
}
