# Danta UI/UX Design System

## References

Primary visual inspiration:

- DashboardPack/TailPanel reference supplied for Danta
- shadcn/ui component philosophy

Functional references:

- Dentally
- Dental4Windows
- Zavy360
- supplied Apex Dental reference

Do not copy proprietary interfaces.

## Product personality

Danta should feel:

- clinical
- calm
- trustworthy
- modern
- premium
- efficient

Avoid making it look like a generic admin template.

## Typography

Preferred primary font:

Inter

Alternative:

Plus Jakarta Sans

Use one primary typeface consistently.

## Layout

Desktop-first because dental practices commonly use large clinical monitors.

Recommended:

- collapsible sidebar
- compact top navigation
- content max-width where appropriate
- dense but breathable tables
- sticky patient header where useful

## Colour

Use a neutral shadcn-style foundation with a restrained clinical accent.

Define semantic tokens:

```text
background
foreground
card
muted
muted-foreground
border
primary
primary-foreground
success
warning
destructive
info
```

Never encode semantic meaning only through colour.

## Radius

Use moderate radius.

Avoid overly rounded "consumer app" styling.

## Components

Base on shadcn/ui:

- Button
- Input
- Select
- Combobox
- Dialog
- Sheet
- Drawer
- Dropdown
- Tabs
- Table
- Calendar
- Badge
- Tooltip
- Alert
- Form
- Command
- Toast

Danta domain components:

- PatientSearch
- PatientHeader
- PatientAlert
- AppointmentCard
- CalendarAppointment
- Tooth
- DentalChart
- TreatmentPlan
- ClinicalNoteEditor
- InvoiceSummary
- PaymentStatus
- ClaimStatus
- RecallStatus
- ImagingViewer
- AuditTimeline

## Dashboard

Suggested layout:

```text
┌───────────────────────────────────────────────┐
│ Search       Quick Add     Notifications User │
├──────────┬────────────────────────────────────┤
│          │ KPI cards                          │
│ Sidebar  │                                    │
│          │ Today's schedule / actions         │
│          │                                    │
│          │ Recent patients / outstanding      │
└──────────┴────────────────────────────────────┘
```

## Clinical UX

Clinical actions should be reachable with minimal clicks.

Avoid modal overload.

Prefer contextual side panels/drawers where the clinician needs to preserve context.

## Calendar UX

Prioritize:

- clear provider columns
- chair/resource visibility
- drag/drop with confirmation rules
- appointment status
- patient identity
- treatment context
- quick actions

## Accessibility

Target WCAG 2.2 AA where practical.

Keyboard navigation is particularly important for reception and clinical workflows.

## Responsive

Desktop:
full application

Tablet:
optimized clinical/reception workflows

Mobile:
prioritize patient portal and limited staff workflows rather than attempting to compress every desktop screen.
