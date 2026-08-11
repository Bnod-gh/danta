import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma.service';
import { PatientRegister, PatientPortalToken } from '@danta/schemas';
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
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

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
    const passwordHash = await bcrypt.hash(data.password, 12);
    const patientNumber = `P${Date.now().toString().slice(-8)}`;
    const patient = await this.prisma.patient.create({
      data: {
        tenantId: data.tenantId,
        patientNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        email: data.email,
        phone: data.phone,
        passwordHash,
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
}
