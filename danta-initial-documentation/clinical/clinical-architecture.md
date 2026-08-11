# Clinical Architecture

## 1. Dental chart

Support:

- FDI numbering
- adult dentition
- primary dentition
- surfaces
- conditions
- restorations
- missing teeth
- implants
- crowns
- bridges
- endodontic treatment
- extraction
- dentures
- periodontal data

## 2. Tooth model

A tooth can have:

- anatomical number
- dentition type
- status
- findings
- treatments
- notes
- imaging associations

Surface-level findings should be separate where required.

## 3. Chart states

Distinguish:

- current/observed
- planned
- completed
- historical

Do not overwrite historical clinical state.

## 4. Clinical notes

Support:

- templates
- structured sections
- free text
- draft
- signed
- amended

Signed notes must be versioned.

## 5. Treatment plans

Statuses:

- draft
- presented
- accepted
- partially accepted
- rejected
- expired
- completed
- cancelled

Treatment items include:

- procedure/item code
- tooth
- surface
- provider
- fee
- discount
- patient estimate
- health fund estimate
- gap
- status

## 6. Clinical workflow

```text
Patient
 ↓
Appointment
 ↓
Clinical encounter
 ↓
Assessment
 ↓
Chart update
 ↓
Treatment plan
 ↓
Treatment
 ↓
Clinical note
 ↓
Billing
```

## 7. Clinical integrity

Never silently modify a signed record.

Use amendments.

## 8. Access

Clinical access is more restricted than demographic access.

Authorization should be explicit.

## 9. Clinical templates

Templates should be versioned so historical notes remain understandable even if a template changes later.

## 10. Future clinical extensions

Architecture should allow:

- periodontal charting
- orthodontics
- oral surgery
- endodontics
- prosthodontics
- specialist workflows
- clinical decision support
- AI-assisted documentation

AI features must not silently generate or alter clinical records.
