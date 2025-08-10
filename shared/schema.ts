import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const downloads = pgTable("downloads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  title: text("title"),
  platform: text("platform").notNull(),
  thumbnail: text("thumbnail"),
  duration: text("duration"),
  channel: text("channel"),
  views: text("views"),
  format: text("format").notNull(),
  quality: text("quality").notNull(),
  fileSize: text("file_size"),
  status: text("status").notNull().default("pending"), // pending, analyzing, downloading, completed, failed
  progress: integer("progress").default(0),
  downloadSpeed: text("download_speed"),
  downloadedSize: text("downloaded_size"),
  eta: text("eta"),
  errorMessage: text("error_message"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDownloadSchema = createInsertSchema(downloads).pick({
  url: true,
  format: true,
  quality: true,
});

export const updateDownloadSchema = createInsertSchema(downloads).pick({
  title: true,
  platform: true,
  thumbnail: true,
  duration: true,
  channel: true,
  views: true,
  fileSize: true,
  status: true,
  progress: true,
  downloadSpeed: true,
  downloadedSize: true,
  eta: true,
  errorMessage: true,
  filePath: true,
}).partial();

export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type UpdateDownload = z.infer<typeof updateDownloadSchema>;
export type Download = typeof downloads.$inferSelect;
