import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
  Building2,
  Users,
  Stethoscope,
  Receipt,
  MessageSquare,
  Plug,
  Blocks,
  UserCircle,
  SlidersHorizontal,
  CalendarCog,
  CircleDollarSign,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@danta/ui/table';
import { cn } from '@danta/ui/utils';
import type { TenantSettings } from '@danta/schemas';
import { getTenantSettings, getTeamMembers, updateSettingsGroup } from '../../lib/api/settings';
import { tenantPath } from '../../lib/tenant-routing';
import { OrganisationSettingsPage } from './organisation/-organisation-settings-page.tsx';
import { PracticeSettingsPage } from './practice/-practice-settings-page.tsx';
import { LocationSettingsPage } from './locations/-location-settings-page.tsx';
import { SecuritySettingsPage } from './security/-security-settings-page.tsx';
import { ClinicalSettingsPage } from './clinical/-clinical-settings-page.tsx';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'general', label: 'General', icon: SlidersHorizontal },
  { key: 'workspace', label: 'Workspace', icon: Building2 },
  { key: 'people', label: 'People', icon: Users },
  { key: 'clinical', label: 'Clinical', icon: Stethoscope },
  { key: 'billing', label: 'Billing & Tax', icon: Receipt },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'modules', label: 'Modules', icon: Blocks },
  { key: 'account', label: 'Account', icon: UserCircle },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

export function SettingsPage({ section: sectionProp }: { section?: string } = {}) {
  const params = useParams({ strict: false }) as { section?: string; tenantId?: string };
  const requested = sectionProp ?? params.section;
  const section = (SECTIONS.find((entry) => entry.key === requested)?.key ?? 'general') as SectionKey;
  const settingsBase = params.tenantId ? tenantPath(params.tenantId, '/settings') : '/settings';
  const { user } = useAuth();

  const settingsQuery = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: getTenantSettings,
    enabled: ['general', 'clinical', 'billing', 'communication'].includes(section),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your practice — changes apply workspace-wide</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Settings sections" className="lg:w-56 shrink-0">
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {SECTIONS.map(({ key, label, icon: Icon }) => (
              <Link
                key={key}
                to={`${settingsBase}/${key}`}
                aria-current={section === key ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  section === key
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {section === 'general' && (
            <>
              <OrganisationSettingsPage />
              <PracticeSettingsPage />
            </>
          )}
          {section === 'workspace' && (
            <>
              <LocationSettingsPage />
              <WorkspaceLinksCard />
            </>
          )}
          {section === 'people' && <PeopleTab />}
          {(section === 'billing' || section === 'communication') && (
            <SettingsGroupForm
              group={section}
              data={settingsQuery.data?.[section]}
              isLoading={settingsQuery.isLoading}
            />
          )}
          {section === 'clinical' && (
            <>
              <SettingsGroupForm
                group={section}
                data={settingsQuery.data?.[section]}
                isLoading={settingsQuery.isLoading}
              />
              <ClinicalSettingsPage />
            </>
          )}
          {section === 'integrations' && <PlaceholderCard title="Integrations" description="Connect third-party programs — imaging, claims, messaging. Program installation arrives with the Modules rollout." />}
          {section === 'modules' && <ModulesTab />}
          {section === 'account' && (
            <>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Your profile</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="font-medium">{user?.firstName} {user?.lastName}</span> · <span className="text-muted-foreground">{user?.email}</span></p>
                  <p className="text-muted-foreground">Role: <Badge variant="secondary">{user?.isSuperadmin ? 'Super Admin' : user?.role?.replace(/_/g, ' ')}</Badge></p>
                </CardContent>
              </Card>
              <SecuritySettingsPage />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkspaceLinksCard() {
  const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
  const links = [
    { to: '/chairs', label: 'Operatory chairs' },
    { to: '/appointment-types', label: 'Appointment types' },
    { to: '/providers', label: 'Practitioners' },
    { to: '/services', label: 'Services catalogue' },
    { to: '/fees', label: 'Fee schedule' },
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CalendarCog className="h-4 w-4" /> Scheduling resources</CardTitle></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={tenantId ? tenantPath(tenantId, link.to) : link.to}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            {link.label}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function PeopleTab() {
  const teamQuery = useQuery({ queryKey: ['team'], queryFn: getTeamMembers });

  if (teamQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (teamQuery.error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">You do not have permission to view the team list.</CardContent>
      </Card>
    );
  }

  const members = teamQuery.data ?? [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Team ({members.length})</span>
          <Badge variant="secondary">{members.filter((member) => member.status === 'active').length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell><Badge variant="outline">{member.role.replace(/_/g, ' ')}</Badge></TableCell>
                <TableCell>
                  <span className={cn('text-xs font-semibold', member.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground')}>
                    {member.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString('en-AU') : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ModulesTab() {
  // Future programs plug in here; today we surface the built-in feature areas.
  const modules = [
    { name: 'Scheduling', status: 'Active', note: 'Chair lanes, shifts, free slots' },
    { name: 'Clinical Notes (SOAP)', status: 'Active', note: 'Structured notes + templates' },
    { name: 'Odontogram', status: 'Active', note: 'Tooth charting' },
    { name: 'Periodontal Charting', status: 'Active', note: 'Perio records' },
    { name: 'Imaging', status: 'Active', note: 'Studies + X-ray viewer' },
    { name: 'Treatment Plans', status: 'Active', note: 'Planning + approval' },
    { name: 'Billing & Claims', status: 'Active', note: 'Invoices, payments, HICAPS' },
    { name: 'Recalls & Reminders', status: 'Active', note: 'Recall queue + outreach' },
    { name: 'Patient Portal', status: 'Active', note: 'Self-service portal' },
    { name: 'Programs marketplace', status: 'Coming soon', note: 'Install third-party programs per module' },
  ];
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Blocks className="h-4 w-4" /> Modules</CardTitle></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {modules.map((entry) => (
          <div key={entry.name} className="rounded-md border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{entry.name}</span>
              <Badge variant={entry.status === 'Active' ? 'default' : 'secondary'}>{entry.status}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Plug className="h-4 w-4" /> {title}</span>
          <Badge variant="secondary">Coming soon</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SettingsGroupForm({
  group,
  data,
  isLoading,
}: {
  group: 'clinical' | 'billing' | 'communication';
  data?: Partial<TenantSettings['clinical' | 'billing' | 'communication']>;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateSettingsGroup(group, payload),
    onSuccess: async () => {
      toast.success('Settings saved');
      await queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save settings'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const value = (key: string) => form[`${group}.${key}`] ?? String((data as Record<string, unknown> | undefined)?.[key] ?? '');
  const set = (key: string) => (val: string) => setForm((current) => ({ ...current, [`${group}.${key}`]: val }));

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    for (const [compositeKey, raw] of Object.entries(form)) {
      if (!compositeKey.startsWith(`${group}.`)) continue;
      const key = compositeKey.slice(group.length + 1);
      const numberKeys = new Set([
        'taxRatePercent', 'invoicePaymentTermsDays', 'reminderLeadHours',
        'weekStartsOn',
      ]);
      const booleanKeys = new Set([
        'soapNoteEnabled', 'medicalHistoryRequiredAtBooking', 'clinicalNoteTemplatesEnabled', 'lateFeeEnabled',
        'appointmentRemindersEnabled', 'recallRemindersEnabled', 'marketingOptInRequired',
      ]);
      if (numberKeys.has(key)) payload[key] = Number(raw);
      else if (booleanKeys.has(key)) payload[key] = raw === 'true';
      else payload[key] = raw.trim() || null;
    }
    return payload;
  };

  const titles: Record<string, { title: string; description: string }> = {
    clinical: { title: 'Clinical defaults', description: 'Charting and notes behaviour for all practitioners.' },
    billing: { title: 'Billing & tax', description: 'Invoice numbering, tax and payment terms.' },
    communication: { title: 'Communication', description: 'Reminders and outbound message identity.' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {group === 'clinical' ? <Stethoscope className="h-4 w-4" /> : group === 'billing' ? <CircleDollarSign className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          {titles[group].title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{titles[group].description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {group === 'clinical' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField id="soap" label="SOAP notes" value={value('soapNoteEnabled')} onChange={set('soapNoteEnabled')} options={[['true', 'Enabled'], ['false', 'Disabled']]} />
            <SelectField id="mhreq" label="Medical history at booking" value={value('medicalHistoryRequiredAtBooking')} onChange={set('medicalHistoryRequiredAtBooking')} options={[['true', 'Required'], ['false', 'Optional']]} />
            <SelectField id="allergysev" label="Allergy alerts show" value={value('allergyAlertSeverity')} onChange={set('allergyAlertSeverity')} options={[['all', 'All allergies'], ['moderate_and_above', 'Moderate+'], ['severe_only', 'Severe only']]} />
            <SelectField id="chartview" label="Default chart view" value={value('dentalChartDefaultView')} onChange={set('dentalChartDefaultView')} options={[['adult', 'Adult'], ['pediatric', 'Pediatric'], ['mixed', 'Mixed']]} />
          </div>
        )}
        {group === 'billing' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField id="currency" label="Currency code" placeholder="AUD" maxLength={3} value={value('currency')} onChange={set('currency')} />
            <TextField id="taxrate" label="Tax rate %" type="number" placeholder="10" value={value('taxRatePercent')} onChange={set('taxRatePercent')} />
            <TextField id="taxlabel" label="Tax label" placeholder="GST" value={value('taxLabel')} onChange={set('taxLabel')} />
            <TextField id="invprefix" label="Invoice prefix" placeholder="INV-" value={value('invoicePrefix')} onChange={set('invoicePrefix')} />
            <TextField id="terms" label="Payment terms (days)" type="number" placeholder="14" value={value('invoicePaymentTermsDays')} onChange={set('invoicePaymentTermsDays')} />
            <SelectField id="latefee" label="Late fees" value={value('lateFeeEnabled')} onChange={set('lateFeeEnabled')} options={[['true', 'Enabled'], ['false', 'Disabled']]} />
          </div>
        )}
        {group === 'communication' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField id="sms" label="SMS sender name" maxLength={32} placeholder="BrightSmile Dental" value={value('smsSenderName')} onChange={set('smsSenderName')} />
            <TextField id="replyto" label="Reply-to email" type="email" placeholder="reception@practice.com.au" value={value('replyToEmail')} onChange={set('replyToEmail')} />
            <SelectField id="apptrem" label="Appointment reminders" value={value('appointmentRemindersEnabled')} onChange={set('appointmentRemindersEnabled')} options={[['true', 'Enabled'], ['false', 'Disabled']]} />
            <TextField id="lead" label="Reminder lead time (hours)" type="number" placeholder="24" value={value('reminderLeadHours')} onChange={set('reminderLeadHours')} />
            <SelectField id="recallrem" label="Recall reminders" value={value('recallRemindersEnabled')} onChange={set('recallRemindersEnabled')} options={[['true', 'Enabled'], ['false', 'Disabled']]} />
            <SelectField id="mkt" label="Marketing opt-in required" value={value('marketingOptInRequired')} onChange={set('marketingOptInRequired')} options={[['true', 'Yes'], ['false', 'No']]} />
          </div>
        )}
        <Button size="sm" onClick={() => mutation.mutate(buildPayload())} disabled={mutation.isPending}>Save</Button>
      </CardContent>
    </Card>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${id}`}>{label}</Label>
      <Input id={`st-${id}`} type={type} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`st-${id}`}>{label}</Label>
      <Select id={`st-${id}`} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </Select>
    </div>
  );
}
