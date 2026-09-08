import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { MfaModule } from './modules/mfa/mfa.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { SettingsModule } from './modules/settings/settings.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PatientContactsModule } from './modules/patient-contacts/patient-contacts.module';
import { PatientMedicalHistoryModule } from './modules/patient-medical-history/patient-medical-history.module';
import { PatientAllergiesModule } from './modules/patient-allergies/patient-allergies.module';
import { PatientMedicationsModule } from './modules/patient-medications/patient-medications.module';
import { PatientAlertsModule } from './modules/patient-alerts/patient-alerts.module';
import { PatientConsentModule } from './modules/patient-consent/patient-consent.module';
import { PatientDocumentsModule } from './modules/patient-documents/patient-documents.module';
import { PatientFormsModule } from './modules/patient-forms/patient-forms.module';
import { PatientClinicalModule } from './modules/patient-clinical/patient-clinical.module';
import { AppointmentTypesModule } from './modules/appointment-types/appointment-types.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { ChairsModule } from './modules/chairs/chairs.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicalNotesModule } from './modules/clinical-notes/clinical-notes.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { DentalChartsModule } from './modules/dental-charts/dental-charts.module';
import { ToothConditionsModule } from './modules/tooth-conditions/tooth-conditions.module';
import { ToothConditionConfigsModule } from './modules/tooth-condition-configs/tooth-condition-configs.module';
import { TreatmentHistoryModule } from './modules/treatment-history/treatment-history.module';
import { ProcedureCodesModule } from './modules/procedure-codes/procedure-codes.module';
import { TreatmentPlansModule } from './modules/treatment-plans/treatment-plans.module';
import { PeriodontalRecordsModule } from './modules/periodontal-records/periodontal-records.module';
import { ImagingStudiesModule } from './modules/imaging-studies/imaging-studies.module';
import { ImagingImagesModule } from './modules/imaging-images/imaging-images.module';
import { ImagingIntegrationsModule } from './modules/imaging-integrations/imaging-integrations.module';
import { ClaimIntegrationsModule } from './modules/claim-integrations/claim-integrations.module';
import { ServicesModule } from './modules/services/services.module';
import { FeesModule } from './modules/fees/fees.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { StatementsModule } from './modules/statements/statements.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { CommunicationTemplatesModule } from './modules/communication-templates/communication-templates.module';
import { CommunicationPreferencesModule } from './modules/communication-preferences/communication-preferences.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { RecallsModule } from './modules/recalls/recalls.module';
import { AppointmentRemindersModule } from './modules/appointment-reminders/appointment-reminders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PatientPortalModule } from './modules/patient-portal/patient-portal.module';
import { ImagingTwainModule } from './modules/imaging-twain/imaging-twain.module';
import { ClinicalModulesModule } from './modules/clinical-modules/clinical-modules.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AuditModule,
    TenantsModule,
    MfaModule,
    ApiKeysModule,
    SettingsModule,
    PasswordResetModule,
    EmailVerificationModule,
    InvitationsModule,
    PatientsModule,
    PatientContactsModule,
    PatientMedicalHistoryModule,
    PatientAllergiesModule,
    PatientMedicationsModule,
    PatientAlertsModule,
    PatientConsentModule,
    PatientDocumentsModule,
    PatientFormsModule,
    PatientClinicalModule,
    AppointmentTypesModule,
    ProvidersModule,
    ChairsModule,
    AvailabilityModule,
    AppointmentsModule,
    ClinicalNotesModule,
    TemplatesModule,
    DentalChartsModule,
    ClinicalModulesModule,
    ToothConditionsModule,
    ToothConditionConfigsModule,
    ProcedureCodesModule,
    TreatmentHistoryModule,
    TreatmentPlansModule,
    PeriodontalRecordsModule,
    ImagingStudiesModule,
    ImagingImagesModule,
    ImagingTwainModule,
    ImagingIntegrationsModule,
    ClaimIntegrationsModule,
    ServicesModule,
    FeesModule,
    InvoicesModule,
    PaymentsModule,
    RefundsModule,
    StatementsModule,
    ReceiptsModule,
    CommunicationTemplatesModule,
    CommunicationPreferencesModule,
    NotificationsModule,
    MessagesModule,
    RecallsModule,
    AppointmentRemindersModule,
    ReportsModule,
    PatientPortalModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // HttpExceptionFilter is registered via app.useGlobalFilters() in main.ts
  ],
})
export class AppModule {}
