import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Get all videos for the feed, most recent first
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

// Get a single video
export const get = query({
  args: { id: v.id("videos") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new video post (starts in "generating" status)
export const create = mutation({
  args: { prompt: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const videoId = await ctx.db.insert("videos", {
      userId,
      username: args.username,
      prompt: args.prompt,
      status: "generating",
      createdAt: Date.now(),
      likes: 0,
    });

    return videoId;
  },
});

// Update video with generated content
export const updateWithVideo = internalMutation({
  args: {
    videoId: v.id("videos"),
    storageId: v.optional(v.id("_storage")),
    videoUrl: v.optional(v.string()),
    status: v.union(v.literal("completed"), v.literal("failed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.videoId, {
      storageId: args.storageId,
      videoUrl: args.videoUrl,
      status: args.status,
    });
  },
});

// Generate video action
export const generateAndSave = action({
  args: { videoId: v.id("videos"), prompt: v.string() },
  handler: async (ctx, args) => {
    try {
      // Enhance prompt for Pixar-style kids content
      const enhancedPrompt = `Pixar-style 3D animated short video for children: ${args.prompt}. Bright colors, expressive characters, fun and whimsical, suitable for kids, high quality animation.`;

      const result = await ctx.runAction(api.ai.generateVideo, {
        prompt: enhancedPrompt,
        aspectRatio: "16:9",
      });

      if (result && result.url) {
        await ctx.runMutation(internal.videos.updateWithVideo, {
          videoId: args.videoId,
          storageId: result.storageId,
          videoUrl: result.url,
          status: "completed",
        });
      } else {
        await ctx.runMutation(internal.videos.updateWithVideo, {
          videoId: args.videoId,
          status: "failed",
        });
      }
    } catch (error) {
      console.error("Video generation failed:", error);
      await ctx.runMutation(internal.videos.updateWithVideo, {
        videoId: args.videoId,
        status: "failed",
      });
    }
  },
});

// Toggle like on a video
export const toggleLike = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_video", (q) => q.eq("userId", userId).eq("videoId", args.videoId))
      .first();

    const video = await ctx.db.get(args.videoId);
    if (!video) throw new Error("Video not found");

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.videoId, { likes: Math.max(0, video.likes - 1) });
      return false;
    } else {
      await ctx.db.insert("likes", {
        userId,
        videoId: args.videoId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.videoId, { likes: video.likes + 1 });
      return true;
    }
  },
});

// Check if user liked a video
export const hasLiked = query({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_video", (q) => q.eq("userId", userId).eq("videoId", args.videoId))
      .first();

    return !!like;
  },
});

// Get user's likes
export const getUserLikes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_user_video")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    return likes.map((l) => l.videoId);
  },
});
