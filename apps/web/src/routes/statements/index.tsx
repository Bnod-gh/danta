import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/statements/')({
  component: StatementsPage,
});

type StatementView = {
  patientId: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  invoices: { id: string; invoiceNumber: string; date: string; total: number; status: string }[];
  payments: { id: string; date: string; amount: number; method: string }[];
  refunds: { id: string; date: string; amount: number; reason?: string }[];
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function StatementsPage() {
  const [patientId, setPatientId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [statement, setStatement] = useState<StatementView | null>(null);

  useState(() => {
    fetch('/api/v1/patients')
      .then((res) => res.json())
      .then((data: any) => setPatients(data.patients || data))
      .catch(() => {});
  });

  const generateQuery = useQuery({
    queryKey: ['statement', patientId, fromDate, toDate],
    queryFn: async () => {
      if (!patientId || !fromDate || !toDate) return null;
      const res = await fetch(`/api/v1/statements?patientId=${patientId}&fromDate=${fromDate}&toDate=${toDate}`);
      if (!res.ok) throw new Error('Failed to generate statement');
      return res.json() as Promise<StatementView>;
    },
    enabled: !!patientId && !!fromDate && !!toDate,
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setStatement(null);
    generateQuery.refetch().then((result) => {
      if (result.data) setStatement(result.data);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statements</h1>
        <p className="text-muted-foreground">Generate patient billing statements</p>
      </div>

      <form onSubmit={handleGenerate} className="border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Patient</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
              <option value="">Select patient</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
          </div>
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Generate Statement</button>
      </form>

      {generateQuery.isLoading && (
        <div className="text-center py-12 text-muted-foreground">Generating...</div>
      )}

      {statement && (
        <div className="border rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Patient Statement</h3>
              <p className="text-sm text-muted-foreground">{new Date(statement.fromDate).toLocaleDateString()} - {new Date(statement.toDate).toLocaleDateString()}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Opening Balance</p>
              <p className="text-lg font-medium">${statement.openingBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Closing Balance</p>
              <p className="text-lg font-medium">${statement.closingBalance.toFixed(2)}</p>
            </div>
          </div>

          {statement.invoices.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Invoices</h4>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Invoice</th>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Total</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statement.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2">{inv.invoiceNumber}</td>
                      <td className="px-4 py-2">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${inv.total.toFixed(2)}</td>
                      <td className="px-4 py-2 capitalize">{inv.status.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {statement.payments.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Payments</h4>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Date</th>
                    <th className="text-left px-4 py-2 font-medium">Amount</th>
                    <th className="text-left px-4 py-2 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statement.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">${p.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 capitalize">{p.method.replace('_', ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
