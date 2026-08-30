import { Controller, Get, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Patch } from '@nestjs/common';
import { Request } from 'express';
import { PatientPortalService } from './patient-portal.service';
import type { PatientLogin, PatientRegister, PatientPortalProfileUpdate } from '@danta/schemas';
import { PatientJwtAuthGuard } from './guards/patient-jwt-auth.guard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PatientRequest = Request & { patient?: any };

@Controller('patient-portal')
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: PatientLogin) {
    const identifier = body.email || body.phone || '';
    if (!identifier) {
      throw new Error('Email or phone is required');
    }
    return this.patientPortalService.login(body.tenantId, identifier, body.password);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: PatientRegister) {
    return this.patientPortalService.register(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.patientPortalService.refresh(body.refreshToken);
  }

  @Get('profile')
  @UseGuards(PatientJwtAuthGuard)
  async getProfile(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getPatientProfile(patient.id, patient.tenantId);
  }

  @Get('appointments')
  @UseGuards(PatientJwtAuthGuard)
  async getAppointments(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyAppointments(patient.id, patient.tenantId);
  }

  @Get('treatment-plans')
  @UseGuards(PatientJwtAuthGuard)
  async getTreatmentPlans(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyTreatmentPlans(patient.id, patient.tenantId);
  }

  @Get('documents')
  @UseGuards(PatientJwtAuthGuard)
  async getDocuments(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyDocuments(patient.id, patient.tenantId);
  }

  @Get('invoices')
  @UseGuards(PatientJwtAuthGuard)
  async getInvoices(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyInvoices(patient.id, patient.tenantId);
  }

  @Get('payments')
  @UseGuards(PatientJwtAuthGuard)
  async getPayments(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyPayments(patient.id, patient.tenantId);
  }

  @Get('messages')
  @UseGuards(PatientJwtAuthGuard)
  async getMessages(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyMessages(patient.id, patient.tenantId);
  }

  @Get('notifications')
  @UseGuards(PatientJwtAuthGuard)
  async getNotifications(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyNotifications(patient.id, patient.tenantId);
  }

  @Get('forms')
  @UseGuards(PatientJwtAuthGuard)
  async getForms(@Req() req: PatientRequest) {
    const patient = req.patient;
    return this.patientPortalService.getMyForms(patient.id, patient.tenantId);
  }

  @Patch('profile')
  @UseGuards(PatientJwtAuthGuard)
  async updateProfile(@Req() req: PatientRequest, @Body() body: PatientPortalProfileUpdate) {
    const patient = req.patient;
    return this.patientPortalService.updatePatientProfile(patient.id, patient.tenantId, body);
  }
}
