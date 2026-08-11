# Testing Strategy

## Test pyramid

```text
           E2E
          /   \
     Integration
        /       \
       Unit / Component
```

## Unit tests

Test:

- domain rules
- policy decisions
- parsers
- calculations
- status transitions

## Integration tests

Test:

- Prisma
- PostgreSQL
- authentication
- authorization
- tenant isolation
- transactions

## API tests

Test:

- validation
- HTTP responses
- auth
- permissions
- pagination
- filtering
- errors

## Frontend tests

Test:

- forms
- validation
- components
- route behaviour
- query states
- permission-aware UI

## E2E critical journeys

### Onboarding

```text
Register
 ↓
Pending approval
 ↓
Platform approval
 ↓
Owner login
 ↓
Invite staff
```

### Patient

```text
Create patient
 ↓
Search patient
 ↓
Open workspace
 ↓
Edit demographic data
```

### Appointment

```text
Create
 ↓
Confirm
 ↓
Check-in
 ↓
Complete
```

### Clinical

```text
Open patient
 ↓
Dental chart
 ↓
Clinical note
 ↓
Sign
 ↓
Attempt amendment
```

### Treatment

```text
Create plan
 ↓
Present
 ↓
Accept
 ↓
Complete treatment
```

### Billing

```text
Create invoice
 ↓
Payment
 ↓
Allocation
 ↓
Receipt
```

### Claim

```text
Create claim
 ↓
Submit
 ↓
Provider result
 ↓
Reconcile
```

## Mandatory security tests

Cross-tenant:

- read
- update
- delete
- export

Privilege escalation:

- change role
- access restricted clinical note
- sign note
- refund payment
- submit claim

## Regression

Every production bug should result in a regression test where practical.
