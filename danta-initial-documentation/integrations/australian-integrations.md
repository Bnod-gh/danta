# Australian Integration Architecture

## Important rule

This document defines architecture boundaries, not production provider credentials/API contracts.

Do not invent undocumented provider APIs.

Official provider documentation and onboarding requirements must be used before production implementation.

## HICAPS

Treat HICAPS as an adapter.

```text
Billing/Claims
   ↓
ClaimProvider / PaymentProvider
   ↓
HICAPS adapter
   ↓
HICAPS
```

Potential capabilities:

- private health insurance claiming
- payment/EFTPOS workflow
- transaction result handling
- reconciliation
- failure/retry state

Store:

- provider
- external transaction ID
- status
- request/correlation ID
- timestamps
- safe provider metadata

Never store secrets or unnecessary sensitive payloads.

## Medicare

Create:

```text
MedicareProvider
```

Potential future operations:

- eligibility
- patient verification
- claim submission
- claim status
- reconciliation

Use official Services Australia developer requirements before production.

## DVA

Create a separate provider boundary.

Do not mix DVA rules into generic billing logic.

## Tyro

Create a payment/provider adapter.

## SMS

Create:

```text
SmsProvider
```

Possible adapters can be selected by tenant configuration.

## Email

Create:

```text
EmailProvider
```

Support templates and delivery status.

## Imaging

Imaging integrations must be abstracted.

Potential future interfaces:

- ImagingProvider
- LocalImagingConnector
- DicomProvider

## External integration state

Every integration should have:

- configuration
- enabled/disabled state
- credential reference
- health status
- last successful operation
- error status
- audit events

## Webhooks

External callbacks must be:

- authenticated
- signature-validated
- idempotent
- audited
- rate-limited where appropriate

## Retry

Retries must distinguish:

- transient errors
- permanent errors
- authentication errors
- invalid request
- provider outage

Use exponential backoff where appropriate.
