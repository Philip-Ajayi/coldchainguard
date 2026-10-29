# ColdChainGuard v1.0.0-PROD

ColdChainGuard is a local-first diagnostic co-pilot for vaccine refrigerator and solar cold-chain equipment. This folder contains the source files extracted from the supplied code listing and formatted for readability.

## Requirements

- Node.js 22+
- npm
- Docker and Docker Compose (optional)
- Local model files for QVAC inference, placed in `models/` as expected by the workers

## Run locally

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000`.

For Docker:

```bash
docker compose up --build
```

## Project layout

- `server/` — Express API, SQLite setup/seed data, and isolated OCR, retrieval, and diagnostic workers.
- `src/` — React frontend, components, styling, and TypeScript types.
- Root configuration files — Vite, TypeScript, Tailwind, PostCSS, QVAC, and Docker configuration.

## Notes

- The source listing did not include a `package-lock.json`; if using `npm ci` in Docker, create and include a lockfile or change the Docker build step to use `npm install`.
- The application expects local QVAC model assets under `models/`. Those binary model files were not included in the supplied text.
- Review all electrical and refrigeration diagnostic instructions against the equipment manufacturer's current service documentation before field use.
