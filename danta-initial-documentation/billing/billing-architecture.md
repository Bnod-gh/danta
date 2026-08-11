# Billing and Payments Architecture

## Separation

Two billing domains exist:

1. Danta SaaS subscription billing
2. Dental patient billing

Keep them completely separate.

## Patient billing

Entities:

- FeeSchedule
- Invoice
- InvoiceItem
- CreditNote
- Payment
- PaymentAllocation
- Refund

## Invoice lifecycle

```text
Draft
 ↓
Issued
 ↓
Partially Paid
 ↓
Paid
```

Alternative:

- voided
- written off
- refunded

## Financial integrity

Use database transactions.

Example:

```text
Payment request
 ↓
idempotency check
 ↓
provider transaction
 ↓
payment record
 ↓
allocation
 ↓
balance
 ↓
audit
```

## Money

Use Decimal/NUMERIC.

Never:

```ts
number + number
```

for authoritative financial calculations where precision matters.

## Payment providers

Use:

```text
PaymentProvider
```

Potential adapters:

- HICAPS
- Tyro
- Stripe
- EFTPOS
- bank transfer
- cash

## Refunds

Do not delete a payment.

Create a refund/reversal record.

## Reconciliation

Support:

- provider transaction
- internal payment
- invoice
- claim
- reconciliation status

## Patient statements

Generate statements from authoritative billing records.

## GST/tax

Do not hard-code tax assumptions.

Create configurable tax treatment and validate Australian tax requirements with accounting/tax professionals.

## Idempotency

Payments must support idempotency.

External transaction IDs must be unique per provider where applicable.
