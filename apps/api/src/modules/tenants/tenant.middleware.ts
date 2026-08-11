import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    practiceId?: string;
    locationId?: string;
    status: string;
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const user = req.user;
    if (user) {
      const tenant = await this.prisma.organisation.findUnique({
        where: { id: user.tenantId },
      });
      if (!tenant || tenant.status === 'suspended' || tenant.status === 'deactivated') {
        throw new NotFoundException('Organisation not found or inactive');
      }
      req.user = {
        ...user,
        tenantId: tenant.id,
      };
    }
    next();
  }
}
