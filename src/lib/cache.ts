import { createHash } from 'crypto';
import fs from 'fs';
import { getDb } from './db';
import { ClaudeAnalysisResponse } from './claude';
import { getPdfPath } from './guidelines';

// Bump this string whenever BASE_SYSTEM_PROMPT changes significantly,
// which will invalidate all non-guideline-scoped cache entries.
const CACHE_VERSION = 'v1';

function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, ' ');
}

function makeCacheKey(question: string, slug: string | null): string {
  const input = `${CACHE_VERSION}|${normalizeQuestion(question)}|${slug ?? ''}`;
  return createHash('sha256').update(input).digest('hex');
}

// Returns the mtime of the PDF as a string. When the PDF is replaced,
// all guideline-scoped cache entries are treated as stale and deleted.
function getGuidelineVersion(slug: string | null): string | null {
  if (!slug) return null;
  try {
    return fs.statSync(getPdfPath()).mtimeMs.toString();
  } catch {
    return null;
  }
}

export function getCachedResponse(
  question: string,
  slug: string | null
): ClaudeAnalysisResponse | null {
  const db = getDb();
  const key = makeCacheKey(question, slug);
  const currentVersion = getGuidelineVersion(slug);

  const row = db
    .prepare(`SELECT response, guideline_version FROM question_cache WHERE cache_key = ?`)
    .get(key) as { response: string; guideline_version: string | null } | undefined;

  if (!row) return null;

  // If the guideline file changed since this entry was cached, bust it
  if (currentVersion !== row.guideline_version) {
    db.prepare(`DELETE FROM question_cache WHERE cache_key = ?`).run(key);
    return null;
  }

  // Cache hit — update stats
  db.prepare(`
    UPDATE question_cache
    SET hit_count = hit_count + 1, last_hit_at = CURRENT_TIMESTAMP
    WHERE cache_key = ?
  `).run(key);

  return JSON.parse(row.response) as ClaudeAnalysisResponse;
}

export function setCachedResponse(
  question: string,
  slug: string | null,
  response: ClaudeAnalysisResponse
): void {
  const db = getDb();
  const key = makeCacheKey(question, slug);
  const version = getGuidelineVersion(slug);

  db.prepare(`
    INSERT OR REPLACE INTO question_cache
      (cache_key, guideline_version, response, hit_count, created_at, last_hit_at)
    VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(key, version, JSON.stringify(response));
}
