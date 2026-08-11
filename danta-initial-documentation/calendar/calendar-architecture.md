# Calendar Architecture

## Requirements

Views:

- day
- week
- multi-day
- month

Resources:

- practitioner
- chair
- room
- location

## Appointment

Core fields:

- patient
- practitioner
- location
- resource/chair
- type
- start
- end
- status
- notes
- confirmation
- check-in

## Status lifecycle

```text
Booked
  ↓
Confirmed
  ↓
Arrived
  ↓
In Chair
  ↓
Completed
```

Alternative states:

- Cancelled
- Did Not Attend
- Rescheduled

## Conflict handling

Before booking or moving:

- validate provider availability
- validate chair/resource availability
- validate location
- validate appointment duration
- enforce tenant scope

## Drag/drop

Drag/drop must trigger server-side validation.

Do not assume the browser move is valid.

## Time zones

Practice/location timezone is authoritative for calendar display.

Store instants correctly and convert for display.

## Recurring appointments

Design for recurrence but implement carefully.

Do not create unbounded future appointments automatically.

Use recurrence rules and materialize only the required window where appropriate.

## Reminders

Appointment reminder jobs are asynchronous.

Use idempotent job keys to avoid duplicate reminders.
