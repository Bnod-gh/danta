# Frontend Architecture

## Stack

- React
- Vite
- TypeScript
- TanStack Router
- TanStack Query
- TanStack Form
- TanStack Table
- Zod
- shadcn/ui
- Tailwind CSS

## State ownership

### Server state

TanStack Query.

Examples:

- patients
- appointments
- invoices
- clinical records

### URL state

TanStack Router.

Examples:

- patient ID
- calendar date
- filters
- search
- pagination

### Form state

TanStack Form + Zod.

### Local UI state

React state for transient UI concerns.

Do not create a global state store unless a real cross-cutting requirement exists.

## Routes

```text
/dashboard

/calendar

/patients
/patients/:patientId

/patients/:patientId/overview
/patients/:patientId/clinical
/patients/:patientId/chart
/patients/:patientId/treatment-plans
/patients/:patientId/imaging
/patients/:patientId/documents
/patients/:patientId/billing
/patients/:patientId/claims
/patients/:patientId/communication
/patients/:patientId/recalls

/billing
/claims
/recalls
/communications
/inventory
/reports
/staff
/settings
```

## Patient workspace

The patient page should be a persistent workspace rather than separate disconnected CRUD pages.

Header:

- patient name
- DOB
- patient number
- alerts
- next appointment
- balance
- quick actions

Navigation:

- Overview
- Clinical
- Chart
- Treatment
- Imaging
- Documents
- Billing
- Claims
- Communication
- Recalls
- History

## Query rules

Use stable query keys.

Avoid fetching large unrelated patient datasets when opening the profile.

Use route loaders/preloading only where it improves UX and is consistent with TanStack Router patterns.

## Forms

Every form must have:

- validation
- loading state
- error state
- dirty state
- accessible labels
- success feedback

## Tables

Use TanStack Table for:

- patients
- appointments
- invoices
- claims
- recalls
- staff
- reports

Use server-side pagination/filtering for large datasets.

## Error boundaries

Provide route-level and application-level error handling.

## Permission-aware UI

Hide/disable actions based on permissions for UX, but never treat this as security.
