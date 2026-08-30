import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CalendarClock, Loader2, Search, Stethoscope, User, Wrench } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@danta/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@danta/ui/command';
import { searchAll } from '../../lib/api/search';
import { useAuth } from '../../lib/auth-context';
import { tenantPath } from '../../lib/tenant-routing';

function CommandGroupWithHeading({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <CommandGroup>
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</p>
      {children}
    </CommandGroup>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => searchAll(debounced),
    enabled: open && debounced.trim().length > 0,
  });

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      navigate({ to: tenantPath(user?.tenantId, path) });
    },
    [navigate, user?.tenantId],
  );

  const hasResults =
    (data?.patients.length ?? 0) + (data?.providers.length ?? 0) + (data?.services.length ?? 0) + (data?.appointmentTypes.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex h-9 w-72 items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search patients, procedures…</span>
        <kbd className="pointer-events-none rounded border bg-background px-1.5 font-mono text-[10px] font-medium">Ctrl K</kbd>
      </button>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">Search patients, providers, services and appointment types</DialogDescription>
        <Command>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            <CommandInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search patients, teeth, procedures, or schedule…"
            />
          </div>
          <CommandList>
            {!debounced.trim() && (
              <p className="py-6 text-center text-sm text-muted-foreground">Type to search across the practice.</p>
            )}
            {debounced.trim() && !hasResults && !isFetching && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {(data?.patients.length ?? 0) > 0 && (
              <CommandGroupWithHeading heading="Patients">
                {data!.patients.map((patient) => (
                  <CommandItem key={patient.id} onSelect={() => go(`/patients/${patient.id}`)} className="cursor-pointer justify-start gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">#{patient.patientNumber}</span>
                  </CommandItem>
                ))}
              </CommandGroupWithHeading>
            )}
            {(data?.providers.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroupWithHeading heading="Providers">
                  {data!.providers.map((provider) => (
                    <CommandItem key={provider.id} onSelect={() => go('/providers')} className="cursor-pointer justify-start gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {provider.firstName} {provider.lastName}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroupWithHeading>
              </>
            )}
            {(data?.services.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroupWithHeading heading="Services & Fees">
                  {data!.services.map((service) => (
                    <CommandItem key={service.id} onSelect={() => go('/fees')} className="cursor-pointer justify-start gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{service.name}</span>
                      {service.code && <span className="ml-auto text-xs text-muted-foreground">{service.code}</span>}
                    </CommandItem>
                  ))}
                </CommandGroupWithHeading>
              </>
            )}
            {(data?.appointmentTypes.length ?? 0) > 0 && (
              <>
                <CommandSeparator />
                <CommandGroupWithHeading heading="Appointment Types">
                  {data!.appointmentTypes.map((type) => (
                    <CommandItem key={type.id} onSelect={() => go('/appointment-types')} className="cursor-pointer justify-start gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      <span>{type.name}</span>
                      {type.code && <span className="ml-auto text-xs text-muted-foreground">{type.code}</span>}
                    </CommandItem>
                  ))}
                </CommandGroupWithHeading>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}


