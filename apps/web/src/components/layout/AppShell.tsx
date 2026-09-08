import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from '@tanstack/react-router';
import { Users, Calendar, Stethoscope, Image as ImageIcon, CreditCard, MessageSquare, BarChart3, Settings, Shield, Menu, X, ChevronDown, LogOut, Building2, MapPin, UserPlus, CalendarPlus } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@danta/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@danta/ui/dropdown-menu';
import { Sheet, SheetContent } from '@danta/ui/sheet';
import { ScrollArea } from '@danta/ui/scroll-area';
import { cn } from '@danta/ui/utils';
import { useAuth } from '../../lib/auth-context';
import { hasPermission, type NavPermissionKey } from '../../lib/permissions';
import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './theme-toggle';
import { tenantPath } from '../../lib/tenant-routing';

const navItems: Array<{
  label: string;
  to: string;
  permission: NavPermissionKey;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{
    label: string;
    to: string;
    permission: NavPermissionKey;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    label: 'Patients',
    to: '/patients',
    permission: 'patients',
    icon: Users,
    children: [
      { label: 'All Patients', to: '/patients', permission: 'patients' },
      { label: 'Recalls', to: '/recalls', permission: 'patients' },
    ],
  },
  {
    label: 'Appointments',
    to: '/appointments',
    permission: 'appointments',
    icon: Calendar,
    children: [
      { label: 'Schedule', to: '/schedule', permission: 'schedule' },
      { label: 'Today', to: '/appointments', permission: 'appointments' },
      { label: 'Appointment Types', to: '/appointment-types', permission: 'appointments' },
    ],
  },
  {
    label: 'Clinical',
    to: '/clinical-notes',
    permission: 'clinical',
    icon: Stethoscope,
    children: [
      { label: 'Clinical Notes', to: '/clinical-notes', permission: 'clinical' },
      { label: 'Dental Chart', to: '/dental-charts', permission: 'clinical' },
      { label: 'Tooth Conditions', to: '/tooth-conditions', permission: 'clinical' },
      { label: 'Treatment Plans', to: '/treatment-plans', permission: 'clinical' },
      { label: 'Periodontal', to: '/periodontal-records', permission: 'clinical' },
      { label: 'Templates', to: '/templates', permission: 'clinical' },
    ],
  },
  {
    label: 'Imaging',
    to: '/imaging-studies',
    permission: 'imaging',
    icon: ImageIcon,
    children: [
      { label: 'Studies', to: '/imaging-studies', permission: 'imaging' },
      { label: 'Images', to: '/imaging-images', permission: 'imaging' },
    ],
  },
  {
    label: 'Billing',
    to: '/invoices',
    permission: 'billing',
    icon: CreditCard,
    children: [
      { label: 'Invoices', to: '/invoices', permission: 'billing' },
      { label: 'Payments', to: '/payments', permission: 'billing' },
      { label: 'Refunds', to: '/refunds', permission: 'billing' },
      { label: 'Statements', to: '/statements', permission: 'billing' },
      { label: 'Receipts', to: '/receipts', permission: 'billing' },
      { label: 'Claims', to: '/claim-integrations', permission: 'billing' },
      { label: 'Fee Schedule', to: '/fees', permission: 'billing' },
    ],
  },
  {
    label: 'Communication',
    to: '/messages',
    permission: 'communication',
    icon: MessageSquare,
    children: [
      { label: 'Messages', to: '/messages', permission: 'communication' },
      { label: 'Templates', to: '/communication-templates', permission: 'communication' },
    ],
  },
  {
    label: 'Reports',
    to: '/reports',
    permission: 'reports',
    icon: BarChart3,
    children: [
      { label: 'Overview', to: '/reports', permission: 'reports' },
      { label: 'Revenue', to: '/reports/revenue', permission: 'reports' },
      { label: 'Production', to: '/reports/production', permission: 'reports' },
      { label: 'Collections', to: '/reports/collections', permission: 'reports' },
      { label: 'Appointments', to: '/reports/appointments', permission: 'reports' },
      { label: 'Recalls', to: '/reports/recalls', permission: 'reports' },
      { label: 'Patients', to: '/reports/patients', permission: 'reports' },
    ],
  },
  {
    label: 'Practice',
    to: '/settings',
    permission: 'practice',
    icon: Settings,
    children: [
      { label: 'Settings', to: '/settings/general', permission: 'practice' },
      { label: 'Locations', to: '/locations', permission: 'practice' },
      { label: 'Providers', to: '/providers', permission: 'practice' },
      { label: 'Chairs', to: '/chairs', permission: 'practice' },
      { label: 'Users', to: '/users', permission: 'practice' },
      { label: 'Tooth Conditions', to: '/tooth-conditions', permission: 'practice' },
    ],
  },
  {
    label: 'Administration',
    to: '/audit',
    permission: 'audit',
    icon: Shield,
    children: [
      { label: 'Audit Logs', to: '/audit', permission: 'audit' },
      { label: 'API Keys', to: '/api-keys', permission: 'api-keys' },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, permissions, practice, location: userLocation } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const visibleNavItems = navItems.filter(item => hasPermission(permissions, item.permission));

  const toggleExpanded = (to: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-4 border-b">
        <Link to={tenantPath(user?.tenantId, '/dashboard')} className="flex items-center gap-2 font-semibold text-lg" onClick={onNavigate}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">D</span>
          <span className="font-semibold text-lg">Danta</span>
        </Link>
        {onNavigate && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onNavigate}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.children && item.children.some(c => location.pathname.startsWith(c.to)));
            const isExpanded = expandedItems.has(item.to);

            return (
              <div key={item.to}>
                {item.children && item.children.length > 0 ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.to)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l pl-2">
                        {item.children
                          .filter(child => hasPermission(permissions, child.permission))
                          .map(child => {
                            const ChildIcon = child.icon;
                            const childActive = location.pathname === child.to;
                            return (
                              <Link
                                key={child.to}
                                to={tenantPath(user?.tenantId, child.to)}
                                onClick={onNavigate}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                                  childActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                              >
                                {ChildIcon && <ChildIcon className="h-3.5 w-3.5" />}
                                {child.label}
                              </Link>
                            );
                          })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={tenantPath(user?.tenantId, item.to)}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-3 space-y-2">
        {(practice || userLocation) && (
          <div className="space-y-1.5 px-2">
            {practice && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate font-medium">{practice.name}</span>
              </div>
            )}
            {userLocation && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{userLocation.name}</span>
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground text-center pt-1">Danta v1.0.0</p>
      </div>
    </div>
  );
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout, permissions } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch />

          {hasPermission(permissions ?? [], 'appointments') && (
            <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex gap-1.5">
              <Link to={tenantPath(user?.tenantId, '/appointments')}>
                <CalendarPlus className="h-4 w-4" />
                Book Appointment
              </Link>
            </Button>
          )}
          {hasPermission(permissions ?? [], 'patients') && (
            <Button asChild size="sm" className="hidden lg:inline-flex gap-1.5">
              <Link to={tenantPath(user?.tenantId, '/patients')}>
                <UserPlus className="h-4 w-4" />
                New Patient
              </Link>
            </Button>
          )}

          <NotificationBell />
          <ThemeToggle />

          <div className="flex items-center gap-2">
            <div className="hidden xl:block text-right">
              <p className="text-sm font-medium leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize leading-tight">{user?.isSuperadmin ? 'Super Admin' : user?.role.replace(/_/g, ' ')}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl} alt={user?.firstName} />
                    <AvatarFallback className="text-xs font-medium">{getInitials(`${user?.firstName} ${user?.lastName}`)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.isSuperadmin ? 'Super Admin' : user?.role.replace(/_/g, ' ')}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={tenantPath(user?.tenantId, '/settings')} className="flex w-full items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (to: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex lg:flex-col h-full w-64 border-r bg-muted/20">
      <div className="flex h-16 items-center px-4 border-b">
        <Link to={tenantPath(user?.tenantId, '/dashboard')} className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">D</span>
          <span>Danta</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.children && item.children.some(c => location.pathname.startsWith(c.to)));
            const isExpanded = expandedItems.has(item.to);

            return (
              <div key={item.to}>
                {item.children && item.children.length > 0 ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.to)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l pl-2">
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          const childActive = location.pathname === child.to;
                          return (
                            <Link
                              key={child.to}
                                to={tenantPath(user?.tenantId, child.to)}
                              className={cn(
                                'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                                childActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              {ChildIcon && <ChildIcon className="h-3.5 w-3.5" />}
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={tenantPath(user?.tenantId, item.to)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setMobileOpen(true)} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
