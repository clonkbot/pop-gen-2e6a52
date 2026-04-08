import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Video posts in the feed
  videos: defineTable({
    userId: v.id("users"),
    username: v.string(),
    prompt: v.string(),
    storageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    status: v.union(v.literal("generating"), v.literal("completed"), v.literal("failed")),
    createdAt: v.number(),
    likes: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Likes tracking
  likes: defineTable({
    userId: v.id("users"),
    videoId: v.id("videos"),
    createdAt: v.number(),
  })
    .index("by_user_video", ["userId", "videoId"])
    .index("by_video", ["videoId"]),

  // User profiles
  profiles: defineTable({
    userId: v.id("users"),
    username: v.string(),
    avatarColor: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"]),
});
