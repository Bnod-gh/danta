import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class ProcedureCodesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(category?: string, search?: string) {
    const where: { isActive: boolean; category?: string; OR?: Array<Record<string, { contains: string; mode: 'insensitive' }>> } = { isActive: true };
    if (category) where.category = category;
    if (search?.trim()) {
      const contains = { contains: search.trim(), mode: 'insensitive' as const };
      where.OR = [{ code: contains }, { description: contains }];
    }
    return this.prisma.procedure_codes.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  findCategories() {
    return this.prisma.procedure_codes.groupBy({
      by: ['category'],
      _count: { _all: true },
      orderBy: { category: 'asc' },
    });
  }
}
