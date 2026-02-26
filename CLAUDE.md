# Murrayhill HOA Advisor — Claude Instructions

## Workflow
After completing any code changes, always suggest a git commit message summarizing what was changed and why.

## Project Overview
Next.js 14 (App Router, TypeScript) web app for Murrayhill HOA homeowners to:
- Check property compliance by uploading a photo (Claude vision analysis)
- Ask text questions about HOA guidelines (no photo required)
- Browse HOA guideline documents (19 .docx files converted via mammoth.js)
- Submit anonymous violation reports
- Admin dashboard at `/admin` for the HOA board to review submissions

## Key Commands
```bash
npm run dev        # Start dev server at http://localhost:3000
npm run test:e2e   # Run Playwright smoke tests (builds first)
npm run build      # Production build
```

## Stack & Architecture
- **Framework**: Next.js 14 App Router
- **AI**: Anthropic Claude (`claude-sonnet-4-6`) — vision + chat via `src/lib/claude.ts`
- **Database**: SQLite via `better-sqlite3` — singleton in `src/lib/db.ts` using `globalThis.__db` to survive HMR
- **Guidelines**: `.docx` files converted to HTML via mammoth.js, cached to disk — `src/lib/guidelines.ts`
- **File uploads**: Saved outside `public/`, served via `/api/uploads/[...path]` with path traversal protection
- **Auth**: Single shared admin login via env vars, 8h JWT stored in localStorage

## Important File Locations
- Guidelines source `.docx` files: `/Users/ryanvandusen/Desktop/Coding Projects/HOA Compliance and reporting/HOA Guidelines/All Guidelines/`
- Project root: `/Users/ryanvandusen/Desktop/Coding Projects/HOA Compliance and reporting/murrayhill-hoa-advisor/`
- Environment config: `.env.local` (gitignored — never commit)

## Git Remote
The remote is named `HOA-guideline-advisor`, not `origin`. To push:
```bash
git push HOA-guideline-advisor main
# or use origin (also configured):
git push origin main
```

## Known Decisions & Gotchas
- The `EXCLUDE_FROM_DROPDOWN` set in `ComplianceChat.tsx` filters procedural docs (intro, general, review-process, arc-charter) from the compliance guideline selector — only visually-checkable categories are shown
- Text-only questions (no photo) go through `/api/analyze` with `image = null` and use `continueChat([], message)` — compliance_status is set to `inconclusive` for text-only sessions
- Rate limits: 10 requests/hr/IP for `/api/analyze`, 60/hr for `/api/chat`
- mammoth.js and better-sqlite3 must NOT be in `serverExternalPackages` — causes build errors in Next.js 14.2.x
- The `guidelines-cache/` and `uploads/` directories are gitignored runtime artifacts — they regenerate automatically
