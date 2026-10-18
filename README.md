# ShaktiSOS

ShaktiSOS is a **privacy-first women safety platform** built with **React + Vite + TypeScript** and designed as a maintainable app with clear domain modules.

> ⚠️ This project uses **simulations only**. It does **not** connect to real emergency services, police dispatch, or real satellite networks.

## Features

- Authentication (demo user and operator accounts)
- User profile management with privacy mode controls
- Emergency contacts management
- SOS workflow with cancelable countdown
- Emergency active screen
- Simulated satellite messaging
- Simulated location update stream
- Device simulator (battery, connectivity, GPS quality)
- Emergency operator dashboard (role-based)
- Audit logs for key actions
- Mobile-first responsive UI

## Project Structure

```text
src/
  core/
    access.ts           # role-based access control helpers
    sosEngine.ts        # SOS state machine helpers
    *.test.ts           # focused unit tests
  data/
    seed.ts             # demo data seed for simulation
  types.ts              # shared domain models
  App.tsx               # composed feature screens
  App.css               # mobile-first component styling
  index.css             # global styles
```

Additional docs:

- `docs/architecture.md` – architecture and privacy model

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Demo credentials:

- User: `anika@shaktisos.app` / `user123`
- Operator: `operator@shaktisos.app` / `operator123`

## Scripts

```bash
npm run dev     # start Vite dev server
npm run build   # type-check + production build
npm run test    # run focused unit tests
npm run lint    # lint source
```

## Testing

Focused tests validate:

- SOS countdown/activation/cancel workflow (`src/core/sosEngine.test.ts`)
- Role-based access guarantees (`src/core/access.test.ts`)
