import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const AVATAR_COLORS = [
  "#FF1493", // Hot Pink
  "#00FFFF", // Cyan
  "#FFFF00", // Electric Yellow
  "#FF6B35", // Orange
  "#7B68EE", // Medium Slate Blue
  "#00FF7F", // Spring Green
  "#FF4500", // Orange Red
  "#1E90FF", // Dodger Blue
];

// Get current user's profile
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

// Create or update profile
export const createOrUpdate = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { username: args.username });
      return existing._id;
    }

    // Pick a random avatar color
    const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    return await ctx.db.insert("profiles", {
      userId,
      username: args.username,
      avatarColor,
      createdAt: Date.now(),
    });
  },
});

// Check if username is available
export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    // Available if no one has it, or if it's the current user's username
    return !existing || (userId && existing.userId === userId);
  },
});
