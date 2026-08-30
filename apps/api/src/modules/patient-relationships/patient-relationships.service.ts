import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreatePatientRelationship,
  UpdatePatientRelationship,
  INVERSE_RELATIONSHIP_TYPE,
  describeRelationship,
  PatientRelationshipType,
} from '@danta/schemas';

const RELATION_SELECT = {
  id: true,
  tenantId: true,
  patientId: true,
  relatedPatientId: true,
  type: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class PatientRelationshipsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async list(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const rows = await this.prisma.patient_relationships.findMany({
      where: { tenantId, OR: [{ patientId }, { relatedPatientId: patientId }] },
      orderBy: { createdAt: 'desc' },
    });

    const otherIds = Array.from(new Set(rows.map((row) => (row.patientId === patientId ? row.relatedPatientId : row.patientId))));
    const others = await this.prisma.patient.findMany({
      where: { id: { in: otherIds }, tenantId },
      select: { id: true, firstName: true, lastName: true, patientNumber: true },
    });
    const otherMap = new Map(others.map((entry) => [entry.id, entry]));

    return rows.map((row) => {
      // Row semantics: relatedPatient is `type` of patient. When viewing the
      // other side, derive the inverse label at read time.
      const forward = row.patientId === patientId;
      const effectiveType = (forward ? row.type : INVERSE_RELATIONSHIP_TYPE[row.type]) as PatientRelationshipType;
      const otherId = forward ? row.relatedPatientId : row.patientId;
      const other = otherMap.get(otherId) ?? { id: otherId, firstName: '', lastName: '', patientNumber: '' };

      return {
        ...row,
        inverseType: INVERSE_RELATIONSHIP_TYPE[effectiveType],
        relationshipLabel: describeRelationship(effectiveType),
        relatedPatient: other,
      };
    });
  }

  async create(tenantId: string, userId: string, patientId: string, data: CreatePatientRelationship) {
    if (data.relatedPatientId === patientId) {
      throw new BadRequestException('A patient cannot be related to themselves');
    }

    const [patient, related] = await Promise.all([
      this.prisma.patient.findFirst({ where: { id: patientId, tenantId } }),
      this.prisma.patient.findFirst({ where: { id: data.relatedPatientId, tenantId } }),
    ]);
    if (!patient) throw new NotFoundException('Patient not found');
    if (!related) throw new NotFoundException('Related patient not found');

    const duplicate = await this.prisma.patient_relationships.findFirst({
      where: {
        tenantId,
        OR: [
          { patientId, relatedPatientId: data.relatedPatientId },
          { patientId: data.relatedPatientId, relatedPatientId: patientId },
        ],
      },
    });
    if (duplicate) {
      throw new BadRequestException('A relationship between these patients already exists');
    }

    const row = await this.prisma.patient_relationships.create({
      data: { tenantId, patientId, relatedPatientId: data.relatedPatientId, type: data.type, notes: data.notes },
      select: RELATION_SELECT,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-relationship.create',
      resourceType: 'patient-relationship',
      resourceId: row.id,
      result: 'success',
    });

    return row;
  }

  async update(tenantId: string, userId: string, patientId: string, relationshipId: string, data: UpdatePatientRelationship) {
    const existing = await this.getScoped(tenantId, patientId, relationshipId);

    const updated = await this.prisma.patient_relationships.update({
      where: { id: existing.id },
      data,
      select: RELATION_SELECT,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-relationship.update',
      resourceType: 'patient-relationship',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, userId: string, patientId: string, relationshipId: string) {
    const existing = await this.getScoped(tenantId, patientId, relationshipId);

    await this.prisma.patient_relationships.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-relationship.delete',
      resourceType: 'patient-relationship',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }

  /// Row must belong to the URL patient on either side (DentalPin tenancy rule).
  private async getScoped(tenantId: string, patientId: string, relationshipId: string) {
    const row = await this.prisma.patient_relationships.findFirst({
      where: {
        id: relationshipId,
        tenantId,
        OR: [{ patientId }, { relatedPatientId: patientId }],
      },
    });
    if (!row) throw new NotFoundException('Relationship not found');
    return row;
  }
}
