# AI-Assisted Development Rules

## Before coding

The AI agent must:

1. inspect the repository
2. inspect package boundaries
3. inspect existing schemas
4. inspect Prisma
5. inspect API conventions
6. inspect frontend conventions
7. inspect authorization
8. inspect tests
9. identify impacted modules
10. propose a small implementation plan

## Scope control

Do not modify unrelated modules.

Do not rewrite working architecture merely for stylistic preference.

Do not introduce dependencies without justification.

## Schema-first

When adding a request contract:

```text
Zod schema
 ↓
inferred type
 ↓
nestjs-zod DTO
 ↓
API
 ↓
frontend form/query
```

## Database-first is not enough

A Prisma model does not constitute a feature.

Complete the vertical slice.

## Security

For every endpoint ask:

- Who can call it?
- Which tenant?
- Which practice?
- Which location?
- Which resource?
- Which state?
- Is the operation auditable?

## External APIs

If official provider documentation is unavailable:

- create an interface
- create a mock/sandbox adapter
- document assumptions
- do not invent production endpoints

## Testing

Every bug fix should include a regression test where practical.

## Migration safety

Before schema changes:

- identify existing data
- assess migration compatibility
- define rollback/recovery strategy
- test migration

## Output format for coding tasks

Before implementation, provide:

### Goal
### Scope
### Files/modules affected
### Database changes
### API changes
### UI changes
### Security impact
### Tests
### Migration notes

Then implement.

## Do not

- bypass authorization to make UI work
- use `any` to silence architectural problems
- duplicate schemas unnecessarily
- use Redis as a database
- place Prisma calls in controllers
- trust client tenant IDs
- trust client roles
- silently overwrite signed clinical records
