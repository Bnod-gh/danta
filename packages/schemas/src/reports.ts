import { z } from 'zod';

export const ReportGroupBySchema = z.enum(['day', 'week', 'month']);
export type ReportGroupBy = z.infer<typeof ReportGroupBySchema>;

export const ReportExportFormatSchema = z.enum(['csv', 'pdf']);
export type ReportExportFormat = z.infer<typeof ReportExportFormatSchema>;

export const ReportDateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ReportDateRange = z.infer<typeof ReportDateRangeSchema>;

export const ReportQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  providerId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type ReportQuery = z.infer<typeof ReportQuerySchema>;

export const ExportQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  providerId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
});

export type ExportQuery = z.infer<typeof ExportQuerySchema>;

export const ClaimsAnalyticsSchema = z.object({
  totalIntegrations: z.number().int().nonnegative(),
  activeIntegrations: z.number().int().nonnegative(),
  byProvider: z.array(z.object({
    provider: z.string(),
    count: z.number().int().nonnegative(),
    active: z.boolean(),
    healthStatus: z.string().optional(),
  })),
  healthStatusDistribution: z.array(z.object({
    status: z.string(),
    count: z.number().int().nonnegative(),
  })),
});

export type ClaimsAnalytics = z.infer<typeof ClaimsAnalyticsSchema>;

export const PaymentAnalyticsSchema = z.object({
  totalPayments: z.number().int().nonnegative(),
  totalAmount: z.number(),
  averageAmount: z.number(),
  byMethod: z.array(z.object({
    method: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number(),
  })),
  byStatus: z.array(z.object({
    status: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number(),
  })),
  daily: z.array(z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number(),
  })),
});

export type PaymentAnalytics = z.infer<typeof PaymentAnalyticsSchema>;

export const TreatmentAcceptanceSchema = z.object({
  totalTreatmentPlans: z.number().int().nonnegative(),
  acceptedPlans: z.number().int().nonnegative(),
  acceptanceRate: z.number(),
  totalAcceptedValue: z.number(),
  byProvider: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    totalPlans: z.number().int().nonnegative(),
    acceptedPlans: z.number().int().nonnegative(),
    acceptanceRate: z.number(),
    totalValue: z.number(),
  })),
  byMonth: z.array(z.object({
    month: z.string(),
    totalPlans: z.number().int().nonnegative(),
    acceptedPlans: z.number().int().nonnegative(),
    acceptanceRate: z.number(),
    totalValue: z.number(),
  })),
});

export type TreatmentAcceptance = z.infer<typeof TreatmentAcceptanceSchema>;

export const ChairUtilizationSchema = z.object({
  totalChairs: z.number().int().nonnegative(),
  activeChairs: z.number().int().nonnegative(),
  byChair: z.array(z.object({
    chairId: z.string(),
    chairName: z.string(),
    locationId: z.string().optional(),
    locationName: z.string().optional(),
    totalAppointments: z.number().int().nonnegative(),
    completedAppointments: z.number().int().nonnegative(),
    utilizationRate: z.number(),
    averageDuration: z.number(),
  })),
  overallUtilizationRate: z.number(),
});

export type ChairUtilization = z.infer<typeof ChairUtilizationSchema>;

export const NoShowAnalysisSchema = z.object({
  totalAppointments: z.number().int().nonnegative(),
  totalNoShows: z.number().int().nonnegative(),
  noShowRate: z.number(),
  byProvider: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    totalAppointments: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
    noShowRate: z.number(),
  })),
  byType: z.array(z.object({
    typeId: z.string(),
    typeName: z.string(),
    totalAppointments: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
    noShowRate: z.number(),
  })),
  byDayOfWeek: z.array(z.object({
    day: z.string(),
    totalAppointments: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
    noShowRate: z.number(),
  })),
  byTimeOfDay: z.array(z.object({
    hour: z.number().int().nonnegative(),
    totalAppointments: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
    noShowRate: z.number(),
  })),
});

export type NoShowAnalysis = z.infer<typeof NoShowAnalysisSchema>;

export const DashboardKpiSchema = z.object({
  todayAppointments: z.number().int().nonnegative(),
  todayPatients: z.number().int().nonnegative(),
  todayRevenue: z.number(),
  yesterdayRevenue: z.number(),
  revenueTrendPct: z.number(),
  outstandingBalance: z.number(),
  activeRecalls: z.number().int().nonnegative(),
  noShowsToday: z.number().int().nonnegative(),
  averageDuration: z.number().int().nonnegative(),
  confirmedAppointments: z.number().int().nonnegative(),
  inProgressAppointments: z.number().int().nonnegative(),
  totalChairs: z.number().int().nonnegative(),
  chairsActive: z.number().int().nonnegative(),
  utilizationRate: z.number(),
  productionToday: z.number(),
  productionTarget: z.number().nullable(),
});

export type DashboardKpi = z.infer<typeof DashboardKpiSchema>;

export const RevenueReportSchema = z.object({
  totalRevenue: z.number(),
  totalInvoices: z.number().int().nonnegative(),
  totalPayments: z.number(),
  totalRefunds: z.number(),
  outstandingBalance: z.number(),
  byProvider: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    revenue: z.number(),
    appointments: z.number().int().nonnegative(),
  })),
  byService: z.array(z.object({
    serviceId: z.string(),
    serviceName: z.string(),
    revenue: z.number(),
    count: z.number().int().nonnegative(),
  })),
  daily: z.array(z.object({
    date: z.string(),
    revenue: z.number(),
    payments: z.number().int().nonnegative(),
    invoices: z.number().int().nonnegative(),
  })),
});

export type RevenueReport = z.infer<typeof RevenueReportSchema>;

export const ProductionReportSchema = z.object({
  totalProduction: z.number(),
  totalTreatments: z.number().int().nonnegative(),
  byProvider: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    production: z.number(),
    treatments: z.number().int().nonnegative(),
  })),
  byTreatment: z.array(z.object({
    treatment: z.string(),
    count: z.number().int().nonnegative(),
    totalCost: z.number(),
  })),
  daily: z.array(z.object({
    date: z.string(),
    production: z.number(),
    treatments: z.number().int().nonnegative(),
  })),
});

export type ProductionReport = z.infer<typeof ProductionReportSchema>;

export const CollectionsReportSchema = z.object({
  totalBilled: z.number(),
  totalCollected: z.number(),
  totalOutstanding: z.number(),
  totalOverdue: z.number(),
  collectionRate: z.number(),
  byStatus: z.array(z.object({
    status: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number(),
  })),
  byAge: z.array(z.object({
    age: z.string(),
    count: z.number().int().nonnegative(),
    amount: z.number(),
  })),
});

export type CollectionsReport = z.infer<typeof CollectionsReportSchema>;

export const AppointmentAnalyticsSchema = z.object({
  totalAppointments: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  noShows: z.number().int().nonnegative(),
  completionRate: z.number(),
  noShowRate: z.number(),
  averageDuration: z.number(),
  byType: z.array(z.object({
    typeId: z.string(),
    typeName: z.string(),
    count: z.number().int().nonnegative(),
    duration: z.number().int().nonnegative(),
  })),
  byProvider: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    count: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
  })),
  daily: z.array(z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
  })),
});

export type AppointmentAnalytics = z.infer<typeof AppointmentAnalyticsSchema>;

export const PractitionerAnalyticsSchema = z.object({
  providers: z.array(z.object({
    providerId: z.string(),
    providerName: z.string(),
    appointments: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    noShows: z.number().int().nonnegative(),
    production: z.number(),
    revenue: z.number(),
    patients: z.number().int().nonnegative(),
    newPatients: z.number().int().nonnegative(),
  })),
});

export type PractitionerAnalytics = z.infer<typeof PractitionerAnalyticsSchema>;

export const RecallAnalyticsSchema = z.object({
  totalRecalls: z.number().int().nonnegative(),
  due: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  completionRate: z.number(),
  byType: z.array(z.object({
    type: z.string(),
    count: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
  })),
  contactStats: z.object({
    totalContacts: z.number().int().nonnegative(),
    smsSent: z.number().int().nonnegative(),
    emailSent: z.number().int().nonnegative(),
    phoneCalls: z.number().int().nonnegative(),
  }),
});

export type RecallAnalytics = z.infer<typeof RecallAnalyticsSchema>;

export const PatientAnalyticsSchema = z.object({
  totalPatients: z.number().int().nonnegative(),
  activePatients: z.number().int().nonnegative(),
  newPatientsThisMonth: z.number().int().nonnegative(),
  newPatientsLastMonth: z.number().int().nonnegative(),
  growthRate: z.number(),
  byGender: z.array(z.object({
    gender: z.string(),
    count: z.number().int().nonnegative(),
  })),
  byAgeGroup: z.array(z.object({
    ageGroup: z.string(),
    count: z.number().int().nonnegative(),
  })),
  retention: z.object({
    returningPatients: z.number().int().nonnegative(),
    retentionRate: z.number(),
  }),
  topVisitors: z.array(z.object({
    patientId: z.string(),
    patientName: z.string(),
    visitCount: z.number().int().nonnegative(),
    lastVisit: z.string(),
  })),
});

export type PatientAnalytics = z.infer<typeof PatientAnalyticsSchema>;
