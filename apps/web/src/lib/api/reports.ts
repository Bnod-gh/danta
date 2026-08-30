import { apiGet, apiDownload } from './request';

export type RevenueReportRow = {
  date: string;
  revenue: number;
  payments: number;
  invoices: number;
};

export type ProductionReportRow = {
  date: string;
  production: number;
  treatments: number;
};

export type CollectionsReportRow = {
  status: string;
  count: number;
  amount: number;
};

export type AppointmentAnalyticsRow = {
  date: string;
  count: number;
  completed: number;
  noShows: number;
};

export type PractitionerAnalyticsRow = {
  providerId: string;
  providerName: string;
  appointments: number;
  completed: number;
  noShows: number;
  production: number;
  revenue: number;
  patients: number;
};

export type RecallAnalyticsRow = {
  type: string;
  count: number;
  completed: number;
};

export type PatientAnalyticsRow = {
  gender: string;
  count: number;
};

export type RevenueReportData = {
  totalRevenue: number;
  totalInvoices: number;
  totalPayments: number;
  totalRefunds: number;
  outstandingBalance: number;
  byProvider: { providerId: string; providerName: string; revenue: number; appointments: number }[];
  byService: { serviceId: string; serviceName: string; revenue: number; count: number }[];
  daily: RevenueReportRow[];
};

export type ProductionReportData = {
  totalProduction: number;
  totalTreatments: number;
  byProvider: { providerId: string; providerName: string; production: number; treatments: number }[];
  byTreatment: { treatment: string; count: number; totalCost: number }[];
  daily: ProductionReportRow[];
};

export type CollectionsReportData = {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
  byStatus: CollectionsReportRow[];
  byAge: { age: string; count: number; amount: number }[];
};

export type AppointmentAnalyticsData = {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShows: number;
  completionRate: number;
  noShowRate: number;
  averageDuration: number;
  byType: { typeId: string; typeName: string; count: number; duration: number }[];
  byProvider: { providerId: string; providerName: string; count: number; completed: number; noShows: number }[];
  daily: AppointmentAnalyticsRow[];
};

export type PractitionerAnalyticsData = {
  providers: PractitionerAnalyticsRow[];
};

export type RecallAnalyticsData = {
  totalRecalls: number;
  due: number;
  overdue: number;
  completed: number;
  completionRate: number;
  byType: RecallAnalyticsRow[];
  contactStats: { totalContacts: number; smsSent: number; emailSent: number; phoneCalls: number };
};

export type PatientAnalyticsData = {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  newPatientsLastMonth: number;
  growthRate: number;
  byGender: PatientAnalyticsRow[];
  byAgeGroup: { ageGroup: string; count: number }[];
  retention: { returningPatients: number; retentionRate: number };
  topVisitors: { patientId: string; patientName: string; visitCount: number; lastVisit: string }[];
};

export function getRevenueReport(startDate: string, endDate: string, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<RevenueReportData> {
  return apiGet('/api/v1/reports/revenue-report', { startDate, endDate, groupBy });
}

export function getProductionReport(startDate: string, endDate: string): Promise<ProductionReportData> {
  return apiGet('/api/v1/reports/production-report', { startDate, endDate });
}

export function getCollectionsReport(startDate: string, endDate: string): Promise<CollectionsReportData> {
  return apiGet('/api/v1/reports/collections-report', { startDate, endDate });
}

export function getAppointmentAnalytics(startDate: string, endDate: string): Promise<AppointmentAnalyticsData> {
  return apiGet('/api/v1/reports/appointment-analytics', { startDate, endDate });
}

export function getPractitionerAnalytics(startDate: string, endDate: string): Promise<PractitionerAnalyticsData> {
  return apiGet('/api/v1/reports/practitioner-analytics', { startDate, endDate });
}

export function getRecallAnalytics(startDate: string, endDate: string): Promise<RecallAnalyticsData> {
  return apiGet('/api/v1/reports/recall-analytics', { startDate, endDate });
}

export function getPatientAnalytics(startDate: string, endDate: string): Promise<PatientAnalyticsData> {
  return apiGet('/api/v1/reports/patient-analytics', { startDate, endDate });
}

function exportReportUrl(reportType: string, startDate: string, endDate: string, format: 'csv' | 'pdf'): string {
  return `/api/v1/reports/export-report?reportType=${encodeURIComponent(reportType)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&format=${format}`;
}

export function exportRevenueReportCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('revenue', startDate, endDate, 'csv'), `revenue-report-${startDate}-to-${endDate}.csv`);
}

export function exportProductionReportCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('production', startDate, endDate, 'csv'), `production-report-${startDate}-to-${endDate}.csv`);
}

export function exportCollectionsReportCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('collections', startDate, endDate, 'csv'), `collections-report-${startDate}-to-${endDate}.csv`);
}

export function exportAppointmentAnalyticsCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('appointments', startDate, endDate, 'csv'), `appointments-report-${startDate}-to-${endDate}.csv`);
}

export function exportPractitionerAnalyticsCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('practitioners', startDate, endDate, 'csv'), `practitioners-report-${startDate}-to-${endDate}.csv`);
}

export function exportRecallAnalyticsCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('recalls', startDate, endDate, 'csv'), `recalls-report-${startDate}-to-${endDate}.csv`);
}

export function exportPatientAnalyticsCsv(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('patients', startDate, endDate, 'csv'), `patients-report-${startDate}-to-${endDate}.csv`);
}

export function exportRevenueReportPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('revenue', startDate, endDate, 'pdf'), `revenue-report-${startDate}-to-${endDate}.pdf`);
}

export function exportProductionReportPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('production', startDate, endDate, 'pdf'), `production-report-${startDate}-to-${endDate}.pdf`);
}

export function exportCollectionsReportPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('collections', startDate, endDate, 'pdf'), `collections-report-${startDate}-to-${endDate}.pdf`);
}

export function exportAppointmentAnalyticsPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('appointments', startDate, endDate, 'pdf'), `appointments-report-${startDate}-to-${endDate}.pdf`);
}

export function exportPractitionerAnalyticsPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('practitioners', startDate, endDate, 'pdf'), `practitioners-report-${startDate}-to-${endDate}.pdf`);
}

export function exportRecallAnalyticsPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('recalls', startDate, endDate, 'pdf'), `recalls-report-${startDate}-to-${endDate}.pdf`);
}

export function exportPatientAnalyticsPdf(startDate: string, endDate: string) {
  return downloadBlob(exportReportUrl('patients', startDate, endDate, 'pdf'), `patients-report-${startDate}-to-${endDate}.pdf`);
}

async function downloadBlob(path: string, filename: string) {
  const blob = await apiDownload(path);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
