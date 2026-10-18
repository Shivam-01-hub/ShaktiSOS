# ShaktiSOS

Privacy-first women safety platform demo with a mobile-first SOS experience, satellite device simulator, and protected emergency response dashboard.

> **Safety notice:** This project is a software demonstration and does not contact real emergency services, dispatch police, or provide real satellite communication. Every transmission shown in the app is labelled **SIMULATED SATELLITE TRANSMISSION** or demo mode.

## Project overview

ShaktiSOS uses an explicit-consent emergency model:

- Normal mode has no continuous location sharing, background tracking, or location broadcasting.
- A five-second SOS countdown gives the user a chance to cancel before any location is acquired.
- Emergency mode records a latest location, simulates trusted-contact and operator notifications, and refreshes location every 30 seconds while the alert is active.
- All demo data is stored in browser localStorage; no external API or emergency provider is contacted.

## Features

- User, emergency-operator, and admin authentication with role-protected views.
- Trusted contact add, edit, remove, relationship, phone, and optional email validation.
- Simulated Shakti Beacon pairing, disconnect/reconnect, battery, firmware, and signal state.
- SOS countdown, cancellation, simulated notifications, location history, audit timeline, and closure.
- Emergency evidence controls for camera-permission requests, simulated photos, short video clips, upload state tracking, and operator evidence review.
- False SOS accountability with accidental-trigger tracking, operator classification, audit history, and demo-only warning/restriction/suspension workflow states.
- Stealth emergency simulator with secret PIN, secret gesture, and simulated triple power-button triggers.
- Registration identity verification flow requiring full name, mobile, email, date of birth, address, 12-digit Aadhaar, emergency contact details, and explicit consent.
- Admin-only simulated identity review with Pending Verification, Verified, and Rejected states.
- Operator queue with acknowledge, assistance-dispatched, and resolve actions.
- Responsive mobile-first UI with keyboard-friendly controls, labels, high-contrast status badges, loading/error-safe service boundaries, and privacy disclosures.

## Screenshots

Screenshot placeholders can be added here for the login, SOS home, active emergency, device simulator, and operator dashboard views.

## Architecture

```text
React + TypeScript + Vite
        |
        +-- App.tsx (protected UI routes and view state)
        +-- services/storage.ts (local persistence and demo auth)
        +-- services/sosService.ts (alert and simulated location domain logic)
        +-- services/notificationService.ts (mock notification boundaries)
        +-- types.ts (User, Device, SOSAlert, LocationHistory, AuditLog)
        |
        +-- localStorage (demo-only persistence; no production database)
```

There is intentionally no backend or real database in this prototype. The service boundary is isolated so a future API can replace localStorage without changing the user-facing flows.

## Installation and environment setup

```bash
npm install
npm run dev
```

No secrets or environment variables are required for the local demonstration. Production integrations must use environment variables and a server-side secret store; credentials must never be placed in the client bundle.

## Demo accounts

- User: `user@shaktisos.demo` / `demo123`
- Operator: `operator@shaktisos.demo` / `demo123`
- Admin: `admin@shaktisos.demo` / `demo123`

## Running frontend, build, and tests

```bash
npm run dev
npm run build
npm test
```

## Privacy and security model

Role checks are enforced at the view boundary: user accounts see the personal safety experience, operator accounts see the response queue, and admin accounts see identity review. Registration requires explicit consent to simulated identity verification. Aadhaar is validated as 12 digits, stored only as a SHA-256 digest with a masked last-four display value, and never rendered in full. This is not a substitute for server-side encryption, key management, secure identity storage, or a compliant Aadhaar integration. ShaktiSOS does not connect to real Aadhaar APIs or government systems. SOS location access is event-triggered rather than continuous. The browser geolocation API is not called automatically; demo coordinates are used to make the simulator deterministic and safe. Real authentication, password hashing, server-side authorization, rate limiting, audit storage, and encrypted transport are required before production use.

## Limitations

This is a front-end software prototype. Data is local to the browser, demo accounts are intentionally visible, notifications are simulated, the map is a visual placeholder, and the 30-second refresh is not a real telemetry link. Camera actions request browser permission, but evidence is represented by demo metadata and is not uploaded to an external service. Video sharing is simulated in demo mode. Stealth triggers model mobile behavior but cannot intercept a real device power button from a browser. It does not contact real emergency services.

False-alert warning, restriction, and suspension states are accountability demonstrations only. The application does not automatically collect or enforce real-world fines. Any legal penalty or fine can only be imposed by authorized authorities according to applicable laws and regulations.

## Future hardware integration

Connect a physical device through a secure mobile bridge/BLE protocol, attest device identity, report battery and signal telemetry, and add an offline queue with signed event envelopes. The server should own durable alerts, RBAC enforcement, encrypted audit logs, and notification provider credentials.

## Future real satellite integration notes

Any future satellite adapter must be opt-in, separately audited, clearly disclosed to the user, and isolated behind a server-side provider interface. It must preserve the current privacy rule: no transmission before SOS activation and no transmission after emergency closure. The current implementation remains a simulation.
