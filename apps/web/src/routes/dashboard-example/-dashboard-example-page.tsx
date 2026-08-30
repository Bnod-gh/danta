import * as React from 'react';

import { AppSidebar } from '../../components/dashboard-example/app-sidebar';
import { ChartAreaInteractive } from '../../components/dashboard-example/chart-area-interactive';
import { DataTable } from '../../components/dashboard-example/data-table';
import { tableData } from '../../components/dashboard-example/mock-data';
import { SectionCards } from '../../components/dashboard-example/section-cards';
import { SiteHeader } from '../../components/dashboard-example/site-header';
import { SidebarInset, SidebarProvider } from '@danta/ui/sidebar';

/**
 * Faithful recreation of https://ui.shadcn.com/examples/dashboard
 * (the dashboard-01 block) built on @danta/ui primitives.
 * Standalone showcase route with mock data — Danta's production
 * dashboard at /dashboard is untouched.
 */
export function DashboardExamplePage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
