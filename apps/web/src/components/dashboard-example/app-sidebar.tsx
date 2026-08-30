import {
  ChartColumn,
  Command,
  Folder,
  LayoutDashboard,
  LifeBuoy,
  ListCollapse,
  Search,
  Settings,
  Users,
  Database,
  FileText,
  FileType2,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@danta/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "shadcn@vercel.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: ListCollapse,
    },
    {
      title: "Analytics",
      url: "#",
      icon: ChartColumn,
    },
    {
      title: "Projects",
      url: "#",
      icon: Folder,
    },
    {
      title: "Team",
      url: "#",
      icon: Users,
    },
  ] satisfies {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
  ] satisfies {
    title: string;
    url: string;
    icon: LucideIcon;
  }[],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: Database,
    },
    {
      name: "Reports",
      url: "#",
      icon: FileText,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileType2,
    },
  ] satisfies {
    name: string;
    url: string;
    icon: LucideIcon;
  }[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <Command className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
