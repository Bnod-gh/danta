export type PatientPortalData = {
  profile: Record<string, unknown>;
  upcomingAppointments: AppointmentWithRelations[];
  recentDocuments: PatientDocument[];
  billing: {
    invoices: InvoiceWithRelations[];
    payments: PaymentWithRelations[];
    outstandingBalance: number;
  };
};

export type PatientBilling = {
  invoices: InvoiceWithRelations[];
  payments: PaymentWithRelations[];
  outstandingBalance: number;
};

export type AppointmentWithRelations = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string | null;
  provider: { firstName: string; lastName: string };
  appointmentType: { name: string; duration: number };
  chair: { name: string };
};

export type PatientDocument = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: string;
};

export type InvoiceWithRelations = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  items: { description: string; quantity: number; total: number }[];
};

export type PaymentWithRelations = {
  id: string;
  method: string;
  amount: number;
  status: string;
  reference?: string;
  receivedAt: string;
};

export async function getPatientPortalData(): Promise<PatientPortalData> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch('/api/v1/patient-portal/data', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch portal data');
  return res.json();
}

export async function getPatientAppointments(): Promise<AppointmentWithRelations[]> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch('/api/v1/patient-portal/appointments', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function getPatientDocuments(): Promise<PatientDocument[]> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch('/api/v1/patient-portal/documents', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function getPatientBilling(): Promise<PatientBilling> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch('/api/v1/patient-portal/billing', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch billing');
  return res.json();
}

export async function updatePatientProfile(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch('/api/v1/patient-portal/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function submitPatientForm(formType: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const token = localStorage.getItem('patientAccessToken');
  const res = await fetch(`/api/v1/patient-portal/forms/${encodeURIComponent(formType)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error('Failed to submit form');
  return res.json();
}
