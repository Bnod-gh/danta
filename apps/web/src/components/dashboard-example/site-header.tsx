import { Moon, Sun } from "lucide-react";

import { useTheme } from "../../lib/theme-provider";
import { Button } from "@danta/ui/button";
import { Separator } from "@danta/ui/separator";
import { SidebarTrigger } from "@danta/ui/sidebar";

export function SiteHeader() {
  const { resolved, toggle } = useTheme();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={toggle}
          aria-label="Toggle color scheme"
        >
          {resolved === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>
      </div>
    </header>
  );
}

