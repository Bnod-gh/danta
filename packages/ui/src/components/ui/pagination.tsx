import * as React from "react";
import { cn } from "../../utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} className={cn("flex items-center gap-1", className)} {...props} aria-label="Pagination" />
  )
);
Pagination.displayName = "Pagination";

export interface PaginationContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const PaginationContent = React.forwardRef<HTMLDivElement, PaginationContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-1", className)} {...props} />
  )
);
PaginationContent.displayName = "PaginationContent";

export interface PaginationItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const PaginationItem = React.forwardRef<HTMLDivElement, PaginationItemProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
PaginationItem.displayName = "PaginationItem";

export interface PaginationLinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: "default" | "sm" | "icon";
}

const PaginationLink = React.forwardRef<HTMLButtonElement, PaginationLinkProps>(
  ({ className, isActive, size = "icon", children, ...props }, ref) => (
    <button
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center justify-center gap-1 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive && "bg-primary text-primary-foreground",
        !isActive && "hover:bg-accent hover:text-accent-foreground",
        size === "icon" && "h-9 w-9",
        size === "default" && "h-10 px-3",
        size === "sm" && "h-9 px-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
PaginationLink.displayName = "PaginationLink";

export interface PaginationPreviousProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationPreviousProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-1 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9",
        "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
      aria-label="Previous page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
);
PaginationPrevious.displayName = "PaginationPrevious";

export interface PaginationNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationNextProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-1 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-9",
        "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
      aria-label="Next page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
);
PaginationNext.displayName = "PaginationNext";

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext };
