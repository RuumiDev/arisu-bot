# Arisu Bot

WhatsApp automation bot focused on rent tracking, group utilities, fun commands, media conversion, and optional AI replies in an Arisu-themed persona.

## Project Snapshot

- Runtime: Node.js (CommonJS)
- Core platform: `whatsapp-web.js` + Puppeteer (WhatsApp Web automation)
- AI layer: OpenAI SDK (`openai`) via `arisu-ai.js`
- Storage: local JSON files in `data/`
- Media processing: `sharp`, `fluent-ffmpeg`, `ffmpeg-static`
- Deployment target: Fly.io (`fly.toml`, `Dockerfile`)
- Health endpoint: Express HTTP server on `PORT` (default 3000)

## Frameworks and Libraries

From `package.json`, the main frameworks/libraries in active use are:

- Messaging and browser automation:
  - `whatsapp-web.js`
  - `puppeteer`
  - `qrcode-terminal`
- API and networking:
  - `axios`
  - `express`
- AI:
  - `openai`
  - `chatgpt` (installed, not primary in current flow)
- Media:
  - `sharp`
  - `fluent-ffmpeg`
  - `ffmpeg-static`
  - local WebP tools in `bin/`
- Utility:
  - `dotenv`
  - `moment`
  - `mime-types`
  - `fs-extra`

## Main Workflows

### 1) Startup and Runtime

1. Boot logs and load JSON state.
2. Determine runtime mode:
   - Docker/Fly: use `/data` for session persistence.
   - Local: use `./session-data`.
3. Initialize WhatsApp client with `LocalAuth` (`clientId: arisu`).
4. Start Express server for health check/status response.
5. Register listeners (`qr`, `authenticated`, `ready`, `disconnected`, `message`, join/leave events).

### 2) Auth and Session Workflow

1. First run prints QR in terminal.
2. User scans QR in WhatsApp mobile app.
3. Session is persisted using `LocalAuth` data path.
4. Reboots reuse saved session unless invalidated.

### 3) Message Handling Workflow

1. Normalize incoming text (`textRaw`, `textLower`).
2. Monkey-patch `message.reply` to skip replies when WhatsApp is not ready.
3. Process command-based routes (`!help`, `!rent`, `!afk`, `!admin`, media commands, etc.).
4. Process natural-language rent intents via `rent-ai.js`.
5. Process Arisu conversational AI when message mentions/calls Arisu.

### 4) Rent Tracking Workflow

1. Rent data lives in `data/rent.json`, keyed by month.
2. Commands update per-member, per-bill status (`paid`/`unpaid`).
3. Additional capabilities:
   - list by member or bill
   - summary and emoji summary
   - month initialization (`!rent nextmonth`)
   - import/export JSON (admin-only)
4. Natural language parser supports Malay/English mixed intents for paid/unpaid and status queries.

### 5) Group Welcome/Goodbye Workflow

1. Templates stored in `data/welcome.json` per group ID.
2. `group_join`/`group_leave` events render template with:
   - `@user`
   - `@group`
3. Admin commands allow set/test for welcome and goodbye templates.

### 6) Media and Fun Workflow

- Anime reaction commands use `waifu.pics`.
- Cat image command uses `cataas.com`.
- Sticker conversion:
  - image -> webp sticker (`!sticker`)
  - sticker -> png (`!unsticker`)
- GIF conversion helper exists in `mediaUtils.js`.

## Authentication and Authorization

### WhatsApp Authentication

- Mechanism: QR-based WhatsApp Web auth via `LocalAuth`.
- Session persistence path:
  - Docker/Fly: `/data`
  - Local: `./session-data`

### Admin Authorization

- Mechanism: phone IDs in `data/admins.json`.
- Validation utility: `utils/admin.js` (`isAdmin`).
- Admin-gated command groups include:
  - shutdown/restart/report/mod tools
  - welcome/goodbye configuration
  - rent import/export
  - add/remove admin

### External API Authentication

- OpenAI: `OPENAI_API_KEY` (required for AI replies)
- Tenor: `TENOR_API_KEY` (required for Tenor fetch helper)

## Objectives (Inferred from Current Code)

- Provide a reliable WhatsApp assistant for a small community/household context.
- Track rent and shared bills quickly from chat.
- Reduce manual admin work in groups (welcome/goodbye, reminders, moderation helpers).
- Keep deployment simple (JSON storage, no external DB required).
- Add personality-rich, multilingual chat interaction (English + casual Malay).

## Problem Statements This Project Solves

- Shared-rent teams struggle to keep payment status visible in real time.
- Group admins need lightweight moderation and announcement tooling inside WhatsApp.
- Daily task reminders and lightweight note lists are fragmented across apps.
- Users want natural-language interactions, not only strict command syntax.

## Current Problems and Risks

Based on the codebase state today:

1. Monolithic core file:
   - `index.js` is very large and mixes command routing, infra, business logic, and AI behavior.
   - This increases maintenance cost and regression risk.

2. Duplicated/overlapping handlers:
   - Repeated event handling patterns (`ready`, `disconnected`, and `group_join` logic split across files).
   - `!rent paid` appears in multiple branches with different parsing styles.

3. Persistence and concurrency limitations:
   - JSON file writes are synchronous and non-transactional.
   - Simultaneous command writes can race and overwrite state.

4. Security/privacy exposure risk:
   - `data/admins.json` contains real user identifiers.
   - Session artifacts and large browser profile directories are present in repository tree (`session-data`, backups).

5. DevEx gaps:
   - No real test suite.
   - Minimal npm scripts (no `start`, no lint, no CI checks).

6. Data quality drift:
   - Bill names vary across months (`gas`, `sewer`, missing fields per member).
   - Inconsistent schema can produce confusing summaries.

7. Temporary media handling risk:
   - GIF conversion uses shared temp filenames, which can conflict under concurrent usage.

## Future Additions (Recommended)

### Architecture

- Split command handlers by domain (`rent`, `admin`, `fun`, `ai`, `media`).
- Introduce command registry and middleware pipeline (auth, validation, logging).
- Move runtime constants and persona text into config files.

### Data and Reliability

- Migrate from raw JSON to SQLite (or at least add atomic write strategy + locks).
- Add schema validation (Zod/Joi) for rent and welcome data.
- Add backup/restore command with versioned snapshots.

### Security and Ops

- Add `.gitignore` hardening for session/profile/cache directories.
- Move admin identities to environment-driven bootstrap or encrypted store.
- Add structured logging and error reporting.
- Add rate limiting/cooldowns for selected commands.

### Product Features

- Richer rent analytics (totals, overdue history, monthly trends).
- Bill due-date reminders and proactive unpaid pings.
- Multi-language response mode toggle per chat.
- Better help UX with categories and examples.

### Engineering Quality

- Add npm scripts: `start`, `dev`, `lint`, `test`.
- Add unit tests for `rent-ai.js` parser and admin gating.
- Add integration smoke tests for command routing.

## Deployment Notes

- `fly.toml` config indicates:
  - app: `arisu-bot`
  - region: `sin`
  - HTTP internal port: `3000`
  - persistent mount at `/data`
- Docker image installs Chromium and ffmpeg for WhatsApp/Puppeteer/media support.

## Key Files

- `index.js`: main bot runtime and command router
- `arisu-ai.js`: AI persona + OpenAI response function
- `rent-ai.js`: natural language rent intent parsing
- `rent-tracker.js`: JSON persistence helpers for rent data
- `utils/admin.js`: admin list and permission checks
- `utils/stickerUtils.js`: image->sticker conversion
- `mediaUtils.js`: GIF->MP4 conversion helper
- `events/onJoinArisu.js`: join-intro behavior
- `data/*.json`: state storage
- `fly.toml`, `Dockerfile`: deployment/runtime setup

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env` with at least:

```env
OPENAI_API_KEY=your_key_here
TENOR_API_KEY=your_tenor_key_here
PORT=3000
```

3. Run bot:

```bash
node index.js
```

4. Scan QR code shown in terminal.

## Command Coverage (High Level)

- Utility: `!help`, `!ping`, `!time`, `!date`, `!remind`, `!afk`, `!back`
- Rent: `!rent ...` plus natural-language rent updates/questions
- Group: `!setwelcome`, `!setgoodbye`, test variants
- Fun/media: `!waifu`, `!mal`, `!sticker`, `!unsticker`, reaction commands
- Admin: moderation + system + data import/export

---

If you want, the next step is a technical refactor plan that breaks `index.js` into modules with zero behavior change first, then adds tests around rent parsing and admin authorization.