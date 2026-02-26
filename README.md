# Murrayhill HOA Portal

AI-powered HOA community portal for homeowners to check property compliance via photo upload, browse architectural guidelines, and anonymously report violations — with a board admin dashboard.

## Features

| Feature | Description |
|---|---|
| **Compliance Check** | Upload a photo of your property and chat with an AI agent (Claude) to check against HOA guidelines |
| **Guideline Browser** | Browse all ARC guideline documents, searchable by category |
| **Violation Reports** | Submit anonymous reports of potential violations for board review |
| **Admin Dashboard** | HOA board login to view all submissions and manage violation reports |

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9 or later
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)
- The HOA guidelines PDF (`2023-MOA-Design-Guidelines.pdf`) placed in the directory set by `GUIDELINES_PATH`

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd murrayhill-hoa
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set each variable (see [Environment Variables](#environment-variables) below).

> **Security:** Never commit `.env.local` to version control. It is already listed in `.gitignore`.

### 3. Create runtime directories

These are created automatically on first run, but you can create them manually:

```bash
mkdir -p uploads/submissions uploads/reports guidelines-cache data
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the homeowner portal.

The admin portal is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Updating the Guidelines PDF

When the HOA publishes a new version of the design guidelines PDF, follow these steps:

### 1. Replace the PDF

Put the new PDF in the folder set by `GUIDELINES_PATH` in `.env.local`, naming it exactly:
```
2023-MOA-Design-Guidelines.pdf
```

### 2. Re-extract the guideline text

```bash
node scripts/extract-guidelines.cjs
```

This reads the PDF and writes one `.txt` file per category into `src/data/guidelines/`. The console output shows how many characters were extracted per category — if any show 0 or suspiciously few characters, the section heading in the PDF may have changed and `scripts/extract-guidelines.cjs` will need to be updated to match the new heading text.

### 3. Review the output

Spot-check a few files in `src/data/guidelines/` to confirm the content looks correct. You can manually edit any `.txt` file to fix extraction artifacts.

### 4. Commit the updated files

```bash
git add src/data/guidelines/
git commit -m "update: refresh guidelines from updated PDF"
```

The app reads these static `.txt` files directly at runtime — no PDF parsing happens in production.

---

## Smoke Tests

Playwright smoke tests verify that the main pages load and key UI elements are present. They do **not** call the Claude API or write any real data.

### Run locally

**Prerequisites:** the app must be built first (the test runner starts `next build && next start` automatically).

Install the Chromium browser one time:

```bash
npx playwright install --with-deps chromium
```

Then run the smoke suite:

```bash
npm run test:e2e
```

To watch tests run in a headed browser (useful for debugging):

```bash
npx playwright test --headed
```

To open the interactive UI mode:

```bash
npx playwright test --ui
```

Test results and traces are written to `playwright-report/` (gitignored).

### What the smoke tests cover

| Test | Description |
|---|---|
| Homepage loads | Header, all three tab triggers, and Admin link are visible |
| Compliance tab default | "Check Compliance" is active by default and shows the upload area |
| Guidelines tab | Clicking the tab loads the guideline sidebar with category names |
| Report tab | Clicking the tab shows the address, description fields, and submit button |
| Footer | Footer text is present |
| Admin login form | `/admin` renders username, password fields and a sign-in button |
| Admin rejects bad creds | Submitting wrong credentials shows an error and stays on `/admin` |

### CI (GitHub Actions)

The workflow at `.github/workflows/smoke-test.yml` runs automatically on every push and pull request to `main`.

It uses placeholder values for `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET` (the smoke tests don't require valid credentials to pass). If you want the login-rejection test to use your real admin credentials, add them as [repository secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets):

| Secret | Description |
|---|---|
| `ADMIN_USERNAME` | Your admin portal username |
| `ADMIN_PASSWORD` | Your admin portal password |
| `JWT_SECRET` | Your JWT signing secret |

The Playwright HTML report is uploaded as a CI artifact (`playwright-report`) and retained for 14 days.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and set each value.

| Variable | Required | Description |
|---|---|---|
| `ADMIN_USERNAME` | Yes | Admin portal login username |
| `ADMIN_PASSWORD` | Yes | Admin portal login password — **use a strong password** |
| `JWT_SECRET` | Yes | Secret for signing admin session tokens — must be 32+ random characters |
| `ANTHROPIC_API_KEY` | Yes | Claude API key from [console.anthropic.com](https://console.anthropic.com) |
| `GUIDELINES_PATH` | Yes | Absolute path to the folder containing `2023-MOA-Design-Guidelines.pdf` |
| `GUIDELINES_CACHE_PATH` | Yes | Absolute path to where runtime cache files are stored |
| `UPLOADS_PATH` | Yes | Absolute path to where uploaded photos are stored |
| `DATABASE_PATH` | Yes | Absolute path to the SQLite database file (e.g. `/path/to/data/hoa.db`) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name shown in the browser tab (default: `Murrayhill HOA Portal`) |

### Generating a strong JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project Structure

```
murrayhill-hoa/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main portal (3 tabs: Compliance / Guidelines / Report)
│   │   ├── admin/page.tsx            # Admin login + dashboard
│   │   └── api/                      # API routes
│   │       ├── analyze/              # POST: photo upload + Claude vision analysis
│   │       ├── chat/                 # POST: follow-up chat messages
│   │       ├── report/               # POST: anonymous violation report
│   │       ├── guidelines/           # GET: guideline list + HTML content
│   │       ├── uploads/              # GET: serve uploaded images
│   │       └── admin/                # Admin-only routes (JWT protected)
│   ├── components/
│   │   ├── compliance/               # Photo uploader, chat UI, issue list
│   │   ├── guidelines/               # Sidebar + document viewer
│   │   ├── report/                   # Anonymous report form
│   │   └── admin/                    # Login, dashboard, submissions, reports
│   ├── data/
│   │   └── guidelines/               # Pre-extracted guideline text files (one .txt per category)
│   └── lib/
│       ├── claude.ts                 # Anthropic SDK wrapper + HOA system prompt
│       ├── db.ts                     # SQLite connection + schema
│       ├── auth.ts                   # JWT sign/verify
│       ├── guidelines.ts             # Reads pre-extracted .txt files per category
│       ├── storage.ts                # File upload helpers
│       ├── validate.ts               # Image magic-byte validation + input limits
│       ├── rateLimit.ts              # In-memory rate limiter
│       └── middleware.ts             # Admin auth guard for API routes
├── scripts/
│   └── extract-guidelines.cjs        # Re-run when PDF is updated (see below)
├── uploads/                          # Uploaded photos (gitignored)
├── guidelines-cache/                 # Runtime cache (gitignored)
├── data/                             # SQLite database (gitignored)
├── .env.local                        # Your local secrets (gitignored)
└── .env.local.example                # Template — copy this to .env.local
```

---

## Security

The following security controls are in place:

### Authentication
- Admin login uses a username/password checked against environment variables (never stored in the database)
- Sessions are short-lived JWTs (8-hour expiry) stored in `localStorage`
- All admin API routes require a valid `Authorization: Bearer <token>` header

### File Upload Safety
- **Magic byte validation**: uploaded files are inspected at the byte level — file extension and `Content-Type` headers from the browser are not trusted
- **Allowed formats**: JPEG, PNG, GIF, WebP only
- **Size limit**: 10 MB maximum per upload
- **Safe filenames**: uploaded files are saved with random UUIDs — original filenames are discarded
- **Extension derived from validated MIME type** — not from the client-supplied filename

### Path Traversal Protection
- The file-serving route (`/api/uploads/[...path]`) validates that all resolved paths remain within the configured `UPLOADS_PATH` directory before reading any file

### Input Limits
All text inputs are enforced server-side:

| Field | Max length |
|---|---|
| Chat messages | 2,000 characters |
| Report address | 500 characters |
| Report description | 5,000 characters |
| Report notes | 2,000 characters |

### Rate Limiting
- `/api/analyze` (photo submission): **10 requests per IP per hour**
- `/api/chat` (follow-up messages): **60 requests per IP per hour**

> **Note:** The current rate limiter is in-memory and works well for a single server. For multi-instance Vercel deployments, replace it with [Upstash Redis Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview).

### HTTP Security Headers
Applied globally via `next.config.mjs`:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-XSS-Protection` | `1; mode=block` |

### What Is Not Collected
- Homeowner identity — photo submissions are fully anonymous
- Violation reporter identity — reports contain no PII about the submitter

---

## Deploying to Vercel

> **Important:** The default local setup uses SQLite and local filesystem storage. Both are incompatible with Vercel's serverless/ephemeral environment. The following changes are required before deploying.

### Required Changes for Vercel

#### 1. Replace SQLite with a hosted database

Recommended options:
- **[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)** — zero-config, integrates directly with Vercel projects
- **[Supabase](https://supabase.com)** — managed Postgres with a generous free tier
- **[PlanetScale](https://planetscale.com)** — serverless MySQL

Update `src/lib/db.ts` to use your chosen database's client library instead of `better-sqlite3`.

#### 2. Replace local file storage with cloud object storage

Serverless functions cannot write to the filesystem reliably. Recommended options:
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** — simplest if already on Vercel
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** — S3-compatible, no egress fees
- **[AWS S3](https://aws.amazon.com/s3/)** — industry standard

Update `src/lib/storage.ts` to upload to your chosen object store and return a public URL.

#### 3. Replace in-memory rate limiting with Redis

```bash
npm install @upstash/ratelimit @upstash/redis
```

See the [Upstash Rate Limiting docs](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) for a drop-in replacement for `src/lib/rateLimit.ts`.

#### 4. Set environment variables in Vercel

In your Vercel project dashboard → **Settings → Environment Variables**, add all variables from `.env.local.example`. Remove the `*_PATH` filesystem variables and replace with cloud storage credentials.

#### 5. Cache guideline HTML in the database

The `GUIDELINES_CACHE_PATH` local disk cache won't work on serverless. Store converted HTML in a `guideline_cache` database table instead, keyed by slug.

---

## Tech Stack

- **[Next.js 14](https://nextjs.org)** (App Router, TypeScript)
- **[Tailwind CSS](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)**
- **[Anthropic Claude](https://anthropic.com)** (`claude-sonnet-4-6`) — vision + chat
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — local SQLite database
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** — used by `scripts/extract-guidelines.cjs` to extract text from the guidelines PDF (not used at runtime)

---

## License

Private — Murrayhill HOA internal use.
