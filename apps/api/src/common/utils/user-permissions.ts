import { PrismaService } from '../../prisma.service';
import { DEFAULT_PERMISSIONS } from '../constants/roles';

export async function resolveUserPermissions(prisma: PrismaService, userId: string, role: string): Promise<string[]> {
  const rows = await prisma.permission.findMany({
    where: {
      roles: {
        some: {
          role: {
            assignments: {
              some: { userId },
            },
          },
        },
      },
    },
    select: { resource: true, action: true },
  });

  if (rows.length > 0) return rows.map((p) => `${p.resource}:${p.action}`);

  const defaults = DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] ?? [];
  return (defaults as Array<{ resource: string; action: string }>).map((p) => `${p.resource}:${p.action}`);
}
