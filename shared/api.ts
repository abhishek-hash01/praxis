/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/** Demo endpoint example */
export interface DemoResponse {
  message: string;
}

/* Praxis shared types */
export type ID = string;

export interface SkillTag {
  id: ID;
  name: string;
}

export interface User {
  id: ID;
  name: string;
  avatarUrl?: string;
  bio?: string;
  teaches: SkillTag[];
  learns: SkillTag[];
  location?: string;
}

export interface Review {
  id: ID;
  author: Pick<User, "id" | "name" | "avatarUrl">;
  rating: number; // 1-5
  text: string;
  date: string; // ISO
}

export interface Connection {
  id: ID;
  users: [User, User];
  createdAt: string; // ISO
  lastMessagePreview?: string;
}

export interface Message {
  id: ID;
  threadId: ID;
  fromUserId: ID;
  toUserId: ID;
  text: string;
  sentAt: string; // ISO
}

export interface ChatThread {
  id: ID;
  connectionId: ID;
  participants: [User, User];
  messages: Message[];
}

export interface Settings {
  notificationsEmail: boolean;
  notificationsPush: boolean;
  profileVisibility: "public" | "connections" | "private";
  theme: "dark" | "system";
}
