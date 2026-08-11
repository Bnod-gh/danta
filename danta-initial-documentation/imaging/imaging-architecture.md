# Imaging and X-ray Architecture

## Goals

Support:

- intraoral X-rays
- panoramic
- cephalometric
- photographs
- scans
- PDFs
- future DICOM

## Data model

```text
Patient
  ↓
ImagingStudy
  ↓
ImagingAsset
```

An asset contains metadata, not necessarily the binary itself.

## Storage

Large files go to object storage.

Database stores:

- object key
- patient
- tenant
- study
- MIME type
- size
- hash
- capture date
- device
- modality
- type
- tooth association
- uploader

## Security

Files must use:

- tenant-scoped access
- signed URLs
- short URL expiry
- authorization before URL generation
- file type validation

## Viewer

The frontend should provide:

- zoom
- pan
- rotate
- fit-to-screen
- brightness/contrast controls where appropriate
- image metadata
- tooth association
- notes

Do not alter the original image destructively.

## Local hardware

Browser-only hardware access is unreliable for many clinical devices.

Future architecture:

```text
Dental device
   ↓
Local connector/agent
   ↓
Danta API
   ↓
Object storage
   ↓
Patient imaging study
```

## DICOM readiness

Do not implement full DICOM unless required.

Create an abstraction so DICOM can be introduced without rewriting the patient/clinical model.

## Retention

Imaging retention must follow applicable clinical/legal requirements and practice policy.

Do not automatically delete imaging based solely on application-level "delete".
