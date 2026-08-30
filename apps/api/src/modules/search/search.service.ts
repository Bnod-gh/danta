import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SearchResults } from '@danta/schemas';
import { resolveUserPermissions } from '../../common/utils/user-permissions';

const EMPTY_RESULTS: SearchResults = { patients: [], providers: [], services: [], appointmentTypes: [] };

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(tenantId: string, userId: string, role: string, term: string): Promise<SearchResults> {
    const q = (term ?? '').trim();
    if (q.length === 0) return EMPTY_RESULTS;

    const permissions = new Set(await resolveUserPermissions(this.prisma, userId, role));
    const contains = { contains: q, mode: 'insensitive' as const };

    const [patients, providers, services, appointmentTypes] = await Promise.all([
      permissions.has('patient:read')
        ? this.prisma.patient.findMany({
            where: {
              tenantId,
              OR: [
                { firstName: contains },
                { lastName: contains },
                { email: contains },
                { phone: contains },
                { patientNumber: contains },
              ],
            },
            select: { id: true, firstName: true, lastName: true, patientNumber: true, email: true, phone: true },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
            take: 6,
          })
        : Promise.resolve([]),
      permissions.has('schedule:read')
        ? this.prisma.provider.findMany({
            where: {
              tenantId,
              isActive: true,
              OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
            },
            select: { id: true, firstName: true, lastName: true, email: true },
            take: 5,
          })
        : Promise.resolve([]),
      permissions.has('billing:read')
        ? this.prisma.service.findMany({
            where: {
              tenantId,
              isActive: true,
              OR: [{ name: contains }, { code: contains }, { category: contains }],
            },
            select: { id: true, name: true, code: true, category: true },
            take: 5,
          })
        : Promise.resolve([]),
      permissions.has('schedule:read')
        ? this.prisma.appointmentType.findMany({
            where: {
              tenantId,
              isActive: true,
              OR: [{ name: contains }, { code: contains }],
            },
            select: { id: true, name: true, code: true, duration: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    return { patients, providers, services, appointmentTypes };
  }
}

