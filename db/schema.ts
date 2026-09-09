import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const diagnosticCases = sqliteTable(
  "diagnostic_cases",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    studentName: text("student_name").notNull(),
    level: text("level").notNull(),
    examTitle: text("exam_title").notNull(),
    topicFocus: text("topic_focus").notNull().default("全卷"),
    teacherNotes: text("teacher_notes").notNull().default(""),
    status: text("status").notNull().default("uploaded"),
    reportSource: text("report_source").notNull().default("pending"),
    reportJson: text("report_json"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_diagnostic_cases_owner_created").on(table.ownerId, table.createdAt)],
);

export const diagnosticFiles = sqliteTable(
  "diagnostic_files",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull().references(() => diagnosticCases.id),
    ownerId: text("owner_id").notNull(),
    kind: text("kind").notNull(),
    filename: text("filename").notNull(),
    r2Key: text("r2_key").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_diagnostic_files_case").on(table.caseId)],
);
