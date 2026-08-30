import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { PatientRegister, PatientPortalToken, PatientPortalProfileUpdate } from '@danta/schemas';
import { ConfigService } from '@nestjs/config';

export interface PatientJwtPayload {
  sub: string;
  email: string;
  phone: string;
  tenantId: string;
  patientNumber: string;
}

@Injectable()
export class PatientPortalService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService, private readonly auditService: AuditService) {}

  async validatePatient(tenantId: string, identifier: string, password: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        tenantId,
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
        passwordHash: { not: null },
      },
    });
    if (!patient || !patient.passwordHash) return null;
    const valid = await bcrypt.compare(password, patient.passwordHash);
    if (!valid) return null;
    return patient;
  }

  async login(tenantId: string, identifier: string, password: string) {
    const tenant = await this.prisma.organisation.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant');
    }

    const patient = await this.validatePatient(tenantId, identifier, password);
    if (!patient) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: PatientJwtPayload = {
      sub: patient.id,
      email: patient.email || '',
      phone: patient.phone || '',
      tenantId: patient.tenantId,
      patientNumber: patient.patientNumber,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.auditService.log({
      tenantId: patient.tenantId,
      userId: patient.id,
      action: 'patient_portal.login',
      resourceType: 'patient',
      resourceId: patient.id,
      result: 'success',
    });

    return {
      accessToken,
      refreshToken,
      patient: {
        id: patient.id,
        tenantId: patient.tenantId,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        preferredName: patient.preferredName,
        email: patient.email,
        phone: patient.phone,
      },
    } as PatientPortalToken;
  }

  async register(data: PatientRegister) {
    const { tenantId, email, phone, password, dateOfBirth } = data;

    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const tenant = await this.prisma.organisation.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== 'active') {
      throw new Error('Invalid or inactive tenant');
    }

    const identifier = email || phone;
    if (!identifier) {
      throw new Error('Email or phone is required');
    }

    const existing = await this.prisma.patient.findFirst({
      where: {
        tenantId,
        OR: [{ email }, { phone }],
      },
      select: {
        id: true,
        tenantId: true,
        status: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        passwordHash: true,
      },
    });

    if (!existing) {
      throw new Error('Patient record not found. Please contact your practice to set up your account.');
    }

    if (existing.status !== 'active') {
      throw new Error('Patient account is not active');
    }

    if (existing.passwordHash) {
      throw new Error('Patient account already has a password. Use login instead.');
    }

    if (existing.dateOfBirth && existing.dateOfBirth.toISOString().split('T')[0] !== new Date(dateOfBirth).toISOString().split('T')[0]) {
      throw new Error('Date of birth verification failed');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const patient = await this.prisma.patient.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        firstName: existing.firstName,
        lastName: existing.lastName,
        dateOfBirth: existing.dateOfBirth,
      },
      select: {
        id: true,
        tenantId: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        email: true,
        phone: true,
      },
    });

    const payload: PatientJwtPayload = {
      sub: patient.id,
      email: patient.email || '',
      phone: patient.phone || '',
      tenantId: patient.tenantId,
      patientNumber: patient.patientNumber,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
    });

    await this.auditService.log({
      tenantId: patient.tenantId,
      userId: patient.id,
      action: 'patient_portal.register',
      resourceType: 'patient',
      resourceId: patient.id,
      result: 'success',
      metadata: { method: identifier },
    });

    return {
      accessToken,
      refreshToken,
      patient: {
        id: patient.id,
        tenantId: patient.tenantId,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        preferredName: patient.preferredName,
        email: patient.email,
        phone: patient.phone,
      },
    } as PatientPortalToken;
  }

  async refresh(refreshToken: string): Promise<PatientPortalToken> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as PatientJwtPayload;

      const patient = await this.prisma.patient.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          phone: true,
          tenantId: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          preferredName: true,
          status: true,
        },
      });

      if (!patient || patient.status !== 'active') {
        throw new UnauthorizedException('Patient not found or inactive');
      }

      const newPayload: PatientJwtPayload = {
        sub: patient.id,
        email: patient.email || '',
        phone: patient.phone || '',
        tenantId: patient.tenantId,
        patientNumber: patient.patientNumber,
      };

      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY') as any,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        patient: {
          id: patient.id,
          tenantId: patient.tenantId,
          patientNumber: patient.patientNumber,
          firstName: patient.firstName,
          lastName: patient.lastName,
          preferredName: patient.preferredName,
          email: patient.email,
          phone: patient.phone,
        },
      } as PatientPortalToken;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getPatientProfile(patientId: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        preferredName: true,
        dateOfBirth: true,
        gender: true,
        email: true,
        phone: true,
        status: true,
        addresses: true,
        contacts: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async getMyAppointments(patientId: string, tenantId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId, tenantId },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true } },
        appointmentType: { select: { id: true, name: true, duration: true } },
        chair: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    return appointments;
  }

  async getMyTreatmentPlans(patientId: string, tenantId: string) {
    const plans = await this.prisma.treatmentPlan.findMany({
      where: { patientId, tenantId },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return plans;
  }

  async getMyDocuments(patientId: string, tenantId: string) {
    const documents = await this.prisma.patientDocument.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return documents;
  }

  async getMyInvoices(patientId: string, tenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId, tenantId },
      include: {
        items: true,
      },
      orderBy: { issueDate: 'desc' },
    });
    return invoices;
  }

  async getMyPayments(patientId: string, tenantId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { patientId, tenantId },
      orderBy: { receivedAt: 'desc' },
    });
    return payments;
  }

  async getMyMessages(patientId: string, tenantId: string) {
    const messages = await this.prisma.message.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return messages;
  }

  async getMyNotifications(patientId: string, tenantId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return notifications;
  }

  async getMyForms(patientId: string, tenantId: string) {
    const forms = await this.prisma.patientForm.findMany({
      where: { patientId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return forms;
  }

  async updatePatientProfile(patientId: string, tenantId: string, data: PatientPortalProfileUpdate) {
    const existing = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!existing) throw new Error('Patient not found');
    const protectedFields = ['tenantId', 'status', 'passwordHash'];
    const rawData = data as Record<string, unknown>;
    for (const field of protectedFields) {
      if (field in rawData) throw new Error(`Cannot update protected field: ${field}`);
    }
    return this.prisma.patient.update({ where: { id: patientId }, data });
  }

}