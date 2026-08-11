# RBAC + RBA Authorization

## 1. Model

Use:

```text
User
  ↓
Role
  ↓
Permissions

plus

Policy
  ↓
Resource context
  ↓
Tenant / Practice / Location / Ownership
```

## 2. Permissions

Examples:

```text
patient:read
patient:create
patient:update
patient:archive

clinical:read
clinical:create
clinical:sign
clinical:amend

dental_chart:read
dental_chart:update

treatment_plan:read
treatment_plan:create
treatment_plan:approve

billing:read
billing:create
billing:adjust

payment:read
payment:create
payment:refund

claims:read
claims:submit
claims:cancel

imaging:read
imaging:upload
imaging:delete

reports:read
audit:read
users:manage
settings:manage
```

## 3. Roles

Initial roles:

- Platform Owner
- Platform Admin
- Organisation Owner
- Practice Manager
- Dentist
- Specialist
- Hygienist
- Dental Therapist
- Dental Assistant
- Receptionist
- Billing Officer
- Read Only

Roles are collections of permissions, not the final security decision.

## 4. Policy checks

Policy can consider:

- tenant
- practice
- location
- assigned practitioner
- patient relationship
- record type
- action
- record state

Example:

A receptionist can schedule an appointment for a patient in their location but cannot sign a clinical note.

## 5. Clinical record states

Permissions should differ between:

- draft
- signed
- amended
- archived

A signed clinical note should require a dedicated amendment permission.

## 6. Server enforcement

Every protected mutation must check authorization in the API.

Do not trust frontend route guards.

## 7. Deny by default

If no explicit permission/policy allows an operation, deny it.

## 8. Authorization testing

For each protected resource test:

- allowed role
- denied role
- wrong tenant
- wrong practice
- wrong location
- inactive user
- suspended user
- expired session
