import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "jobspy.db");

let db: Database.Database | null = null;

export function initDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "jd-images"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "resumes"), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "exports"), { recursive: true });

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS jd_records (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      parsed_json TEXT,
      source_image_path TEXT,
      source_type TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      jd_record_id TEXT NOT NULL REFERENCES jd_records(id) ON DELETE CASCADE,
      resume_snapshot TEXT NOT NULL,
      skill_match_json TEXT,
      competitiveness_json TEXT,
      strategy_json TEXT,
      learning_plan_json TEXT,
      optimized_resume_text TEXT,
      optimized_resume_pdf_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      match_result_id TEXT REFERENCES match_results(id) ON DELETE CASCADE,
      messages_json TEXT NOT NULL,
      highlights_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

function getDb(): Database.Database {
  if (!db) return initDb();
  return db;
}

// ─── JD Records ───────────────────────────────────────────

export interface JdRecord {
  id: string;
  raw_text: string;
  parsed_json: string | null;
  source_image_path: string | null;
  source_type: "text" | "image";
  created_at: string;
}

export function saveJdRecord(record: Omit<JdRecord, "created_at">): void {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO jd_records (id, raw_text, parsed_json, source_image_path, source_type)
     VALUES (@id, @raw_text, @parsed_json, @source_image_path, @source_type)`,
  ).run(record);
}

export function updateJdParsedJson(id: string, parsed_json: string): void {
  getDb().prepare("UPDATE jd_records SET parsed_json = ? WHERE id = ?").run(parsed_json, id);
}

export function getJdRecords(limit = 50): JdRecord[] {
  return getDb()
    .prepare("SELECT * FROM jd_records ORDER BY created_at DESC LIMIT ?")
    .all(limit) as JdRecord[];
}

export function getJdRecord(id: string): JdRecord | null {
  return (getDb().prepare("SELECT * FROM jd_records WHERE id = ?").get(id) as JdRecord) || null;
}

export function deleteJdRecord(id: string): void {
  // also delete associated files
  const record = getJdRecord(id);
  if (record?.source_image_path) {
    try { fs.unlinkSync(record.source_image_path); } catch { /* ignore */ }
  }
  getDb().prepare("DELETE FROM jd_records WHERE id = ?").run(id);
}

// ─── Match Results ────────────────────────────────────────

export interface MatchResult {
  id: string;
  jd_record_id: string;
  resume_snapshot: string;
  skill_match_json: string | null;
  competitiveness_json: string | null;
  strategy_json: string | null;
  learning_plan_json: string | null;
  optimized_resume_text: string | null;
  optimized_resume_pdf_path: string | null;
  created_at: string;
}

export function saveMatchResult(result: Omit<MatchResult, "created_at">): void {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO match_results
     (id, jd_record_id, resume_snapshot, skill_match_json, competitiveness_json,
      strategy_json, learning_plan_json, optimized_resume_text, optimized_resume_pdf_path)
     VALUES
     (@id, @jd_record_id, @resume_snapshot, @skill_match_json, @competitiveness_json,
      @strategy_json, @learning_plan_json, @optimized_resume_text, @optimized_resume_pdf_path)`,
  ).run(result);
}

export function updateMatchResultField(
  id: string,
  field: "skill_match_json" | "competitiveness_json" | "strategy_json" | "learning_plan_json" | "optimized_resume_text" | "optimized_resume_pdf_path",
  value: string,
): void {
  getDb().prepare(`UPDATE match_results SET ${field} = ? WHERE id = ?`).run(value, id);
}

export function getMatchResults(jdRecordId?: string, limit = 50): MatchResult[] {
  if (jdRecordId) {
    return getDb()
      .prepare("SELECT * FROM match_results WHERE jd_record_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(jdRecordId, limit) as MatchResult[];
  }
  return getDb()
    .prepare("SELECT * FROM match_results ORDER BY created_at DESC LIMIT ?")
    .all(limit) as MatchResult[];
}

export function getMatchResult(id: string): MatchResult | null {
  return (
    (getDb().prepare("SELECT * FROM match_results WHERE id = ?").get(id) as MatchResult) || null
  );
}

export function deleteMatchResult(id: string): void {
  const result = getMatchResult(id);
  if (result?.optimized_resume_pdf_path) {
    try { fs.unlinkSync(result.optimized_resume_pdf_path); } catch { /* ignore */ }
  }
  getDb().prepare("DELETE FROM match_results WHERE id = ?").run(id);
}

// ─── Chat Sessions ────────────────────────────────────────

export interface ChatSession {
  id: string;
  match_result_id: string | null;
  messages_json: string;
  highlights_json: string | null;
  created_at: string;
}

export function saveChatSession(session: Omit<ChatSession, "created_at">): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO chat_sessions (id, match_result_id, messages_json, highlights_json)
       VALUES (@id, @match_result_id, @messages_json, @highlights_json)`,
    )
    .run(session);
}

export function getChatSession(id: string): ChatSession | null {
  return (
    (getDb().prepare("SELECT * FROM chat_sessions WHERE id = ?").get(id) as ChatSession) || null
  );
}

export function getChatSessionsByMatch(matchResultId: string): ChatSession[] {
  return getDb()
    .prepare("SELECT * FROM chat_sessions WHERE match_result_id = ? ORDER BY created_at DESC")
    .all(matchResultId) as ChatSession[];
}

export function getDbPath(): string {
  return DB_PATH;
}

export function getDataDir(): string {
  return DATA_DIR;
}
