import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ReportQuery, ExportQuery, ClaimsAnalytics, PaymentAnalytics, TreatmentAcceptance, ChairUtilization, NoShowAnalysis } from '@danta/schemas';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateFilter(query: ReportQuery) {
    const where: any = {};
    if (query.startDate) where.gte = query.startDate;
    if (query.endDate) where.lte = query.endDate;
    return where;
  }

  private getSafeDateFilter(query: ReportQuery) {
    const dateFilter = this.getDateFilter(query);
    if (!dateFilter.gte) {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      dateFilter.gte = twoYearsAgo;
    }
    return dateFilter;
  }

  async getDashboard(tenantId: string, _query: ReportQuery) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereTenant = { tenantId };
    const todayRange = { gte: today, lt: tomorrow };

    const [todayAppointments, todayPatients, todayRevenue, outstanding, activeRecalls, noShows, avgDurationMinutes] = await Promise.all([
      this.prisma.appointment.count({ where: { ...whereTenant, ...todayRange } }),
      this.prisma.appointment.findMany({ where: { ...whereTenant, ...todayRange }, select: { patientId: true }, distinct: ['patientId'] }).then(r => r.length),
      this.prisma.payment.aggregate({ where: { ...whereTenant, ...todayRange, status: 'completed' }, _sum: { amount: true } }).then(r => r._sum.amount || 0),
      this.prisma.invoice.aggregate({ where: { ...whereTenant, status: { in: ['issued', 'partially_paid'] } }, _sum: { balance: true } }).then(r => r._sum.balance || 0),
      this.prisma.recall.count({ where: { ...whereTenant, status: { in: ['due', 'overdue'] } } }),
      this.prisma.appointment.count({ where: { ...whereTenant, ...todayRange, status: 'no_show' } }),
      this.prisma.appointment.findMany({ where: { ...whereTenant, ...todayRange }, include: { appointmentType: true }, take: 1000 }).then(appointments => {
        if (appointments.length === 0) return 0;
        const totalMinutes = appointments.reduce((sum, a) => sum + a.appointmentType.duration, 0);
        return Math.round(totalMinutes / appointments.length);
      }),
    ]);

    return {
      todayAppointments,
      todayPatients,
      todayRevenue: Number(todayRevenue),
      outstandingBalance: Number(outstanding),
      activeRecalls,
      noShowsToday: noShows,
      averageDuration: avgDurationMinutes,
    };
  }

  async getRevenue(tenantId: string, _query: ReportQuery) {
    const dateFilter = this.getDateFilter(_query);
    const where = { tenantId, ...dateFilter };

    const [totalInvoices, totalRevenue, totalRefunds, outstanding, byProvider, byService, daily] = await Promise.all([
      this.prisma.invoice.count({ where: { ...where, status: { not: 'draft' } } }),
      this.prisma.payment.aggregate({ where: { ...where, status: 'completed' }, _sum: { amount: true } }).then(r => r._sum.amount || 0),
      this.prisma.refund.aggregate({ where: { ...where, status: 'completed' }, _sum: { amount: true } }).then(r => r._sum.amount || 0),
      this.prisma.invoice.aggregate({ where: { tenantId, status: { in: ['issued', 'partially_paid'] }, ...dateFilter }, _sum: { balance: true } }).then(r => r._sum.balance || 0),
      this.getRevenueByProvider(tenantId, dateFilter),
      this.getRevenueByService(tenantId, dateFilter),
      this.getRevenueDaily(tenantId, dateFilter),
    ]);

    return {
      totalRevenue: Number(totalRevenue),
      totalInvoices,
      totalPayments: Number(totalRevenue),
      totalRefunds: Number(totalRefunds),
      outstandingBalance: Number(outstanding),
      byProvider,
      byService,
      daily,
    };
  }

  private async getRevenueByProvider(tenantId: string, dateFilter: any) {
    const payments = await this.prisma.payment.groupBy({
      by: ['providerTxId'],
      where: { tenantId, status: 'completed', ...dateFilter },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return payments.map(p => ({
      providerId: p.providerTxId || 'unknown',
      providerName: p.providerTxId || 'unknown',
      revenue: Number(p._sum.amount || 0),
      appointments: p._count._all,
    }));
  }

  private async getRevenueByService(tenantId: string, dateFilter: any) {
    const items = await this.prisma.invoiceItem.groupBy({
      by: ['serviceId'],
      where: { invoice: { tenantId, ...dateFilter } },
      _sum: { total: true, quantity: true },
      _count: { _all: true },
    });

    const serviceIds = items.map(i => i.serviceId).filter((id): id is string => id != null);
    const services = serviceIds.length > 0
      ? await this.prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
      : [];
    const serviceMap = new Map(services.map(s => [s.id, s.name]));

    return items.map(i => {
      const serviceId = i.serviceId || 'unknown';
      return {
        serviceId,
        serviceName: serviceId === 'unknown' ? 'Unknown' : (serviceMap.get(serviceId) ?? 'Unknown'),
        revenue: Number(i._sum.total || 0),
        count: i._sum.quantity || 0,
      };
    });
  }

  private async getRevenueDaily(tenantId: string, dateFilter: any) {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, status: 'completed', ...dateFilter },
      select: { receivedAt: true, amount: true },
      take: 10000,
    });

    const map = new Map<string, { date: string; revenue: number; payments: number }>();
    for (const p of payments) {
      const date = new Date(p.receivedAt).toISOString().split('T')[0];
      const existing = map.get(date) || { date, revenue: 0, payments: 0 };
      existing.revenue += Number(p.amount);
      existing.payments += 1;
      map.set(date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getProduction(tenantId: string, query: ReportQuery) {
    const dateFilter = this.getDateFilter(query);
    const where = { tenantId, ...dateFilter };

    const [totalTreatments, totalProduction, byProvider, byTreatment, daily] = await Promise.all([
      this.prisma.treatmentHistory.count({ where }),
      this.prisma.treatmentHistory.aggregate({ where, _sum: { cost: true } }).then(r => r._sum.cost || 0),
      this.getProductionByProvider(tenantId, dateFilter),
      this.getProductionByTreatment(tenantId, dateFilter),
      this.getProductionDaily(tenantId, dateFilter),
    ]);

    return {
      totalProduction: Number(totalProduction),
      totalTreatments,
      byProvider,
      byTreatment,
      daily,
    };
  }

  private async getProductionByProvider(tenantId: string, dateFilter: any) {
    const treatments = await this.prisma.treatmentHistory.groupBy({
      by: ['providerId'],
      where: { tenantId, ...dateFilter },
      _sum: { cost: true },
      _count: { _all: true },
    });

    const providerIds = treatments.map(t => t.providerId);
    const providers = providerIds.length > 0
      ? await this.prisma.provider.findMany({ where: { id: { in: providerIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const providerMap = new Map(providers.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    return treatments.map(t => ({
      providerId: t.providerId,
      providerName: providerMap.get(t.providerId) || 'Unknown',
      production: Number(t._sum.cost || 0),
      treatments: t._count._all,
    }));
  }

  private async getProductionByTreatment(tenantId: string, dateFilter: any) {
    const treatments = await this.prisma.treatmentHistory.groupBy({
      by: ['treatment'],
      where: { tenantId, ...dateFilter },
      _sum: { cost: true },
      _count: { _all: true },
    });

    return treatments.map(t => ({
      treatment: t.treatment,
      count: t._count._all,
      totalCost: Number(t._sum.cost || 0),
    }));
  }

  private async getProductionDaily(tenantId: string, dateFilter: any) {
    const treatments = await this.prisma.treatmentHistory.findMany({
      where: { tenantId, ...dateFilter },
      select: { date: true, cost: true },
      take: 10000,
    });

    const map = new Map<string, { date: string; production: number; treatments: number }>();
    for (const t of treatments) {
      const date = new Date(t.date).toISOString().split('T')[0];
      const existing = map.get(date) || { date, production: 0, treatments: 0 };
      existing.production += Number(t.cost || 0);
      existing.treatments += 1;
      map.set(date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getCollections(tenantId: string, _query: ReportQuery) {
    const dateFilter = this.getSafeDateFilter(_query);
    const where = { tenantId, ...dateFilter };

    const [invoices, paid, outstanding, overdue] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { ...where, status: { not: 'draft' } }, _sum: { total: true, balance: true } }),
      this.prisma.invoice.aggregate({ where: { ...where, status: 'paid' }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { ...where, status: { in: ['issued', 'partially_paid'] } }, _sum: { balance: true } }),
      this.prisma.invoice.aggregate({ where: { ...where, status: { in: ['issued', 'partially_paid'] }, dueDate: { lt: new Date() } }, _sum: { balance: true } }),
    ]);

    const totalBilled = Number(invoices._sum.total || 0);
    const totalCollected = Number(paid._sum.total || 0);
    const totalOutstanding = Number(outstanding._sum.balance || 0);
    const totalOverdue = Number(overdue._sum.balance || 0);
    const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

    const byStatus = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: { ...where, status: { not: 'draft' } },
      _sum: { balance: true },
      _count: { _all: true },
    });

    const byAge = [
      { age: '0-30 days', count: 0, amount: 0 },
      { age: '31-60 days', count: 0, amount: 0 },
      { age: '61-90 days', count: 0, amount: 0 },
      { age: '90+ days', count: 0, amount: 0 },
    ];

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalOverdue,
      collectionRate,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count._all, amount: Number(s._sum.balance || 0) })),
      byAge,
    };
  }

  async getAppointments(tenantId: string, _query: ReportQuery) {
    const dateFilter = this.getDateFilter(_query);
    const where = { tenantId, ...dateFilter };

    const [total, completed, cancelled, noShows, avgDuration, byType, byProvider, daily] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'completed' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.appointment.count({ where: { ...where, status: 'no_show' } }),
      this.prisma.appointment.findMany({ where, include: { appointmentType: true }, take: 1000 }).then(appointments => {
        if (appointments.length === 0) return 0;
        const totalMinutes = appointments.reduce((sum, a) => sum + a.appointmentType.duration, 0);
        return Math.round(totalMinutes / appointments.length);
      }),
      this.getAppointmentsByType(tenantId, dateFilter),
      this.getAppointmentsByProvider(tenantId, dateFilter),
      this.getAppointmentsDaily(tenantId, dateFilter),
    ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;

    return {
      totalAppointments: total,
      completed,
      cancelled,
      noShows,
      completionRate,
      noShowRate,
      averageDuration: avgDuration,
      byType,
      byProvider,
      daily,
    };
  }

  private async getAppointmentsByType(tenantId: string, dateFilter: any) {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['appointmentTypeId'],
      where: { tenantId, ...dateFilter },
      _count: { _all: true },
    });

    const typeIds = appointments.map(a => a.appointmentTypeId);
    const types = typeIds.length > 0
      ? await this.prisma.appointmentType.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true, duration: true } })
      : [];
    const typeMap = new Map(types.map(t => [t.id, t]));

    return appointments.map(a => {
      const type = typeMap.get(a.appointmentTypeId);
      return {
        typeId: a.appointmentTypeId,
        typeName: type?.name || 'Unknown',
        count: a._count._all,
        duration: (type?.duration || 0) * a._count._all,
      };
    });
  }

  private async getAppointmentsByProvider(tenantId: string, dateFilter: any) {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['providerId', 'status'],
      where: { tenantId, ...dateFilter },
      _count: { _all: true },
    });

    const providerIds = [...new Set(appointments.map(a => a.providerId))];
    const providers = providerIds.length > 0
      ? await this.prisma.provider.findMany({ where: { id: { in: providerIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const providerMap = new Map(providers.map(p => [p.id, `${p.firstName} ${p.lastName}`]));

    const result = new Map<string, { providerId: string; providerName: string; count: number; completed: number; noShows: number }>();
    for (const a of appointments) {
      const key = a.providerId;
      const existing = result.get(key) || { providerId: key, providerName: providerMap.get(key) || 'Unknown', count: 0, completed: 0, noShows: 0 };
      existing.count += a._count._all;
      if (a.status === 'completed') existing.completed += a._count._all;
      if (a.status === 'no_show') existing.noShows += a._count._all;
      result.set(key, existing);
    }
    return Array.from(result.values());
  }

  private async getAppointmentsDaily(tenantId: string, dateFilter: any) {
    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, ...dateFilter },
      select: { startTime: true, status: true },
      take: 10000,
    });

    const map = new Map<string, { date: string; count: number; completed: number; noShows: number }>();
    for (const a of appointments) {
      const date = new Date(a.startTime).toISOString().split('T')[0];
      const existing = map.get(date) || { date, count: 0, completed: 0, noShows: 0 };
      existing.count += 1;
      if (a.status === 'completed') existing.completed += 1;
      if (a.status === 'no_show') existing.noShows += 1;
      map.set(date, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getPractitioners(tenantId: string, _query: ReportQuery) {
    const providers = await this.prisma.provider.findMany({ where: { tenantId, isActive: true } });

    const [appointmentsByProvider, completedByProvider, noShowsByProvider, treatmentsByProvider, patientsByProvider] = await Promise.all([
      this.prisma.appointment.groupBy({ by: ['providerId'], where: { tenantId }, _count: { _all: true } }),
      this.prisma.appointment.groupBy({ by: ['providerId'], where: { tenantId, status: 'completed' }, _count: { _all: true } }),
      this.prisma.appointment.groupBy({ by: ['providerId'], where: { tenantId, status: 'no_show' }, _count: { _all: true } }),
      this.prisma.treatmentHistory.groupBy({ by: ['providerId'], where: { tenantId }, _sum: { cost: true }, _count: { _all: true } }),
      this.prisma.appointment.groupBy({ by: ['providerId'], where: { tenantId }, _count: { _all: true } }),
    ]);

    const appointmentsMap = new Map(appointmentsByProvider.map(a => [a.providerId, a._count._all]));
    const completedMap = new Map(completedByProvider.map(a => [a.providerId, a._count._all]));
    const noShowsMap = new Map(noShowsByProvider.map(a => [a.providerId, a._count._all]));
    const treatmentsMap = new Map(treatmentsByProvider.map(t => [t.providerId, { cost: Number(t._sum.cost || 0), count: t._count._all }]));
    const patientsMap = new Map(patientsByProvider.map(p => [p.providerId, p._count._all]));

    const newPatientsThisMonth = await this.prisma.patient.count({
      where: { tenantId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
    });

    const result = providers.map(provider => {
      const appointments = appointmentsMap.get(provider.id) || 0;
      const completed = completedMap.get(provider.id) || 0;
      const noShows = noShowsMap.get(provider.id) || 0;
      const treatments = treatmentsMap.get(provider.id) || { cost: 0, count: 0 };
      const patients = patientsMap.get(provider.id) || 0;

      return {
        providerId: provider.id,
        providerName: `${provider.firstName} ${provider.lastName}`,
        appointments,
        completed,
        noShows,
        production: treatments.cost,
        revenue: 0,
        patients,
        newPatients: newPatientsThisMonth,
      };
    });

    return { providers: result };
  }

  async getRecalls(tenantId: string, _query: ReportQuery) {
    const [total, due, overdue, completed] = await Promise.all([
      this.prisma.recall.count({ where: { tenantId } }),
      this.prisma.recall.count({ where: { tenantId, status: 'due' } }),
      this.prisma.recall.count({ where: { tenantId, status: 'overdue' } }),
      this.prisma.recall.count({ where: { tenantId, status: 'completed' } }),
    ]);

    const byType = await this.prisma.recall.groupBy({
      by: ['type'],
      where: { tenantId },
      _count: { _all: true },
    });

    const contactStats = await this.prisma.recall.aggregate({
      where: { tenantId },
      _sum: { contactCount: true },
    });

    return {
      totalRecalls: total,
      due,
      overdue,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      byType: byType.map(t => ({ type: t.type, count: t._count._all, completed: 0 })),
      contactStats: {
        totalContacts: contactStats._sum.contactCount || 0,
        smsSent: 0,
        emailSent: 0,
        phoneCalls: 0,
      },
    };
  }

  async getPatients(tenantId: string, _query: ReportQuery) {
    const dateFilter = this.getSafeDateFilter(_query);
    const [total, active, thisMonth, lastMonth] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId } }),
      this.prisma.patient.count({ where: { tenantId, status: 'active' } }),
      this.prisma.patient.count({ where: { tenantId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
      this.prisma.patient.count({ where: { tenantId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    ]);

    const growthRate = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    const byGender = await this.prisma.patient.groupBy({
      by: ['gender'],
      where: { tenantId, gender: { not: null } },
      _count: { _all: true },
    });

    const patients = await this.prisma.patient.findMany({
      where: { tenantId, ...dateFilter },
      select: { dateOfBirth: true },
      take: 10000,
    });
    const now = new Date();
    const byAgeGroup = [
      { ageGroup: '0-17', count: 0 },
      { ageGroup: '18-35', count: 0 },
      { ageGroup: '36-50', count: 0 },
      { ageGroup: '51+', count: 0 },
    ];
    for (const p of patients) {
      const age = now.getFullYear() - new Date(p.dateOfBirth).getFullYear();
      if (age <= 17) byAgeGroup[0].count++;
      else if (age <= 35) byAgeGroup[1].count++;
      else if (age <= 50) byAgeGroup[2].count++;
      else byAgeGroup[3].count++;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { tenantId, ...dateFilter },
      select: { patientId: true },
      take: 50000,
    });
    const patientVisitCount = new Map<string, number>();
    for (const a of appointments) {
      patientVisitCount.set(a.patientId, (patientVisitCount.get(a.patientId) || 0) + 1);
    }
    let returningPatients = 0;
    for (const count of patientVisitCount.values()) {
      if (count > 1) returningPatients++;
    }
    const retentionRate = total > 0 ? (returningPatients / total) * 100 : 0;

    const topVisitors = await this.prisma.appointment.findMany({
      where: { tenantId },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startTime: 'desc' },
      take: 10,
    });

    const visitorMap = new Map<string, { patientId: string; patientName: string; visitCount: number; lastVisit: string }>();
    for (const a of topVisitors) {
      const key = a.patientId;
      const lastVisitStr = new Date(a.startTime).toISOString().split('T')[0];
      const initials = [a.patient.firstName, a.patient.lastName].filter(Boolean).map(n => n[0]).join('').toUpperCase();
      const existing = visitorMap.get(key) || { patientId: key, patientName: initials, visitCount: 0, lastVisit: lastVisitStr };
      existing.visitCount += 1;
      if (new Date(a.startTime) > new Date(existing.lastVisit)) existing.lastVisit = lastVisitStr;
      visitorMap.set(key, existing);
    }

    return {
      totalPatients: total,
      activePatients: active,
      newPatientsThisMonth: thisMonth,
      newPatientsLastMonth: lastMonth,
      growthRate,
      byGender: byGender.map(g => ({ gender: g.gender || 'unknown', count: g._count._all })),
      byAgeGroup,
      retention: { returningPatients, retentionRate },
      topVisitors: Array.from(visitorMap.values()).sort((a, b) => b.visitCount - a.visitCount),
    };
  }

  async getClaims(tenantId: string, _query: ReportQuery): Promise<ClaimsAnalytics> {
    const integrations = await this.prisma.claimIntegration.findMany({ where: { tenantId } });

    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter((i) => i.isActive).length;

    const byProvider = integrations.map((i) => ({
      provider: i.provider,
      count: 1,
      active: i.isActive,
      healthStatus: i.healthStatus ?? 'unknown',
    }));

    const healthStatusMap = new Map<string, number>();
    for (const i of integrations) {
      const status = i.healthStatus ?? 'unknown';
      healthStatusMap.set(status, (healthStatusMap.get(status) || 0) + 1);
    }
    const healthStatusDistribution = Array.from(healthStatusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return {
      totalIntegrations,
      activeIntegrations,
      byProvider,
      healthStatusDistribution,
    };
  }

  async getPayments(tenantId: string, query: ReportQuery): Promise<PaymentAnalytics> {
    const dateFilter = this.getDateFilter(query);
    const where = { tenantId, ...dateFilter };

    const [totalPayments, totalAmount, payments] = await Promise.all([
      this.prisma.payment.count({ where: { ...where, status: 'completed' } }),
      this.prisma.payment.aggregate({ where: { ...where, status: 'completed' }, _sum: { amount: true } }).then((r) => r._sum.amount || 0),
      this.prisma.payment.findMany({
        where: { ...where, status: 'completed' },
        select: { method: true, amount: true, receivedAt: true },
        take: 10000,
      }),
    ]);

    const byMethodMap = new Map<string, { count: number; amount: number }>();
    const byStatusMap = new Map<string, { count: number; amount: number }>();
    const dailyMap = new Map<string, { date: string; count: number; amount: number }>();

    for (const p of payments) {
      const methodKey = p.method;
      const amount = Number(p.amount);
      byMethodMap.set(methodKey, { count: (byMethodMap.get(methodKey)?.count || 0) + 1, amount: (byMethodMap.get(methodKey)?.amount || 0) + amount });
      const statusKey = 'completed';
      byStatusMap.set(statusKey, { count: (byStatusMap.get(statusKey)?.count || 0) + 1, amount: (byStatusMap.get(statusKey)?.amount || 0) + amount });
      const date = new Date(p.receivedAt).toISOString().split('T')[0];
      dailyMap.set(date, { date, count: (dailyMap.get(date)?.count || 0) + 1, amount: (dailyMap.get(date)?.amount || 0) + amount });
    }

    return {
      totalPayments,
      totalAmount: Number(totalAmount),
      averageAmount: totalPayments > 0 ? Number(totalAmount) / totalPayments : 0,
      byMethod: Array.from(byMethodMap.entries()).map(([method, data]) => ({ method, ...data })),
      byStatus: Array.from(byStatusMap.entries()).map(([status, data]) => ({ status, ...data })),
      daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getTreatmentAcceptance(tenantId: string, query: ReportQuery): Promise<TreatmentAcceptance> {
    const dateFilter = this.getDateFilter(query);
    const where = { tenantId, ...dateFilter };

    const [totalPlans, acceptedPlans, byProvider, byMonth] = await Promise.all([
      this.prisma.treatmentPlan.count({ where }),
      this.prisma.treatmentPlan.count({ where: { ...where, status: { in: ['approved', 'in_progress', 'completed'] } } }),
      this.getTreatmentAcceptanceByProvider(tenantId, dateFilter),
      this.getTreatmentAcceptanceByMonth(tenantId, dateFilter),
    ]);

    const totalAcceptedValue = 0;
    const acceptanceRate = totalPlans > 0 ? (acceptedPlans / totalPlans) * 100 : 0;

    return {
      totalTreatmentPlans: totalPlans,
      acceptedPlans,
      acceptanceRate,
      totalAcceptedValue,
      byProvider,
      byMonth,
    };
  }

  private async getTreatmentAcceptanceByProvider(tenantId: string, dateFilter: any) {
    const plans = await this.prisma.treatmentPlan.groupBy({
      by: ['providerId'],
      where: { tenantId, ...dateFilter },
      _count: { _all: true },
    });

    const providerIds = plans.map((p) => p.providerId);
    const providers = providerIds.length > 0
      ? await this.prisma.provider.findMany({ where: { id: { in: providerIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const providerMap = new Map(providers.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

    return plans.map((p) => {
      const providerName = providerMap.get(p.providerId) || 'Unknown';
      const accepted = 0;
      return {
        providerId: p.providerId,
        providerName,
        totalPlans: p._count._all,
        acceptedPlans: accepted,
        acceptanceRate: 0,
        totalValue: 0,
      };
    });
  }

  private async getTreatmentAcceptanceByMonth(tenantId: string, dateFilter: any) {
    const plans = await this.prisma.treatmentPlan.findMany({
      where: { tenantId, ...dateFilter },
      select: { createdAt: true, status: true },
      take: 10000,
    });

    const map = new Map<string, { month: string; totalPlans: number; acceptedPlans: number; acceptanceRate: number; totalValue: number }>();
    for (const p of plans) {
      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      const existing = map.get(month) || { month, totalPlans: 0, acceptedPlans: 0, acceptanceRate: 0, totalValue: 0 };
      existing.totalPlans += 1;
      if (['approved', 'in_progress', 'completed'].includes(p.status)) existing.acceptedPlans += 1;
      existing.acceptanceRate = existing.totalPlans > 0 ? (existing.acceptedPlans / existing.totalPlans) * 100 : 0;
      map.set(month, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getChairUtilization(tenantId: string, query: ReportQuery): Promise<ChairUtilization> {
    const dateFilter = this.getDateFilter(query);
    const where = { tenantId, ...dateFilter };

    const [chairs, appointments] = await Promise.all([
      this.prisma.chair.findMany({ where: { tenantId, isActive: true } }),
      this.prisma.appointment.findMany({
        where,
        include: { appointmentType: true, chair: true },
        take: 10000,
      }),
    ]);

    const chairStats = new Map<string, {
      chairId: string;
      chairName: string;
      locationId?: string;
      locationName?: string;
      totalAppointments: number;
      completedAppointments: number;
      totalDuration: number;
    }>();

    for (const a of appointments) {
      const existing = chairStats.get(a.chairId) || {
        chairId: a.chairId,
        chairName: a.chair.name,
        locationId: a.chair.locationId ?? undefined,
        totalAppointments: 0,
        completedAppointments: 0,
        totalDuration: 0,
      };
      existing.totalAppointments += 1;
      if (a.status === 'completed') {
        existing.completedAppointments += 1;
        existing.totalDuration += a.appointmentType.duration;
      }
      chairStats.set(a.chairId, existing);
    }

    const totalSlots = chairs.length * 24 * 60;
    const byChair = Array.from(chairStats.values()).map((c) => ({
      chairId: c.chairId,
      chairName: c.chairName,
      locationId: c.locationId,
      totalAppointments: c.totalAppointments,
      completedAppointments: c.completedAppointments,
      utilizationRate: totalSlots > 0 ? (c.totalDuration / totalSlots) * 100 : 0,
      averageDuration: c.completedAppointments > 0 ? Math.round(c.totalDuration / c.completedAppointments) : 0,
    }));

    const totalDuration = byChair.reduce((sum, c) => sum + c.utilizationRate, 0);
    const overallUtilizationRate = chairs.length > 0 ? totalDuration / chairs.length : 0;

    return {
      totalChairs: chairs.length,
      activeChairs: chairs.filter((c) => c.isActive).length,
      byChair,
      overallUtilizationRate,
    };
  }

  async getNoShows(tenantId: string, query: ReportQuery): Promise<NoShowAnalysis> {
    const dateFilter = this.getDateFilter(query);
    const where = { tenantId, ...dateFilter };

    const [totalAppointments, totalNoShows, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.count({ where: { ...where, status: 'no_show' } }),
      this.prisma.appointment.findMany({
        where,
        include: { appointmentType: true, provider: { select: { id: true, firstName: true, lastName: true } } },
        take: 10000,
      }),
    ]);

    const noShowRate = totalAppointments > 0 ? (totalNoShows / totalAppointments) * 100 : 0;

    const byProviderMap = new Map<string, { providerId: string; providerName: string; totalAppointments: number; noShows: number }>();
    const byTypeMap = new Map<string, { typeId: string; typeName: string; totalAppointments: number; noShows: number }>();
    const byDayMap = new Map<string, { day: string; totalAppointments: number; noShows: number }>();
    const byHourMap = new Map<number, { hour: number; totalAppointments: number; noShows: number }>();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const a of appointments) {
      const isNoShow = a.status === 'no_show';
      const providerName = `${a.provider.firstName} ${a.provider.lastName}`;
      const typeName = a.appointmentType.name;

      const providerKey = a.providerId;
      const existingProvider = byProviderMap.get(providerKey) || { providerId: providerKey, providerName, totalAppointments: 0, noShows: 0 };
      existingProvider.totalAppointments += 1;
      if (isNoShow) existingProvider.noShows += 1;
      byProviderMap.set(providerKey, existingProvider);

      const typeKey = a.appointmentTypeId;
      const existingType = byTypeMap.get(typeKey) || { typeId: typeKey, typeName, totalAppointments: 0, noShows: 0 };
      existingType.totalAppointments += 1;
      if (isNoShow) existingType.noShows += 1;
      byTypeMap.set(typeKey, existingType);

      const day = dayNames[new Date(a.startTime).getDay()];
      const existingDay = byDayMap.get(day) || { day, totalAppointments: 0, noShows: 0 };
      existingDay.totalAppointments += 1;
      if (isNoShow) existingDay.noShows += 1;
      byDayMap.set(day, existingDay);

      const hour = new Date(a.startTime).getHours();
      const existingHour = byHourMap.get(hour) || { hour, totalAppointments: 0, noShows: 0 };
      existingHour.totalAppointments += 1;
      if (isNoShow) existingHour.noShows += 1;
      byHourMap.set(hour, existingHour);
    }

    const byProvider = Array.from(byProviderMap.values()).map((p) => ({
      ...p,
      noShowRate: p.totalAppointments > 0 ? (p.noShows / p.totalAppointments) * 100 : 0,
    }));

    const byType = Array.from(byTypeMap.values()).map((t) => ({
      ...t,
      noShowRate: t.totalAppointments > 0 ? (t.noShows / t.totalAppointments) * 100 : 0,
    }));

    const byDayOfWeek = Array.from(byDayMap.values()).map((d) => ({
      ...d,
      noShowRate: d.totalAppointments > 0 ? (d.noShows / d.totalAppointments) * 100 : 0,
    }));

    const byTimeOfDay = Array.from(byHourMap.values())
      .sort((a, b) => a.hour - b.hour)
      .map((h) => ({
        ...h,
        noShowRate: h.totalAppointments > 0 ? (h.noShows / h.totalAppointments) * 100 : 0,
      }));

    return {
      totalAppointments,
      totalNoShows,
      noShowRate,
      byProvider,
      byType,
      byDayOfWeek,
      byTimeOfDay,
    };
  }

  async exportReport(tenantId: string, reportType: string, _query: ExportQuery) {
    let headers: string[] = [];
    let rows: any[] = [];

    switch (reportType) {
      case 'revenue': {
        const data = await this.getRevenue(tenantId, _query);
        headers = ['date', 'revenue', 'payments', 'invoices'];
        rows = data.daily;
        break;
      }
      case 'production': {
        const data = await this.getProduction(tenantId, _query);
        headers = ['date', 'production', 'treatments'];
        rows = data.daily;
        break;
      }
      case 'collections': {
        const data = await this.getCollections(tenantId, _query);
        headers = ['status', 'count', 'amount'];
        rows = data.byStatus;
        break;
      }
      case 'appointments': {
        const data = await this.getAppointments(tenantId, _query);
        headers = ['date', 'count', 'completed', 'noShows'];
        rows = data.daily;
        break;
      }
      case 'patients': {
        const data = await this.getPatients(tenantId, _query);
        headers = ['gender', 'count'];
        rows = data.byGender;
        break;
      }
      case 'claims': {
        const data = await this.getClaims(tenantId, _query);
        headers = ['provider', 'count', 'active', 'healthStatus'];
        rows = data.byProvider;
        break;
      }
      case 'payments': {
        const data = await this.getPayments(tenantId, _query);
        headers = ['date', 'count', 'amount'];
        rows = data.daily;
        break;
      }
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    return { data: rows, headers };
  }
}
