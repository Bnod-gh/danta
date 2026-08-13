import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { env } from '@danta/config';
import { ApiKeyAuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { isIpInCidrs } from '../utils/ip-allowlist.util';

@Injectable()
export class ApiKeyIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as ApiKeyAuthenticatedUser | undefined;

    if (!user || user.type !== 'api-key') {
      return true;
    }

    const ipAllowlist = user.ipAllowlist;

    if (ipAllowlist == null) {
      return true;
    }

    if (!Array.isArray(ipAllowlist) || ipAllowlist.length === 0) {
      throw new ForbiddenException('API key IP allowlist is empty');
    }

    const clientIp = this.getClientIp(request);

    if (!isIpInCidrs(clientIp, ipAllowlist)) {
      throw new ForbiddenException('IP address not allowed for this API key');
    }

    return true;
  }

  private getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = (xForwardedFor as string).split(',').map((ip) => ip.trim());
      const clientIp = ips[0];
      const lastHop = ips[ips.length - 1];

      if (this.isTrustedProxy(lastHop)) {
        return clientIp;
      }
    }

    return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }

  private isTrustedProxy(ip: string): boolean {
    return isIpInCidrs(ip, env.trustedProxies);
  }
}
