# CrayCycle — Offline-first crayfish breeding calendar

CrayCycle is a React + TypeScript progressive web app for individual female crayfish brood observations and farm care scheduling. It is a standalone prototype designed for a capstone demonstration. No remote account, API key, or backend is needed.

## Install and run

Prerequisites: **Node.js 20.19+ or 22+**, npm, and internet access **only to download dependencies the first time**.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). On a phone, run a production build and serve it over **HTTPS**; the PWA service worker and install prompt usually require HTTPS (localhost is an exception).

```bash
npm run test
npm run build
npm run preview
```

To install on Android: deploy the compiled `dist/` directory at the **root path of an HTTPS site**, open the site in Chrome, visit it while online once, and use **Install app / Add to Home screen**. Reopen it without internet only **after** it has successfully loaded and cached its resources. Don't expect the service worker to work when opening `index.html` via `file://` or when running the development server offline for the first time. Use a separate test browser profile for the defense.

## What is inside

- **Home:** Registered female breeders, confirmed egg-bearing counts, hatch planning windows, upcoming and overdue farm tasks, observed outcomes.
- **Calendar:** Monthly, weekly and daily views; navigation, date selection, breeder/tank/event filters, color-coded observations and ranges, manually editable events, tasks.
- **Breeders:** Eight clearly labeled demo females, three tanks, individual records, a brood timeline and statuses; prevent accidental multiple simultaneous active cycles per female.
- **Lifecycle:** Pairing, eggs first observed, known laying date (optional), confirmed hatching, attached juveniles, independent juveniles, nursery transfer, outcomes and juvenile counts.
- **Tasks:** Create, edit, complete, reopen, reschedule, delete; overdue/upcoming summaries. Reminders appear **in-app**, not as guaranteed background notifications.
- **Records:** Monthly observations charts, confirmed outcomes, CSV export and JSON backup.
- **Settings:** Farm tanks, per-species incubation ranges, local-data notices, JSON backup/restore, regenerate demo samples while protecting user entries.
- **Offline:** IndexedDB through Dexie (no localStorage database), PWA caching through `vite-plugin-pwa`, app navigation and data edits work after installation without network.

## Breeding estimate semantics

The initial example configuration uses **42–70 days** (6–10 weeks) for **Australian redclaw** (`Cherax quadricarinatus`). This is a configurable **illustrative planning range**, not a species-wide or environment-independent certainty. The user must configure a reference for other species; **the app makes no estimate for an unconfigured species**.

Earliest estimated hatch = reference date + minimum days; latest = reference date + maximum days. The reference date is the **known egg-laying date** when entered; otherwise, the **first eggs-observed date** is used, and the range is **explicitly provisional**. This provisional range may be inaccurate because eggs might have been laid before the farmer first observed them. The calendar never automatically creates an actual hatching record; only a person entering the hatching date can do so. Once hatching is confirmed, the estimated range no longer appears as upcoming, but the old reference observations remain on the cycle record. For research deployment, the 42–70-day example should be evaluated against the chosen population and aquaculture references rather than treated as universal.

## Offline data safeguards

- First launch creates **DEMO DATA**. Edits to sample records become personal records, so a demo reset won't erase those edits.
- Demo reset deletes only unedited demo samples and preserves sample parents needed by user-created cycles, events or tasks.
- All saved data remains **in that browser on that device**. There is **no automatic synchronization, encryption or verified multi-user account access**. Browser storage resets, private browsing or device loss can destroy records.
- Use **Settings > Export backup** to save a JSON file regularly; **Restore JSON** is an explicitly confirmed replacement operation, not a merge. An exported CSV is for tabular review, not restorable backup.
- Browser background notifications are **not implemented**. Reminders are in-app only. Push alerts while fully closed require a separate platform-specific solution.
- For multiple staff devices, plan server synchronization, conflict management and secure access controls before a real deployment. Current users can share a single installed device or exchange backups manually.

## Suggested capstone live demonstration

1. Open Home. Explain the **DEMO DATA** indicator and no-server operation.
2. Open Breeders and register a new female assigned to a tank.
3. Start a breeding cycle. Record eggs first observed on `2026-10-01` for `Cherax quadricarinatus`.
4. Open Calendar in November/December 2026. The **provisional** window should read November 12–December 10, 2026.
5. Add a dated egg inspection task and finish it from Tasks or Calendar.
6. Record actual hatching through the breeder's cycle. Explain that observed and estimated dates are separate.
7. Export a backup, refresh the app, and show that data remains. Turn Wi-Fi off **after verifying PWA installation/cache** and repeat an edit; reload offline.
8. Turn Wi-Fi back on and optionally restore the backup (this replaces existing data).

## Testing checklist

`npm run test` includes calculations, range versus actual confirmation, persistence in mocked IndexedDB, and demo cleanup linked-record safety. Automated tests should be augmented with these manual tests on target hardware:

| Scenario | Expected |
| --- | --- |
| Add breeder and assign tank | Appears in registry and persists after reload |
| Duplicate breeder code | Rejected |
| Start two active broods for same female | Second blocked until original closed |
| Eggs observed vs known laying date | Correctly labeled provisional vs known-base estimate |
| Change incubation reference | Calendar hatch window immediately recalculates |
| Confirm actual hatching | A distinct confirmed event; estimated event is no longer displayed as active |
| Create/edit/reschedule/delete calendar event | Immediately reflected in date agenda |
| Task completion/reopen | Persisted in local database |
| Disconnect after PWA install and reload | Shell, calendar, breeder/task creation still work |
| Export and restore JSON | Explicit consent, data restored as exported |
| Regenerate demo with user-linked samples | User-created or modified data preserved |
| Mobile 360px and desktop layout | No lost actions or inaccessible forms |

## Architecture

```
src/
  App.tsx               application shell, dialogs and mutation handlers
  components/Forms.tsx  persistent create/edit workflows
  components/UI.tsx     shared form and event UI
  pages/                Home, Calendar, Breeders, Tasks, Records, Settings
  lib/db.ts             Dexie schema, snapshot, deletions and demo reset
  lib/dates.ts          hatch date estimates and validation
  lib/events.ts         derived calendar timeline
  lib/seed.ts           clearly labeled sample data
  lib/backup.ts         JSON backup / CSV report
  styles.css            responsive UI styling
public/icons/            installable PWA icons
tests/                   Vitest unit and offline record tests
```

## Development limitations and next steps

This project is a **prototype**, not a verified breeding advisory system. Date references need species- and local-temperature-specific validation. There is no hardware sensor input, remote SMS, secure admin login, automatic synchronization, automatic cloud backup, role enforcement, or guaranteed background reminders. A later phase can add an Express.js/PostgreSQL synchronization adapter without replacing the current UI and local data model, together with unique device identifiers, event-level sync IDs, audit timestamps and conflict resolution.
