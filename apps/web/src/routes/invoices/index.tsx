import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/invoices/')({
  component: InvoicesPage,
});

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceRecord = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  notes?: string;
  items: InvoiceItem[];
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function InvoicesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [patientId, setPatientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitPrice, setItemUnitPrice] = useState('');

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((res) => res.json())
      .then((data: any) => setPatients(data.patients || data))
      .catch(() => {});
  }, []);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/v1/invoices');
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<InvoiceRecord[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedInvoice?.id === editingId) {
        setSelectedInvoice(null);
        setEditingId(null);
      }
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: any }) => {
      const res = await fetch(`/api/v1/invoices/${invoiceId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowItemForm(false);
      setItemDescription('');
      setItemQuantity('1');
      setItemUnitPrice('');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/v1/invoices/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setDueDate('');
    setNotes('');
    setShowForm(false);
    setEditingId(null);
    setSelectedInvoice(null);
  };

  const handleEdit = (inv: InvoiceRecord) => {
    setPatientId(inv.patientId);
    setDueDate(inv.dueDate.split('T')[0]);
    setNotes(inv.notes || '');
    setEditingId(inv.id);
    setSelectedInvoice(inv);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, dueDate, notes: notes || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    addItemMutation.mutate({
      invoiceId: selectedInvoice.id,
      data: {
        description: itemDescription,
        quantity: Number(itemQuantity),
        unitPrice: Number(itemUnitPrice),
        taxRate: 0,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage patient invoices</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Invoice</h3>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={2} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Balance</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices?.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.patient.firstName} {inv.patient.lastName}</td>
                  <td className="px-4 py-3">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">${inv.total.toFixed(2)}</td>
                  <td className="px-4 py-3">${inv.balance.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedInvoice(inv); setShowItemForm(true); }} className="p-2 hover:bg-muted rounded text-xs">+Item</button>
                      <button onClick={() => handleEdit(inv)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(inv.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedInvoice && (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Items for {selectedInvoice.invoiceNumber}</h3>
          {showItemForm && (
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
              <input value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="Description" className="flex-1 px-3 py-2 border rounded-md text-sm" required />
              <input type="number" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="Qty" className="w-20 px-3 py-2 border rounded-md text-sm" required />
              <input type="number" step="0.01" value={itemUnitPrice} onChange={(e) => setItemUnitPrice(e.target.value)} placeholder="Price" className="w-24 px-3 py-2 border rounded-md text-sm" required />
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Add</button>
              <button type="button" onClick={() => setShowItemForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
            </form>
          )}
          {!showItemForm && (
            <button onClick={() => setShowItemForm(true)} className="mb-4 px-4 py-2 border rounded-md text-sm">Add Item</button>
          )}
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Qty</th>
                <th className="text-left px-4 py-3 font-medium">Unit Price</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {selectedInvoice.items?.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">${item.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteItemMutation.mutate(item.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
