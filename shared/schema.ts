import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Images table schema
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  url: text("url").notNull(),
  size: text("size").notNull(),
  userId: integer("user_id").references(() => users.id), // Optional user reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertImageSchema = createInsertSchema(images).pick({
  prompt: true,
  url: true,
  size: true,
  userId: true,
});

export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;

// Image generation parameters schema
export const generateImageSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1024x1792", "1792x1024"]).default("1024x1024"),
  quality: z.enum(["standard", "hd"]).default("standard").optional(),
  style: z.enum(["vivid", "natural"]).default("vivid").optional(),
});

export type GenerateImageParams = z.infer<typeof generateImageSchema>;
