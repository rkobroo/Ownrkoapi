import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videoRequests = pgTable("video_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  platform: text("platform").notNull(),
  videoId: text("video_id"),
  title: text("title"),
  description: text("description"),
  duration: text("duration"),
  durationSeconds: integer("duration_seconds"),
  thumbnail: json("thumbnail").$type<{
    url: string;
    width: number;
    height: number;
  }>(),
  author: json("author").$type<{
    name: string;
    url: string;
  }>(),
  uploadDate: text("upload_date"),
  viewCount: integer("view_count"),
  mainPoints: text("main_points").array(),
  aiSummary: text("ai_summary"),
  downloadLinks: json("download_links").$type<{
    video?: Record<string, string>;
    audio?: Record<string, string>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVideoRequestSchema = createInsertSchema(videoRequests).pick({
  url: true,
});

export type InsertVideoRequest = z.infer<typeof insertVideoRequestSchema>;
export type VideoRequest = typeof videoRequests.$inferSelect;

// API Response Types
export const videoMetadataSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    platform: z.string(),
    video_id: z.string(),
    title: z.string(),
    description: z.string(),
    duration: z.string(),
    duration_seconds: z.number(),
    thumbnail: z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
    }),
    author: z.object({
      name: z.string(),
      url: z.string(),
    }),
    upload_date: z.string(),
    view_count: z.number(),
    main_points: z.array(z.string()),
    ai_summary: z.string(),
    download_links: z.object({
      video: z.record(z.string()).optional(),
      audio: z.record(z.string()).optional(),
    }),
  }),
  timestamp: z.string(),
  processing_time: z.string(),
});

export const apiErrorSchema = z.object({
  status: z.literal("error"),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.string().optional(),
  }),
  timestamp: z.string(),
});

export type VideoMetadataResponse = z.infer<typeof videoMetadataSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
