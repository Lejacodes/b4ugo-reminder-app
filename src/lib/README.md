# lib

Shared utilities and helpers that are not React components or hooks.

## Current

- **`storage/`** — native SQLite / locked browser storage for records, verified legacy migration and creation results; SecureStore remains for credentials.
- **`sync/`** — atomic domain/outbox repository, revisions, tombstones, retry/conflict handling and authenticated transport.
- **`engines/`, `trips/`, `places/`** — local domain stores used by providers.
- **`api/`** — compatibility facades over those stores plus installation-scoped push registration.

See `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_LOG.md` for current contracts, deployment gates and limitations; `docs/SECURITY.md` retains the broader security guidance.
