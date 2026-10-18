# ShaktiSOS Architecture

## Stack
- **Frontend**: React + Vite + TypeScript
- **Domain layer**: typed models (`src/types.ts`) and reusable SOS + RBAC engines (`src/core/*`)
- **Data layer**: simulator seed data (`src/data/seed.ts`)

## Privacy-first design
- No real emergency dispatch or police integration.
- Satellite and location messaging are simulation-only.
- Minimal profile fields and user-controlled privacy mode.
- In-app audit trail for authentication, SOS, and profile/contact updates.

## Role-based access
- `user`: profile/contact management, SOS triggering, own activity visibility.
- `operator`: emergency monitoring dashboard and audit oversight.

## SOS workflow
1. User starts SOS trigger.
2. 15-second cancelable countdown begins.
3. Emergency becomes active after countdown.
4. Simulated satellite and location updates stream periodically.
5. Emergency can be marked resolved.
