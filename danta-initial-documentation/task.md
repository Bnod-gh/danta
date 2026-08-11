# DANTA — Australian Dental Practice Management SaaS

## Master Product, Architecture, UX and Development Specification

You are a **senior SaaS architect, NestJS engineer, PostgreSQL/Prisma architect, TanStack frontend engineer, security engineer, dental-practice workflow analyst, and product UX designer**.

You are responsible for designing and incrementally developing **Danta**, a production-grade, multi-tenant Australian Dental Practice Management Software (PMS).

Do NOT treat this as a simple CRUD application.

Danta is a healthcare SaaS platform handling sensitive patient information, clinical records, appointments, dental charts, treatment plans, imaging, invoices, payments, claims, staff access and audit information.

The application must therefore be designed for:

* Multi-tenancy
* Strong tenant isolation
* RBAC/RBA authorization
* Clinical data security
* Australian dental workflows
* HICAPS integration readiness
* Medicare integration readiness
* X-ray/imaging integration readiness
* Multi-practice/multi-location support
* High auditability
* Reliable financial transactions
* Production scalability
* Excellent desktop-first clinical UX
* Responsive tablet/mobile UX
* Future patient mobile application
* Future third-party integrations

---

# 1. PRODUCT NAME

Product:

**Danta**

Category:

**Dental Practice Management SaaS**

Primary market:

**Australia**

Primary users:

* Practice owners
* Dentists
* Oral health practitioners
* Dental hygienists
* Dental therapists
* Dental assistants
* Receptionists
* Practice managers
* Finance/billing staff
* Administrators
* Patients
* SaaS platform administrators

---

# 2. PRODUCT VISION

Build Danta as a modern alternative to traditional dental PMS platforms.

The goal is:

> "Everything a dental practice needs, in one fast, secure and intuitive workspace."

Danta should combine:

* Patient management
* Clinical records
* Dental charting
* Treatment planning
* Appointment scheduling
* Practitioner calendars
* Clinical notes
* Imaging/X-rays
* Documents
* Forms
* Billing
* Payments
* HICAPS
* Medicare readiness
* Recall management
* Patient communication
* Reporting
* Practice analytics
* Inventory
* Staff management
* Multi-location management
* Patient portal
* Future patient mobile application

The interface should feel modern and simple rather than like legacy medical software.

---

# 3. REFERENCE PRODUCTS

Use the following products for functional research and workflow inspiration.

## Dentally

Study:

* Patient management
* Dental charting
* Clinical workflows
* Treatment planning
* Appointment management
* Recalls
* Patient communication
* Imaging
* Reporting
* Multi-site architecture
* HICAPS/Medicare workflows
* Patient portal
* Security

Reference:

https://www.dentally.com/en-au/

Do not copy branding, proprietary UI or source code.

Use only as product/workflow inspiration.

---

## Dental4Windows

Study:

* Australian dental practice workflows
* Billing
* Medicare
* HICAPS
* Treatment planning
* Patient management
* Clinical records
* Imaging
* Reporting
* Legacy PMS workflows that should be improved in Danta

Reference:

https://centaursoftware.me/dental4windows/

Do not copy proprietary implementation.

---

## Zavy360

Study:

* Australian-first dental workflows
* Patient management
* Calendar
* Treatment plans
* Patient communication
* Patient application
* Imaging
* Reporting
* Practice analytics
* Staff permissions
* Recall systems
* HICAPS
* Medicare
* Tyro
* Imaging integrations
* Practice workflows

Reference:

https://www.zavy360.com/

Also inspect its public help documentation when appropriate.

Do not copy proprietary UI or implementation.

---

# 4. PRIMARY UI/UX REFERENCE

Use this dashboard as the primary visual/UI inspiration:

https://dashboardpack.com/live-demo-preview/?livedemo=391194

The reference is the TailPanel/Tailwind dashboard style.

Use it for inspiration for:

* Layout
* Sidebar
* Navigation
* Dashboard cards
* Tables
* Forms
* Filters
* Modals
* Panels
* Spacing
* Typography hierarchy
* Responsive behaviour
* Data-heavy SaaS layouts

IMPORTANT:

Do NOT blindly copy the dashboard.

Adapt its visual language specifically for a dental PMS.

Danta should feel:

* Professional
* Calm
* Clinical
* Modern
* Premium
* Efficient
* Trustworthy
* Accessible
* Data-dense without being cluttered

---

# 5. SECONDARY UI/UX REFERENCE

Use:

https://apexdental-saas-au-swib.arcada.app/

as an additional product/workflow reference.

Pay particular attention to:

* Australian dental workflows
* Calendar
* HICAPS concepts
* X-ray/imaging workflows
* Patient management
* Clinical workspace
* Dashboard
* Billing/payment workflow
* Practitioner workflow

Do not copy implementation or proprietary design.

Use the reference only to understand desired product capabilities and workflow expectations.

If the site cannot be inspected programmatically, do not invent details. Clearly separate observed behaviour from assumptions.

---

# 6. TECHNOLOGY STACK

## Backend

Use:

* NestJS
* TypeScript
* Prisma
* PostgreSQL
* Redis
* Zod
* nestjs-zod
* Swagger/OpenAPI

Backend principles:

* Modular architecture
* Domain-driven modules
* Strong typing
* Zod-first validation
* Prisma for persistence
* Transaction-safe business logic
* Centralized authorization
* Structured error handling
* Audit logging
* Observability
* Testability

---

# 7. FRONTEND

Use:

* React
* TypeScript
* Vite
* TanStack Router
* TanStack Query
* TanStack Form
* TanStack Table
* Zod
* shadcn/ui
* Tailwind CSS
* Lucide icons

Frontend principles:

* Server state belongs to TanStack Query.
* Routing belongs to TanStack Router.
* Forms use TanStack Form + Zod.
* Tables use TanStack Table.
* Avoid unnecessary useEffect.
* Avoid duplicated API state.
* Use reusable domain components.
* Keep clinical workflows extremely fast.
* Minimize unnecessary network requests.
* Use optimistic updates only where safe.
* Never duplicate backend validation rules manually when Zod schemas can be shared.

---

# 8. SINGLE SOURCE OF TRUTH

Zod must be the primary validation/schema contract.

Create a shared package:

packages/schemas

Example:

packages/
schemas/
src/
auth/
tenant/
user/
patient/
appointment/
clinical/
dental-chart/
treatment/
billing/
payment/
claims/
imaging/
communication/
reporting/
inventory/
settings/
common/
index.ts

Schemas must be reusable by:

* Frontend
* Backend
* nestjs-zod
* API contracts
* Forms
* Search/filter validation
* Request validation
* Response validation where appropriate

Do not create independent duplicated validation definitions.

---

# 9. DTO STRATEGY

Use nestjs-zod.

Preferred architecture:

Zod Schema
↓
Shared Type
↓
nestjs-zod DTO
↓
NestJS Controller
↓
Application Service
↓
Prisma

Example concept:

CreatePatientSchema
UpdatePatientSchema
PatientQuerySchema
PatientResponseSchema

Generate/use DTOs from these schemas.

Do not create large manually duplicated DTO structures.

---

# 10. API DOCUMENTATION

Use Swagger/OpenAPI.

Every public API must have:

* Summary
* Description
* Authentication requirements
* Tenant context
* Request schema
* Response schema
* Error responses
* HTTP status codes
* Pagination documentation
* Filtering documentation
* Sorting documentation

Swagger should be available in development and protected appropriately in production.

---

# 11. MULTI-TENANT ARCHITECTURE

Danta is a true multi-tenant SaaS.

Core hierarchy:

Platform
↓
Organisation
↓
Practice
↓
Location
↓
Users / Patients / Clinical Data

A tenant must never be able to access another tenant's data.

Every tenant-owned entity must have an explicit tenant relationship.

Prefer:

tenantId

over relying solely on:

slug
email
domain
user ID

Tenant context must be resolved server-side from the authenticated session/token.

NEVER trust tenantId supplied by the frontend.

---

# 12. TENANT ISOLATION

Every database query involving tenant-owned data must enforce tenant scope.

Bad:

prisma.patient.findUnique({
where: { id }
})

Preferred conceptual pattern:

prisma.patient.findFirst({
where: {
id,
tenantId
}
})

For resources that belong to a practice/location, enforce the entire hierarchy.

Example:

tenant
→ practice
→ location
→ patient

Authorization must verify ownership at every relevant boundary.

Consider implementing a repository/service layer that makes accidental tenant leakage difficult.

---

# 13. RBAC + RBA

Implement both:

## RBAC

Role-Based Access Control.

Example roles:

* Platform Owner
* Platform Admin
* Organisation Owner
* Practice Owner
* Practice Manager
* Dentist
* Specialist
* Hygienist
* Dental Therapist
* Dental Assistant
* Receptionist
* Billing Officer
* Finance
* Read Only

## RBA / Policy Authorization

Do not rely only on roles.

Permissions should consider:

* Tenant
* Practice
* Location
* User
* Role
* Resource
* Action
* Ownership
* Clinical relationship
* Sensitive-data classification

Example:

Dentist A may access patients of Practice 1.

Dentist A should not automatically access patients belonging to Practice 2.

Receptionist may:

* View demographics
* Schedule appointments
* Manage communication

but may not:

* Edit clinical notes
* Sign clinical notes
* Modify completed treatment records
* Access restricted clinical information

Billing staff may access:

* Invoices
* Payments
* Claims

but not necessarily unrestricted clinical notes.

Implement permissions as explicit capabilities.

Examples:

patient:read
patient:create
patient:update
patient:delete
clinical:read
clinical:create
clinical:sign
clinical:amend
dental_chart:read
dental_chart:update
treatment_plan:create
treatment_plan:approve
billing:read
billing:create
payment:process
claims:submit
claims:read
imaging:read
imaging:upload
reports:read
settings:manage
users:manage
audit:read

---

# 14. APPROVAL WORKFLOW

Implement secure tenant onboarding.

Initial organisation:

1. User registers organisation.
2. Organisation is created as pending.
3. First organisation owner account is created but restricted.
4. Platform/Super Admin reviews organisation.
5. Organisation becomes approved.
6. Owner can access the application.
7. Owner invites staff.
8. Staff accounts remain pending until approved/activated according to policy.

Never allow an unapproved tenant to access the main application simply because authentication succeeded.

Authentication ≠ authorization.

---

# 15. AUTHENTICATION

Implement:

* Email/password
* Secure password hashing
* Access token/session
* Refresh token/session rotation
* Logout/revocation
* Email verification
* Password reset
* MFA/2FA
* Session management
* Device/session tracking
* Brute-force protection
* Rate limiting
* Account lockout/risk controls

Use Redis for:

* Rate limiting
* Temporary authentication state
* OTP/verification state
* Distributed locks where necessary
* Session/cache use cases where appropriate
* Background job coordination if required

Do NOT use Redis as the primary source of truth for business data.

PostgreSQL remains authoritative.

---

# 16. DATABASE

Use PostgreSQL + Prisma.

Design the database around domain boundaries.

Major domains:

* Tenant
* Organisation
* Practice
* Location
* User
* Role
* Permission
* UserRole
* Patient
* PatientContact
* PatientAddress
* PatientConsent
* PatientAlert
* EmergencyContact
* MedicalHistory
* Medication
* Allergy
* Appointment
* AppointmentType
* AppointmentStatus
* ProviderAvailability
* Treatment
* TreatmentPlan
* TreatmentPlanItem
* DentalChart
* Tooth
* ToothCondition
* ToothSurface
* PeriodontalRecord
* ClinicalNote
* ClinicalNoteTemplate
* Prescription
* Referral
* ImagingStudy
* ImagingImage
* Document
* Form
* FormSubmission
* Invoice
* InvoiceItem
* Payment
* PaymentAllocation
* Claim
* ClaimTransaction
* HICAPSConfiguration
* HICAPSTransaction
* MedicareConfiguration
* MedicareTransaction
* Recall
* Communication
* SMS
* Email
* Notification
* Inventory
* Product
* StockMovement
* Supplier
* PurchaseOrder
* Staff
* Timesheet
* Report
* AuditLog
* Integration
* Webhook
* APIKey
* Subscription
* Plan
* FeatureFlag

Do not create all tables blindly at once.

Design each domain carefully before implementation.

---

# 17. PATIENT MODEL

Patient is a core entity.

Support:

* Legal name
* Preferred name
* Date of birth
* Sex/gender where appropriate
* Contact information
* Address
* Medicare information where applicable
* Health fund information
* Membership details
* Emergency contact
* GP
* Referrer
* Medical alerts
* Allergies
* Medications
* Medical history
* Consent records
* Communication preferences
* Family relationships
* Documents
* Clinical records
* Treatment plans
* Appointments
* Invoices
* Payments
* Claims
* Imaging
* Recalls

Patient search must support:

* Name
* DOB
* Phone
* Email
* Patient number
* Medicare-related identifiers where appropriate
* Health fund details where appropriate

Sensitive identifiers must be protected appropriately.

---

# 18. PATIENT PROFILE UX

Design a powerful patient workspace.

Suggested structure:

Patient Header

* Name
* DOB
* Patient number
* Alerts
* Outstanding balance
* Next appointment
* Recall status
* Quick actions

Tabs:

Overview
Appointments
Clinical
Dental Chart
Treatment Plans
Imaging
Documents
Forms
Billing
Payments
Claims
Communication
Recalls
History
Audit

The patient profile should become the central workspace for the practice.

---

# 19. DENTAL CHART

Dental charting is a first-class feature.

Support:

* FDI numbering
* Adult dentition
* Primary dentition
* Tooth surfaces
* Missing teeth
* Existing restorations
* Planned treatment
* Completed treatment
* Conditions
* Caries
* Fractures
* Crowns
* Bridges
* Implants
* Endodontic treatment
* Extraction
* Dentures
* Periodontal information
* Tooth notes

Chart interactions should be fast.

Clicking a tooth should open contextual actions.

Example:

Tooth 36
→ Diagnosis
→ Condition
→ Treatment
→ Surface
→ Note
→ Imaging
→ History

Do not make users navigate through multiple pages for simple clinical actions.

---

# 20. TREATMENT PLANNING

Treatment plans must support:

* Multiple plans per patient
* Draft
* Presented
* Accepted
* Partially accepted
* Rejected
* Expired
* Completed
* Cancelled

Treatment plan items:

* Dental item code
* Description
* Tooth
* Surface
* Practitioner
* Fee
* Discount
* Health fund estimate
* Patient estimate
* Gap
* Quantity
* Appointment requirement
* Notes
* Status

Support:

* Alternative treatment plans
* Patient-facing treatment plans
* Digital acceptance
* Electronic signatures
* Treatment plan PDFs
* Payment/deposit
* Plan status tracking

---

# 21. CLINICAL NOTES

Clinical notes must be treated as sensitive clinical records.

Support:

* Templates
* Snippets
* Structured notes
* Free text
* Voice-to-text readiness
* Draft
* Signed
* Locked
* Amended

Once a clinical note is signed:

DO NOT silently overwrite it.

Use an amendment/version model.

Every amendment must preserve:

* Original content
* Author
* Timestamp
* Reason
* Amendment content
* Approver where required

---

# 22. CALENDAR

Calendar is one of the most important Danta screens.

Support:

* Day
* Week
* Multi-day
* Month
* Provider view
* Chair/room view
* Location view
* Resource view

Appointment information:

* Patient
* Practitioner
* Location
* Chair
* Appointment type
* Start
* End
* Status
* Colour/category
* Notes
* Confirmation status
* Check-in status
* Payment status

Statuses:

* Booked
* Confirmed
* Arrived
* In Chair
* Completed
* Cancelled
* Did Not Attend
* Rescheduled

Calendar should support drag/drop carefully with permission and conflict validation.

---

# 23. APPOINTMENT WORKFLOW

Example:

Booked
↓
Confirmation
↓
Reminder
↓
Patient arrives
↓
Check-in
↓
Clinical consultation
↓
Treatment
↓
Billing
↓
Payment / HICAPS
↓
Claim
↓
Completed
↓
Recall

Build this workflow as connected domain events rather than a collection of unrelated CRUD screens.

---

# 24. HICAPS

Design HICAPS as an integration module.

Do not hard-code HICAPS logic throughout billing.

Architecture:

Billing
↓
Payment/Claim Service
↓
HICAPS Adapter
↓
HICAPS integration

Support future providers using the same abstraction.

Example:

PaymentProvider
ClaimProvider
EligibilityProvider

HICAPS implementation can then be one adapter.

Support readiness for:

* HICAPS Terminal
* HICAPS Digital
* Private health insurance claims
* EFTPOS
* Medicare-related workflows
* Government schemes
* Transaction responses
* Reconciliation
* Failed transactions
* Retry states
* Audit trail

Do not fabricate HICAPS API specifications.

Where official credentials/documentation are required, create an integration interface and mock/sandbox adapter first.

HICAPS currently supports PMS integrations where claims and transaction information can flow between PMS and HICAPS. Design Danta around this workflow.

---

# 25. MEDICARE

Design Medicare as an integration boundary.

Support future integration for:

* Patient verification
* Eligibility
* Bulk billing
* Patient claiming
* Medicare Online
* Medicare Easyclaim
* DVA where applicable

Do not pretend that a production Medicare integration exists until the required registration, certificates, APIs and compliance requirements have been completed.

Create:

MedicareProvider

interface.

Then:

MedicareAdapter

with:

* Sandbox/mock implementation
* Production implementation placeholder

Services Australia provides Medicare Online developer pathways for practice management software, including patient verification, claiming and eligibility workflows.

---

# 26. X-RAY / IMAGING

Imaging must be a dedicated domain.

Support:

* X-rays
* Intraoral images
* Panoramic images
* Cephalometric images
* Photos
* PDFs
* Scanned documents
* Future DICOM support

Patient:

Patient
↓
Imaging Study
↓
Images

Support metadata:

* Date
* Practitioner
* Device
* Modality
* Type
* Tooth association
* Notes
* Tags
* Upload source
* Original filename
* Storage location
* MIME type
* Size
* Hash

Do not store large imaging binaries directly in PostgreSQL unless there is a strong reason.

Use object storage.

PostgreSQL stores metadata.

Object storage stores files.

---

# 27. LOCAL IMAGING / DEVICE INTEGRATION

Dental practices may have local imaging devices.

Design an integration architecture that can eventually support:

* TWAIN
* Local imaging bridge
* Vendor software
* DICOM
* Network imaging systems
* Local device agent

Never make the browser directly responsible for every hardware integration.

Use an optional local connector/agent architecture where necessary.

---

# 28. FILE STORAGE

Do not store large files directly in PostgreSQL.

Use:

Object Storage

for:

* X-rays
* Photos
* PDFs
* Consent forms
* Treatment plan documents
* Patient documents

Database stores:

* Metadata
* Object key
* MIME type
* Size
* Hash
* Owner
* Tenant
* Patient
* Access information

Use signed URLs.

Never expose raw storage URLs for sensitive files.

---

# 29. BILLING

Billing must be transaction-safe.

Support:

* Invoice
* Invoice items
* Discounts
* Tax/GST configuration
* Payments
* Refunds
* Credit notes
* Deposits
* Payment allocations
* Outstanding balance
* Statements
* Receipts
* Write-offs
* Adjustments

Never use floating point numbers for money.

Use PostgreSQL Decimal/Numeric.

Every financial mutation must be auditable.

---

# 30. PAYMENTS

Create provider abstraction.

Example:

PaymentProvider

Implement future adapters:

* HICAPS
* Tyro
* Stripe
* EFTPOS
* Bank transfer
* Cash

Never make billing depend directly on a single payment provider.

---

# 31. RECONCILIATION

Support:

* Payment reconciliation
* HICAPS reconciliation
* Terminal transactions
* Claims
* Refunds
* Outstanding invoices
* End-of-day reconciliation

Every external transaction should have:

* External ID
* Provider
* Status
* Request ID
* Correlation ID
* Raw response reference
* Timestamp
* Retry information

Do not store unnecessary sensitive provider payloads.

---

# 32. RECALL SYSTEM

Build a flexible recall engine.

Examples:

* Examination recall
* Hygiene recall
* Periodontal recall
* X-ray recall
* Treatment follow-up
* Custom recall

Support:

* Due date
* Overdue
* Contact attempts
* SMS
* Email
* Phone
* Booked
* Completed
* Failed
* Cancelled

Automate recall campaigns through background jobs.

Redis/BullMQ may be used for asynchronous jobs.

---

# 33. COMMUNICATION

Support:

* Email
* SMS
* In-app notification
* Patient portal notification

Templates:

* Appointment confirmation
* Appointment reminder
* Cancellation
* Recall
* Treatment plan
* Payment receipt
* Invoice
* Welcome
* Form request

Implement:

CommunicationPreference

and consent-aware communication.

Do not hard-code marketing communication into clinical notifications.

---

# 34. PATIENT PORTAL

Future patient portal should support:

* Login
* MFA
* Appointment booking
* Appointment management
* Forms
* Medical history
* Documents
* Treatment plans
* Digital acceptance
* Invoices
* Payments
* Receipts
* Communication
* Family members
* Consent
* Profile management

Patients should never receive access to internal staff-only clinical/system information.

---

# 35. INVENTORY

Support dental inventory:

* Products
* SKU
* Barcode
* Category
* Supplier
* Lot/batch
* Expiry
* Quantity
* Location
* Minimum stock
* Maximum stock
* Purchase price
* Sale price
* Stock movement

Support barcode scanning.

Inventory must be tenant/location scoped.

---

# 36. REPORTING

Dashboard should provide useful practice metrics.

Examples:

* Today's appointments
* Completed appointments
* Cancellation rate
* No-show rate
* Revenue
* Outstanding invoices
* Payments
* Claims
* New patients
* Active patients
* Recall due
* Recall overdue
* Treatment acceptance
* Practitioner utilisation
* Chair utilisation
* Production
* Collections

Reports should support:

* Date range
* Location
* Practitioner
* Appointment type
* Treatment
* Payment type

Use database aggregation efficiently.

Do not load entire datasets into the browser for reporting.

---

# 37. DASHBOARD UX

Use the TailPanel reference as the visual foundation.

Danta dashboard should contain:

Top navigation:

* Global search
* Quick create
* Notifications
* Help
* User menu

Sidebar:

Dashboard
Calendar
Patients
Clinical
Treatment Plans
Imaging
Billing
Claims
Recalls
Communications
Inventory
Reports
Staff
Settings

Dashboard cards:

Today's appointments
Patients today
Revenue
Outstanding
Claims
Recall
No-shows

Then:

Calendar preview
Today's schedule
Recent patients
Outstanding actions
Recent activity

Allow configurable widgets.

---

# 38. GLOBAL SEARCH

Implement fast global search.

Search:

* Patients
* Appointments
* Treatment plans
* Invoices
* Clinical records where permitted
* Documents
* Staff

Use PostgreSQL indexes initially.

Evaluate PostgreSQL full-text search before introducing Elasticsearch/OpenSearch.

Do not add infrastructure unnecessarily.

---

# 39. AUDIT LOGGING

Every important operation must generate an audit event.

Examples:

* Login
* Logout
* Failed login
* User creation
* Permission change
* Patient creation
* Patient update
* Clinical note creation
* Clinical note signing
* Clinical note amendment
* Treatment plan approval
* Invoice creation
* Payment
* Refund
* Claim
* Imaging upload
* Document access
* Data export
* API key creation
* Integration change
* Settings change

Audit record should include:

* tenantId
* userId
* action
* resourceType
* resourceId
* timestamp
* IP
* user agent
* correlation ID
* result
* metadata where appropriate

Do not store full sensitive payloads unnecessarily.

---

# 40. SECURITY

Treat security as a first-class feature.

Implement:

* Tenant isolation
* RBAC
* Policy authorization
* MFA
* Rate limiting
* CSRF protection where applicable
* Secure cookies/token handling
* Password hashing
* Input validation
* Output validation where valuable
* SQL injection protection through Prisma
* XSS protection
* Content Security Policy
* Security headers
* CORS
* File validation
* File malware scanning readiness
* Signed URLs
* Encryption in transit
* Encryption at rest
* Secrets management
* Audit logs
* Session management
* API key hashing
* Key rotation
* Data export controls

Never log:

* Passwords
* Tokens
* API secrets
* MFA secrets
* Full payment card information
* Sensitive health information unnecessarily

---

# 41. AUSTRALIAN PRIVACY

Design with the Australian Privacy Act and Australian Privacy Principles in mind.

Health information must be treated as sensitive information.

Build support for:

* Consent
* Privacy notices
* Access requests
* Correction workflows
* Data export
* Data retention policies
* Data deletion policies where legally appropriate
* Auditability
* Data breach response
* Access controls
* Disclosure controls
* Communication preferences
* Data minimisation

Do not claim that Danta is legally compliant merely because technical controls exist.

Compliance must be validated with appropriate Australian legal/compliance professionals.

The architecture should nevertheless be privacy-by-design.

---

# 42. DATA RETENTION

Do not automatically delete clinical data just because a user clicks "delete".

Clinical records may require retention.

Use:

* Soft deletion
* Archive states
* Retention policies
* Legal hold capability
* Audit history

Separate:

User deletion

from:

Clinical record retention.

---

# 43. API KEYS

Support tenant-level API keys.

Example:

DANTA_xxxxxxxxx

Store only a secure hash of the secret.

Display secret only once.

Support:

* Name
* Created date
* Last used
* Expiry
* Scopes
* Status
* IP restrictions optionally
* Rotation
* Revocation

Limit API keys per tenant according to subscription/configuration.

---

# 44. WEBHOOKS

Create webhook infrastructure.

Support:

* Event type
* Endpoint
* Secret
* Status
* Retry count
* Delivery status
* Last delivery
* Signature

Example events:

patient.created
patient.updated
appointment.created
appointment.updated
appointment.completed
invoice.created
payment.completed
claim.updated
treatment_plan.accepted

Use signed webhook payloads.

---

# 45. BACKGROUND JOBS

Use Redis-backed queues where appropriate.

Examples:

* Appointment reminders
* Recall campaigns
* Email
* SMS
* PDF generation
* Report generation
* Imaging processing
* Webhook retries
* Claim polling
* Reconciliation
* Data exports

Do not move every operation into a queue.

Use synchronous transactions for operations that require immediate consistency.

---

# 46. OBSERVABILITY

Implement:

* Structured logging
* Request IDs
* Correlation IDs
* Error tracking
* Metrics
* Health checks
* Database health
* Redis health
* Queue health
* External integration health

Every external integration should have:

* timeout
* retry policy
* circuit breaker where appropriate
* idempotency
* correlation ID

---

# 47. IDEMPOTENCY

Critical operations must be idempotent.

Especially:

* Payments
* Claims
* HICAPS transactions
* Webhooks
* Appointment creation from external sources
* Notifications
* Imports

Use idempotency keys.

Never allow a network retry to accidentally create a duplicate payment or claim.

---

# 48. FRONTEND ROUTING

Design routes around business domains.

Example:

/dashboard

/calendar

/patients

/patients/:patientId

/patients/:patientId/clinical

/patients/:patientId/chart

/patients/:patientId/treatment-plans

/patients/:patientId/imaging

/patients/:patientId/documents

/patients/:patientId/billing

/patients/:patientId/claims

/billing

/claims

/recalls

/communications

/inventory

/reports

/staff

/settings

/admin

Do not create excessively deep navigation.

Use contextual patient workspace navigation.

---

# 49. COMPONENT ARCHITECTURE

Use shadcn/ui as the base component system.

Build Danta-specific components on top.

Examples:

DantaButton
DantaDataTable
PatientAvatar
PatientStatus
PatientSearch
PatientHeader
AppointmentCard
CalendarAppointment
DentalChart
Tooth
TreatmentPlanCard
ClinicalNoteEditor
InvoiceSummary
PaymentStatus
ClaimStatus
RecallStatus
ImagingViewer
AuditTimeline

Do not modify shadcn primitives unnecessarily.

Build composable domain components.

---

# 50. DESIGN SYSTEM

Base:

shadcn/ui

Tailwind CSS

Typography:

Prefer:

Inter

or

Plus Jakarta Sans

Use one primary font consistently.

Visual direction:

* Clean
* Neutral
* Professional
* Soft clinical accent
* High readability
* Subtle borders
* Moderate radius
* Excellent spacing
* Clear hierarchy

Avoid:

* excessive gradients
* excessive shadows
* overly rounded interfaces
* huge cards
* dashboard clutter
* excessive animations

Dark mode should be supported.

---

# 51. ACCESSIBILITY

Target WCAG 2.2 AA where practical.

Support:

* Keyboard navigation
* Focus states
* Screen readers
* Accessible labels
* Colour contrast
* Reduced motion
* Semantic HTML
* Error messaging
* Accessible dialogs
* Accessible tables

Clinical workflows must remain usable without a mouse.

---

# 52. PERFORMANCE

Optimize for a real dental practice environment.

Calendar must remain responsive with:

* Hundreds of appointments
* Multiple practitioners
* Multiple chairs
* Multiple locations

Patient search should be fast.

Clinical chart should load quickly.

Do not fetch unnecessary data.

Use:

* Pagination
* Cursor pagination where appropriate
* Server-side filtering
* Query caching
* Virtualized lists where required
* Database indexes
* Proper Prisma selects
* Redis caching only where useful

---

# 53. DATABASE INDEXING

Identify indexes based on actual access patterns.

Important candidates:

Patient:

tenantId
patientNumber
dateOfBirth
phone
email
name

Appointment:

tenantId
locationId
practitionerId
startAt
status
patientId

Clinical records:

tenantId
patientId
createdAt

Invoices:

tenantId
patientId
status
issuedAt

Payments:

tenantId
invoiceId
transactionDate

Claims:

tenantId
patientId
status
createdAt

Do not blindly index every field.

---

# 54. TRANSACTIONS

Use Prisma transactions for workflows requiring atomicity.

Example payment:

Invoice
↓
Payment
↓
Payment allocation
↓
Balance update
↓
Audit event

Either everything succeeds or the transaction rolls back.

---

# 55. ERROR HANDLING

Create consistent API errors.

Example:

{
"code": "PATIENT_NOT_FOUND",
"message": "Patient not found",
"requestId": "..."
}

Do not expose internal database errors.

Never expose:

* SQL errors
* stack traces
* internal paths
* secrets
* infrastructure information

---

# 56. API PAGINATION

Standardize pagination.

Example:

GET /patients?page=1&pageSize=25

or cursor-based pagination where appropriate.

Response:

{
"data": [],
"meta": {
"page": 1,
"pageSize": 25,
"total": 100
}
}

Use consistent patterns throughout the API.

---

# 57. TESTING

Testing is mandatory.

Backend:

* Unit tests
* Integration tests
* Authorization tests
* Tenant isolation tests
* Prisma integration tests
* API tests
* Payment tests
* Claim tests

Frontend:

* Component tests
* Form validation tests
* Router tests
* Query behaviour tests

E2E:

* Login
* Tenant onboarding
* Patient creation
* Appointment booking
* Clinical note
* Dental chart
* Treatment plan
* Invoice
* Payment
* Claim
* Recall
* Staff permissions

Most importantly:

TEST CROSS-TENANT ACCESS.

Example:

Tenant A user attempts:

GET /patients/{tenantBPatientId}

Expected:

403 or 404 according to security strategy.

Never leak whether another tenant's resource exists unless explicitly required.

---

# 58. SEED DATA

Create realistic development seed data.

Include:

Organisation:

Danta Demo Dental

Locations:

* Adelaide CBD
* North Adelaide

Users:

* Owner
* Practice Manager
* Dentist
* Hygienist
* Assistant
* Receptionist
* Billing Officer

Patients:

At least 30 realistic fake patients.

Appointments:

At least 100.

Treatment plans.

Invoices.

Payments.

Clinical notes.

Dental chart data.

Imaging metadata.

Recalls.

Do NOT use real patient information.

---

# 59. DEVELOPMENT PHASES

Do not implement everything at once.

Use the following sequence.

## Phase 0 — Architecture

Create:

* Monorepo
* pnpm
* Turbo
* Backend
* Frontend
* Shared schemas
* Database
* Redis
* Docker Compose
* Environment configuration
* CI

Deliver architecture documentation before feature development.

---

## Phase 1 — SaaS Foundation

Implement:

* Tenant
* Organisation
* Practice
* Location
* User
* Roles
* Permissions
* Authentication
* MFA
* Tenant approval
* Audit logs
* API keys
* Settings

---

## Phase 2 — Patient Management

Implement:

* Patient CRUD
* Search
* Patient profile
* Contacts
* Medical history
* Allergies
* Medications
* Alerts
* Consent
* Documents

---

## Phase 3 — Calendar

Implement:

* Appointment types
* Providers
* Chairs
* Availability
* Calendar
* Booking
* Rescheduling
* Cancellation
* Check-in
* Appointment status

---

## Phase 4 — Clinical

Implement:

* Clinical notes
* Templates
* Dental chart
* Tooth conditions
* Treatment history
* Treatment planning
* Periodontal records

---

## Phase 5 — Imaging

Implement:

* Imaging studies
* Image upload
* Image viewer
* Metadata
* Patient association
* Tooth association
* Object storage
* Imaging integration abstraction

---

## Phase 6 — Billing

Implement:

* Services
* Fees
* Treatment billing
* Invoices
* Payments
* Refunds
* Statements
* Receipts

---

## Phase 7 — Australian Claims

Implement integration architecture first.

Then:

* HICAPS
* Medicare
* DVA
* Other required schemes

Only implement real production integrations once official technical access and documentation are available.

---

## Phase 8 — Communication

Implement:

* SMS
* Email
* Templates
* Appointment reminders
* Recall
* Notifications
* Patient communication preferences

---

## Phase 9 — Reporting

Implement:

* Dashboard
* Revenue
* Production
* Collections
* Appointment analytics
* Practitioner analytics
* Recall analytics
* Patient analytics

---

## Phase 10 — Patient Portal

Implement:

* Patient login
* Appointments
* Forms
* Treatment plans
* Documents
* Billing
* Payments
* Communication

---

## Phase 11 — Mobile

Build a patient mobile application after the web platform stabilizes.

Potential future stack:

React Native / Expo

Reuse:

* Zod schemas
* API contracts
* authentication
* business rules

---

# 60. MONOREPO

Recommended structure:

apps/
api/
web/
worker/

packages/
schemas/
database/
auth/
permissions/
ui/
config/
eslint-config/
typescript-config/

docs/
architecture/
api/
database/
security/
compliance/
integrations/
workflows/

infra/
docker/
postgres/
redis/

---

# 61. BACKEND MODULE STRUCTURE

NestJS:

src/
modules/
auth/
tenants/
organisations/
practices/
locations/
users/
permissions/
patients/
appointments/
calendar/
clinical/
dental-chart/
treatment-plans/
imaging/
documents/
billing/
payments/
claims/
hicaps/
medicare/
recalls/
communications/
inventory/
reports/
notifications/
integrations/
audit/
api-keys/
subscriptions/
settings/

Each module should have clear:

controller
service
repository/data-access
schemas
DTOs
domain types
tests

Do not put all business logic into controllers.

---

# 62. SERVICE LAYER RULE

Controllers should be thin.

Controller:

HTTP request
↓
Validation
↓
Authorization
↓
Application service

Service:

Business rules
↓
Repository
↓
Transaction

Never put complex business logic directly in controllers.

---

# 63. PRISMA RULES

Use Prisma for database access.

Avoid:

* giant Prisma queries everywhere
* controllers calling Prisma directly
* leaking Prisma models to frontend
* returning database entities blindly

Map database models into API/domain responses where appropriate.

---

# 64. REDIS RULES

Redis is not the source of truth.

Use Redis for:

* Cache
* Rate limiting
* Queues
* Locks
* Temporary state

Do not store authoritative:

* Patients
* Clinical notes
* Invoices
* Payments
* Claims

in Redis.

PostgreSQL remains authoritative.

---

# 65. INTEGRATION ARCHITECTURE

All external integrations must use adapters.

Example:

integrations/
hicaps/
medicare/
tyro/
sms/
email/
imaging/
accounting/

Each integration should expose a stable internal interface.

Example:

interface ClaimProvider {
checkEligibility()
submitClaim()
getClaimStatus()
cancelClaim()
reconcile()
}

This allows Danta to change providers without rewriting billing/clinical modules.

---

# 66. FEATURE FLAGS

Support feature flags for:

* HICAPS
* Medicare
* Patient portal
* Mobile
* AI
* Imaging
* Advanced reporting
* Multi-location
* Inventory

Feature flags must be tenant-aware where required.

---

# 67. SUBSCRIPTION ARCHITECTURE

Design SaaS billing separately from patient billing.

Two completely different domains:

SaaS Subscription

vs

Dental Patient Billing.

Do not mix them.

Subscription entities:

Plan
Subscription
SubscriptionItem
Usage
Feature
Entitlement

---

# 68. SECURITY BOUNDARIES

Create clear boundaries:

Platform Admin
↓
Tenant
↓
Practice
↓
Location
↓
Staff
↓
Patient

Authorization must be enforced server-side.

Frontend permissions only control UX.

Frontend permissions are NOT security.

---

# 69. FRONTEND SECURITY

Never rely on:

hidden buttons
disabled buttons
hidden routes

for authorization.

A user may manipulate the frontend.

Every protected operation must be authorized by the backend.

---

# 70. DOCUMENTATION

Maintain:

docs/

architecture.md
database.md
security.md
authentication.md
authorization.md
multi-tenancy.md
api.md
clinical-workflows.md
dental-chart.md
billing.md
payments.md
hicaps.md
medicare.md
imaging.md
privacy.md
deployment.md
testing.md

Keep documentation updated as implementation changes.

---

# 71. AI DEVELOPMENT RULES

You are an AI development agent.

Before modifying code:

1. Inspect repository.
2. Understand architecture.
3. Identify existing conventions.
4. Check schemas.
5. Check Prisma models.
6. Check API contracts.
7. Check authorization.
8. Check tests.
9. Identify dependencies.
10. Explain planned changes.

Do not rewrite unrelated code.

Do not introduce unnecessary libraries.

Do not change architecture without explaining why.

Do not silently change database semantics.

Do not break existing functionality.

---

# 72. CHANGE CONTROL

Every implementation task must have:

## Objective

What are we building?

## Scope

Which files/modules are allowed to change?

## Dependencies

What does this depend on?

## Database changes

What schema changes are required?

## API changes

What endpoints change?

## Frontend changes

What screens/components change?

## Security impact

What authorization/data-access changes are required?

## Tests

What tests must be added?

## Migration

How will existing data be migrated?

---

# 73. NEVER DO THIS

Do not:

* Copy Dentally source code.
* Copy Zavy360 source code.
* Copy Dental4Windows source code.
* Copy proprietary designs exactly.
* Assume undocumented APIs.
* Invent HICAPS APIs.
* Invent Medicare APIs.
* Invent X-ray device APIs.
* Store secrets in source code.
* Trust tenantId from frontend.
* Trust role from frontend.
* Store passwords.
* Store raw payment card data.
* Log clinical data unnecessarily.
* Delete clinical records casually.
* Put business logic in controllers.
* Put business data in Redis.
* Create duplicate Zod schemas.
* Create duplicate DTO definitions unnecessarily.
* Use useEffect for server-state management when TanStack Query is appropriate.
* Add Elasticsearch before PostgreSQL search has been evaluated.
* Build every module simultaneously.

---

# 74. DEFINITION OF DONE

A feature is NOT complete simply because the UI works.

Every feature must satisfy:

### Backend

* API implemented
* Zod schema
* nestjs-zod DTO
* Authorization
* Tenant isolation
* Service layer
* Prisma implementation
* Error handling
* Audit where required
* Tests

### Frontend

* TanStack Router
* TanStack Query
* TanStack Form where appropriate
* Zod validation
* shadcn/ui
* Loading state
* Empty state
* Error state
* Permission-aware UI
* Responsive layout
* Accessibility

### Database

* Migration
* Indexes
* Foreign keys
* Constraints
* Tenant relationships

### Documentation

* API
* Workflow
* Architecture
* Security considerations

### Testing

* Unit
* Integration
* Authorization
* Tenant isolation
* E2E where appropriate

---

# 75. FIRST TASK

DO NOT start building all features.

First perform a complete architecture/design phase.

Create:

1. Product requirements document
2. Domain model
3. System architecture
4. Monorepo structure
5. Database architecture
6. Multi-tenancy strategy
7. RBAC/RBA strategy
8. Authentication architecture
9. Authorization architecture
10. API architecture
11. Zod schema architecture
12. Frontend architecture
13. UI/UX design system
14. Calendar architecture
15. Dental chart architecture
16. Treatment planning architecture
17. Imaging architecture
18. Billing architecture
19. HICAPS integration architecture
20. Medicare integration architecture
21. Patient portal architecture
22. Audit architecture
23. Redis architecture
24. File/object-storage architecture
25. Security architecture
26. Australian privacy considerations
27. Testing strategy
28. Deployment architecture
29. Development roadmap
30. Definition of done

Do NOT write large amounts of production code during this phase.

First establish the architecture.

---

# 76. REQUIRED INITIAL OUTPUT

Return the following documents in order:

## 01 — Product Requirements

Define:

* Personas
* Core workflows
* MVP
* Phase 2
* Phase 3
* Future roadmap

## 02 — Domain Architecture

Explain every major domain and how domains interact.

## 03 — Database Design

Provide an initial ERD-level design.

Include:

* Entities
* Relationships
* Tenant boundaries
* Important indexes
* Important constraints

## 04 — Authorization Matrix

Create a permission matrix for:

* Platform owner
* Organisation owner
* Practice manager
* Dentist
* Hygienist
* Assistant
* Reception
* Billing
* Read-only

## 05 — API Architecture

Define REST API conventions.

## 06 — Frontend Architecture

Define:

* Routes
* Layouts
* Components
* State management
* TanStack architecture

## 07 — UI/UX System

Define:

* Typography
* Colours
* Spacing
* Radius
* Shadows
* Components
* Tables
* Forms
* Calendar
* Patient workspace
* Clinical workspace

Use the TailPanel reference as inspiration.

## 08 — Clinical Architecture

Define:

* Dental chart
* Clinical notes
* Treatment plans
* Periodontal records
* Imaging

## 09 — Australian Integration Architecture

Define:

* HICAPS
* Medicare
* DVA
* Tyro
* Imaging
* SMS
* Email

Clearly distinguish:

AVAILABLE INFORMATION

from

REQUIRES OFFICIAL PROVIDER DOCUMENTATION.

## 10 — Security Architecture

Threat model:

* Tenant escape
* Privilege escalation
* Broken object authorization
* Session theft
* API abuse
* File upload attacks
* Sensitive data exposure
* Audit tampering
* Payment duplication
* Claim duplication

## 11 — Implementation Roadmap

Break implementation into small, independently testable tasks.

---

# 77. DEVELOPMENT PRINCIPLE

Build Danta vertically.

Do not build:

100 database tables
↓
then APIs
↓
then frontend

Instead build complete vertical slices.

Example:

Patient Management

Database
↓
Schema
↓
API
↓
Authorization
↓
Frontend
↓
Tests
↓
Audit
↓
Documentation

Then move to:

Calendar

Then:

Clinical

Then:

Treatment

Then:

Billing

This reduces architectural drift.

---

# 78. PRODUCT QUALITY BAR

Danta should eventually feel like:

* Stripe-level financial reliability
* Linear-level UX simplicity
* Notion-level flexibility
* Modern shadcn-style UI
* Professional clinical software
* Australian dental workflow awareness

But never sacrifice:

security
clinical integrity
data correctness
auditability
performance

for visual polish.

---

# 79. FINAL INSTRUCTION

Think like a team consisting of:

* CTO
* Product Manager
* Dental Practice Workflow Consultant
* Senior NestJS Engineer
* Senior React/TanStack Engineer
* PostgreSQL Architect
* Security Engineer
* DevOps Engineer
* UX Designer
* QA Engineer
* Australian healthcare integration specialist

Before implementing anything, identify:

1. What could go wrong?
2. What data is sensitive?
3. What must be transaction-safe?
4. What must be audited?
5. What requires authorization?
6. What belongs to tenant scope?
7. What belongs to practice scope?
8. What belongs to location scope?
9. What should be synchronous?
10. What should be asynchronous?
11. What should PostgreSQL own?
12. What should Redis own?
13. What should object storage own?
14. What requires an external integration?
15. What should be abstracted behind an adapter?
16. What needs an idempotency key?
17. What needs a database constraint?
18. What needs an automated test?

Do not make assumptions where an external provider's official documentation is required.

Do not claim regulatory compliance without validation.

Build Danta incrementally, securely and production-first.


A few important architectural decisions I'd make

1. Use PostgreSQL as the source of truth, Redis as infrastructure.
Redis should handle queues, rate limiting, caching, locks and temporary state—not patients, clinical notes, invoices or payments.

2. Make RBAC + policy authorization a core architectural layer.
For a dental PMS, simple roles aren't enough. A dentist's access should also be constrained by tenant/practice/location and the sensitivity of the resource.

3. Make HICAPS an adapter.
This is particularly important because HICAPS supports PMS integration, terminal transactions, claims and returned transaction information.

4. Treat imaging as its own subsystem.
Zavy's public documentation is a useful indication of the complexity here: dental imaging can involve local hardware, scanners, TWAIN and cloud upload workflows. Don't design X-rays as simply "upload an image to a patient."

5. Design Australian integrations from the beginning, but don't fake them.
Services Australia has specific requirements and developer pathways for Medicare Online/practice software, including registration and technical integration requirements.

6. Privacy needs to be built into the data model.
The OAIC explicitly treats dentists as health service providers and health information as sensitive information.

7. Build the patient workspace around the clinical workflow, not around CRUD.
The most important screen in Danta shouldn't be a generic "Patient Details" page. It should be a Patient Workspace where reception, clinician and billing workflows converge according to their permissions.

8. The calendar and dental chart deserve first-class engineering.
These two areas will probably have a larger effect on whether a dentist actually likes Danta than the dashboard itself.

One other point: the DashboardPack reference you supplied is specifically TailPanel, a Tailwind dashboard, and its page states that its license permits use in SaaS applications. You should still verify the exact license you purchase before shipping it commercially.