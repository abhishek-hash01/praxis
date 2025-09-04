import type { User, SkillTag, Connection, ChatThread, Message, Settings, Review, ID } from "./api";

const id = (p: string, i: number) => `${p}_${i}` as ID;

export const skills: SkillTag[] = [
  { id: id("skill", 1), name: "React" },
  { id: id("skill", 2), name: "Tailwind" },
  { id: id("skill", 3), name: "UX Research" },
  { id: id("skill", 4), name: "3D Modeling" },
  { id: id("skill", 5), name: "Copywriting" },
  { id: id("skill", 6), name: "TypeScript" },
  { id: id("skill", 7), name: "Figma" },
];

export const mockUser: User = {
  id: id("user", 1),
  name: "Avery Park",
  avatarUrl: undefined,
  bio: "Full‑stack dev swapping React for UX research.",
  teaches: [skills[0], skills[1], skills[5]],
  learns: [skills[2], skills[6]],
  location: "Remote",
};

export const discoverUsers: User[] = [];

export const reviews: Review[] = [
  {
    id: id("rev", 1),
    author: { id: id("user", 5), name: "Leo", avatarUrl: undefined },
    rating: 5,
    text: "Incredibly clear explanations and patient coaching.",
    date: new Date().toISOString(),
  },
  {
    id: id("rev", 2),
    author: { id: id("user", 6), name: "Nora", avatarUrl: undefined },
    rating: 4,
    text: "Great swap! Learned a lot quickly.",
    date: new Date().toISOString(),
  },
];

export const connections: Connection[] = [];

const mkMsg = (i: number, t: Partial<Message>): Message => ({
  id: id("msg", i),
  threadId: id("thread", 1),
  fromUserId: t.fromUserId!,
  toUserId: t.toUserId!,
  text: t.text || "",
  sentAt: t.sentAt || new Date().toISOString(),
});

export const threads: ChatThread[] = [];

export const mockSettings: Settings = {
  notificationsEmail: true,
  notificationsPush: true,
  profileVisibility: "public",
  theme: "dark",
};
