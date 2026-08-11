# Authentication Architecture

## Requirements

Support:

- email/password
- email verification
- password reset
- MFA/2FA
- session management
- logout
- session revocation
- rate limiting
- suspicious login controls
- secure recovery

## Authentication vs authorization

Authentication answers:

> Who are you?

Authorization answers:

> What are you allowed to do?

Successful authentication must never automatically grant application access.

## Tenant approval

Initial organisation workflow:

```text
Registration
  ↓
Pending organisation
  ↓
Pending owner access
  ↓
Platform approval
  ↓
Organisation active
  ↓
Owner access
  ↓
Staff invitations
```

## Sessions

Use secure, short-lived access credentials and controlled refresh/session mechanisms.

Store refresh/session secrets safely.

Support revocation.

Track:

- session ID
- user
- tenant
- createdAt
- lastSeenAt
- expiry
- device metadata where appropriate

## MFA

Support TOTP initially.

Future options:

- WebAuthn/passkeys
- hardware security keys

MFA secrets must never be logged.

## Passwords

Use a modern password hashing algorithm such as Argon2id where supported.

Never store plaintext passwords.

## Rate limiting

Use Redis-backed rate limiting for:

- login
- password reset
- verification
- MFA
- public endpoints
- API keys

## Account states

Example:

- invited
- pending
- active
- suspended
- disabled
- locked

The backend must enforce state.

## API keys

API secrets are shown once and stored as hashes.

Support:

- scopes
- expiry
- revocation
- rotation
- last used
- tenant ownership
