import { useConvexAuth, useQuery, useMutation, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { Id } from "../convex/_generated/dataModel";

// Types
interface Video {
  _id: Id<"videos">;
  userId: Id<"users">;
  username: string;
  prompt: string;
  storageId?: Id<"_storage">;
  videoUrl?: string;
  status: "generating" | "completed" | "failed";
  createdAt: number;
  likes: number;
}

interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;
  username: string;
  avatarColor: string;
  createdAt: number;
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 border-4 border-black font-mono text-sm animate-slide-in ${
        type === "error" ? "bg-[#FF1493] text-white" : "bg-[#00FF7F] text-black"
      }`}
    >
      <div className="flex items-center gap-3">
        <span>{type === "error" ? "[!]" : "[+]"}</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">[X]</button>
      </div>
    </div>
  );
}

// Auth Form
function AuthForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signUp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Wrong email or password" : "Could not create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            POP<span className="text-[#FF1493]">-</span>GEN
          </h1>
          <div className="mt-2 h-2 bg-black w-32 mx-auto"></div>
          <p className="mt-4 font-mono text-sm tracking-wide">
            // AI VIDEO GENERATOR FOR KIDS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="border-4 border-black bg-white p-6 md:p-8">
          <div className="space-y-4">
            <div>
              <label className="font-mono text-xs tracking-wider block mb-2">EMAIL_</label>
              <input
                name="email"
                type="email"
                required
                className="w-full border-4 border-black p-3 font-mono text-sm focus:outline-none focus:border-[#00FFFF] transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-wider block mb-2">PASSWORD_</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full border-4 border-black p-3 font-mono text-sm focus:outline-none focus:border-[#00FFFF] transition-colors"
                placeholder="******"
              />
            </div>
            <input name="flow" type="hidden" value={flow} />

            {error && (
              <div className="bg-[#FF1493] text-white p-3 font-mono text-sm border-4 border-black">
                [ERROR] {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-mono text-sm py-4 hover:bg-[#333] transition-colors disabled:opacity-50 border-4 border-black"
            >
              {isLoading ? "PROCESSING..." : flow === "signIn" ? ">> SIGN_IN" : ">> CREATE_ACCOUNT"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            className="w-full mt-4 font-mono text-xs underline hover:text-[#FF1493] transition-colors"
          >
            {flow === "signIn" ? "Need an account? SIGN_UP" : "Have an account? SIGN_IN"}
          </button>
        </form>

        {/* Anonymous */}
        <button
          onClick={() => signIn("anonymous")}
          className="w-full mt-4 border-4 border-dashed border-black bg-[#FFFF00] p-4 font-mono text-sm hover:bg-[#FFE500] transition-colors"
        >
          [GUEST_MODE] // CONTINUE WITHOUT ACCOUNT
        </button>
      </div>
    </div>
  );
}

// Username Setup
function UsernameSetup({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const createProfile = useMutation(api.profiles.createOrUpdate);
  const isAvailable = useQuery(api.profiles.isUsernameAvailable, username.length >= 3 ? { username } : "skip");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || username.length < 3) return;
    setIsChecking(true);
    try {
      await createProfile({ username });
      onComplete();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md border-4 border-black bg-white p-6 md:p-8">
        <h2 className="font-display text-2xl font-bold mb-6">CHOOSE YOUR NAME</h2>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl text-[#FF1493]">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="w-full border-4 border-black p-4 pl-10 font-mono text-lg focus:outline-none focus:border-[#00FFFF] transition-colors"
              placeholder="coolkid123"
              minLength={3}
              maxLength={20}
            />
          </div>
          {username.length >= 3 && (
            <div className={`mt-2 font-mono text-xs ${isAvailable ? "text-green-600" : "text-[#FF1493]"}`}>
              {isAvailable === undefined ? "// checking..." : isAvailable ? "// available!" : "// taken :("}
            </div>
          )}
          <button
            type="submit"
            disabled={!isAvailable || username.length < 3 || isChecking}
            className="w-full mt-6 bg-black text-white font-mono py-4 hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-4 border-black"
          >
            {isChecking ? "SAVING..." : ">> START_CREATING"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Video Card Component
function VideoCard({ video, userLikes }: { video: Video; userLikes: Id<"videos">[] }) {
  const toggleLike = useMutation(api.videos.toggleLike);
  const [isLiking, setIsLiking] = useState(false);
  const hasLiked = userLikes.includes(video._id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await toggleLike({ videoId: video._id });
    } finally {
      setIsLiking(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <article className="border-4 border-black bg-white mb-4 animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-3 border-black flex items-center justify-center font-mono text-xs font-bold bg-[#FFFF00]">
            {video.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-mono text-sm font-bold">@{video.username}</span>
            <span className="font-mono text-xs text-gray-500 ml-2">{timeAgo(video.createdAt)}</span>
          </div>
        </div>
        <div className="font-mono text-xs px-2 py-1 bg-[#00FFFF] border-2 border-black">
          {video.status === "generating" ? "GENERATING" : video.status === "completed" ? "READY" : "FAILED"}
        </div>
      </div>

      {/* Prompt */}
      <div className="px-4 py-3 border-b-4 border-black bg-[#F5F5F0]">
        <p className="font-mono text-sm">&gt; {video.prompt}</p>
      </div>

      {/* Video Area */}
      <div className="aspect-video bg-black relative overflow-hidden">
        {video.status === "generating" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-[#FF1493] animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="font-mono text-white text-sm animate-blink">GENERATING_VIDEO...</p>
            <p className="font-mono text-gray-500 text-xs mt-2">// this may take 1-2 minutes</p>
          </div>
        )}
        {video.status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
            <div className="text-4xl mb-4">[X]</div>
            <p className="font-mono text-white text-sm">GENERATION_FAILED</p>
            <p className="font-mono text-gray-500 text-xs mt-2">// try a different prompt</p>
          </div>
        )}
        {video.status === "completed" && video.videoUrl && (
          <>
            <video
              ref={videoRef}
              src={video.videoUrl}
              className="w-full h-full object-contain"
              loop
              playsInline
              onClick={togglePlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white border-4 border-black flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-black border-b-[12px] border-b-transparent ml-1" />
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center gap-6">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 font-mono text-sm transition-colors ${
            hasLiked ? "text-[#FF1493]" : "hover:text-[#FF1493]"
          }`}
        >
          <span className="text-xl">{hasLiked ? "♥" : "♡"}</span>
          <span>{video.likes}</span>
        </button>
        <button className="font-mono text-sm hover:text-[#00FFFF] transition-colors flex items-center gap-2">
          <span className="text-xl">↗</span>
          <span className="hidden sm:inline">SHARE</span>
        </button>
      </div>
    </article>
  );
}

// Create Post Form
function CreatePostForm({ profile, onToast }: { profile: Profile; onToast: (msg: string, type: "success" | "error") => void }) {
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createVideo = useMutation(api.videos.create);
  const generateVideo = useAction(api.videos.generateAndSave);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const videoId = await createVideo({ prompt: prompt.trim(), username: profile.username });
      onToast("Video generation started!", "success");
      setPrompt("");

      // Trigger generation in background
      generateVideo({ videoId, prompt: prompt.trim() }).catch(() => {
        onToast("Video generation failed", "error");
      });
    } catch {
      onToast("Could not start generation", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const suggestions = [
    "a dancing robot",
    "a flying unicorn",
    "a silly cat chef",
    "dinosaurs at a party",
    "space puppies",
  ];

  return (
    <form onSubmit={handleSubmit} className="border-4 border-black bg-white mb-6">
      <div className="p-4 border-b-4 border-black bg-[#FFFF00]">
        <span className="font-mono text-sm font-bold">// CREATE_NEW_VIDEO</span>
      </div>
      <div className="p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your Pixar-style video..."
          className="w-full border-4 border-black p-4 font-mono text-sm resize-none h-24 focus:outline-none focus:border-[#00FFFF] transition-colors"
          maxLength={200}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPrompt(s)}
              className="px-3 py-1 border-2 border-black font-mono text-xs hover:bg-[#00FFFF] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="font-mono text-xs text-gray-500">{prompt.length}/200</span>
          <button
            type="submit"
            disabled={!prompt.trim() || isCreating}
            className="bg-black text-white px-6 py-3 font-mono text-sm hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-4 border-black"
          >
            {isCreating ? "CREATING..." : ">> GENERATE_VIDEO"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Main Feed
function Feed({ profile, onToast }: { profile: Profile; onToast: (msg: string, type: "success" | "error") => void }) {
  const { signOut } = useAuthActions();
  const videos = useQuery(api.videos.list);
  const userLikes = useQuery(api.videos.getUserLikes) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
            POP<span className="text-[#FF1493]">-</span>GEN
          </h1>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="font-mono text-xs md:text-sm hidden sm:inline">@{profile.username}</span>
            <button
              onClick={() => signOut()}
              className="font-mono text-xs px-3 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              [EXIT]
            </button>
          </div>
        </div>
      </header>

      {/* Grid lines decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: "linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <CreatePostForm profile={profile} onToast={onToast} />

        {/* Feed */}
        <div>
          {videos === undefined ? (
            <div className="border-4 border-black bg-white p-8 text-center">
              <div className="animate-pulse font-mono text-sm">LOADING_FEED...</div>
            </div>
          ) : videos.length === 0 ? (
            <div className="border-4 border-dashed border-black bg-white p-8 text-center">
              <div className="text-4xl mb-4">[</div>
              <p className="font-mono text-sm">NO_VIDEOS_YET</p>
              <p className="font-mono text-xs text-gray-500 mt-2">// be the first to create!</p>
              <div className="text-4xl mt-4">]</div>
            </div>
          ) : (
            videos.map((video: Video) => (
              <VideoCard key={video._id} video={video} userLikes={userLikes} />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-white py-4 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-mono text-xs text-gray-400">
            Requested by @web-user · Built by @clonkbot
          </p>
        </div>
      </footer>
    </div>
  );
}

// Main App
export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getMyProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (profile !== undefined) {
      setProfileLoaded(true);
    }
  }, [profile]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold mb-4">
            POP<span className="text-[#FF1493]">-</span>GEN
          </h1>
          <div className="font-mono text-sm animate-blink">LOADING...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Profile loading
  if (!profileLoaded || profile === undefined) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="font-mono text-sm animate-blink">LOADING_PROFILE...</div>
      </div>
    );
  }

  // Need to set up username
  if (!profile) {
    return <UsernameSetup onComplete={() => setProfileLoaded(false)} />;
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Feed profile={profile} onToast={showToast} />
    </>
  );
}
