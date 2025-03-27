import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
});

export const streams = pgTable("streams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category"),
  tags: text("tags").array(),
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  startedAt: timestamp("started_at"),
});

export const insertStreamSchema = createInsertSchema(streams).pick({
  userId: true,
  title: true,
  description: true,
  thumbnailUrl: true,
  category: true,
  tags: true,
  isLive: true,
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isDonation: boolean("is_donation").default(false),
  donationAmount: integer("donation_amount"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  streamId: true,
  userId: true,
  message: true,
  isDonation: true,
  donationAmount: true,
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  streamId: integer("stream_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertDonationSchema = createInsertSchema(donations).pick({
  streamId: true,
  userId: true,
  amount: true,
  message: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStream = z.infer<typeof insertStreamSchema>;
export type Stream = typeof streams.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Donation = typeof donations.$inferSelect;

// Client-focused types
export type ClientUser = {
  id: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

export type ClientStream = {
  id: number;
  userId: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  isLive: boolean;
  viewerCount: number;
  startedAt?: string;
  streamer?: ClientUser;
};

export type ClientChatMessage = {
  id: number;
  streamId: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
  isDonation: boolean;
  donationAmount?: number;
};
