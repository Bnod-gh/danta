import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/patients/$id')({
  component: PatientDetailPage,
});

type TabValue = 'overview' | 'contacts' | 'medical-history' | 'allergies' | 'medications' | 'alerts' | 'consent' | 'documents';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'medical-history', label: 'Medical History' },
  { value: 'allergies', label: 'Allergies' },
  { value: 'medications', label: 'Medications' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'consent', label: 'Consent' },
  { value: 'documents', label: 'Documents' },
];

export function PatientDetailPage() {
  const { id } = Route.useParams();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/patients/${id}`);
      if (!res.ok) throw new Error('Failed to fetch patient');
      return res.json() as Promise<{
        firstName: string;
        lastName: string;
        preferredName?: string;
        dateOfBirth: string;
        gender?: string;
        email?: string;
        phone?: string;
        medicareNumber?: string;
        healthFundName?: string;
        contacts?: Array<{
          id: string;
          firstName?: string;
          lastName?: string;
          type: string;
          phone?: string;
          email?: string;
        }>;
        allergies?: Array<{
          id: string;
          allergen: string;
          severity: string;
          reaction?: string;
        }>;
        medications?: Array<{
          id: string;
          name: string;
          dosage?: string;
          frequency?: string;
        }>;
        alerts?: Array<{
          id: string;
          message: string;
          type: string;
          severity: string;
        }>;
        consents?: Array<{
          id: string;
          type: string;
          grantedAt: string;
        }>;
        documents?: Array<{
          id: string;
          name: string;
          mimeType: string;
          size: number;
        }>;
      }>;
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
          <p className="text-muted-foreground">
            {patient.preferredName ? `Preferred: ${patient.preferredName}` : ''} • DOB: {new Date(patient.dateOfBirth).toLocaleDateString()} • {patient.gender || 'No gender specified'}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm font-medium">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="border-b">
        <div className="flex gap-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-1 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Contact Information</h3>
            <p className="text-sm text-muted-foreground">Email: {patient.email || '-'}</p>
            <p className="text-sm text-muted-foreground">Phone: {patient.phone || '-'}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Insurance</h3>
            <p className="text-sm text-muted-foreground">Medicare: {patient.medicareNumber ? '••••••' + patient.medicareNumber.slice(-4) : '-'}</p>
            <p className="text-sm text-muted-foreground">Health Fund: {patient.healthFundName || '-'}</p>
          </div>
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Contacts</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Add Contact
            </button>
          </div>
          {patient.contacts?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contacts yet</p>
          ) : (
            <div className="space-y-2">
              {patient.contacts?.map((contact) => (
                <div key={contact.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-sm text-muted-foreground">{contact.type} • {contact.phone || contact.email || '-'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'allergies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Allergies</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Add Allergy
            </button>
          </div>
          {patient.allergies?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No allergies recorded</p>
          ) : (
            <div className="space-y-2">
              {patient.allergies?.map((allergy) => (
                <div key={allergy.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{allergy.allergen}</p>
                    <p className="text-sm text-muted-foreground">{allergy.severity} {allergy.reaction ? `• ${allergy.reaction}` : ''}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    allergy.severity === 'mild' && "bg-green-100 text-green-800",
                    allergy.severity === 'moderate' && "bg-yellow-100 text-yellow-800",
                    allergy.severity === 'severe' && "bg-red-100 text-red-800"
                  )}>
                    {allergy.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Medications</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Add Medication
            </button>
          </div>
          {patient.medications?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medications recorded</p>
          ) : (
            <div className="space-y-2">
              {patient.medications?.map((medication) => (
                <div key={medication.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{medication.name}</p>
                  <p className="text-sm text-muted-foreground">{medication.dosage} {medication.frequency ? `• ${medication.frequency}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Alerts</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Add Alert
            </button>
          </div>
          {patient.alerts?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {patient.alerts?.map((alert) => (
                <div key={alert.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">{alert.type}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      alert.severity === 'info' && "bg-blue-100 text-blue-800",
                      alert.severity === 'warning' && "bg-yellow-100 text-yellow-800",
                      alert.severity === 'critical' && "bg-red-100 text-red-800"
                    )}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'consent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Consent Records</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Add Consent
            </button>
          </div>
          {patient.consents?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No consent records</p>
          ) : (
            <div className="space-y-2">
              {patient.consents?.map((consent) => (
                <div key={consent.id} className="p-4 border rounded-lg">
                  <p className="font-medium">{consent.type}</p>
                  <p className="text-sm text-muted-foreground">Granted: {new Date(consent.grantedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Documents</h3>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm">
              <Plus className="w-4 h-4" />
              Upload Document
            </button>
          </div>
          {patient.documents?.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {patient.documents?.map((doc) => (
                <div key={doc.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.mimeType} • {(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
