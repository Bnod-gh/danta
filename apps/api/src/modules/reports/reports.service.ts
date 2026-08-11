import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ReportQuery } from '@danta/schemas';

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
}
