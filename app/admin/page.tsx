"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

type Feedback = {
  id: number;
  user_id: string | null;
  type: string;
  message: string;
  status: string;
  created_at: string;
};

type Stats = {
  users: number;
  goals: number;
  tasks: number;
  reviews: number;
};

const ADMIN_EMAILS = [
  "spadeellis20@gmail.com"
];

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [stats, setStats] = useState<Stats>({ users: 0, goals: 0, tasks: 0, reviews: 0 });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("open");
  const [mobileNav, setMobileNav] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function verifyAdminAndLoad() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        const email = user.email || "";
        setUserEmail(email);

        if (!ADMIN_EMAILS.includes(email)) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // 1. Fetch Global Stats via RPC
        try {
          const { data: statsData, error: statsError } = await supabase.rpc("get_admin_stats");
          if (statsError) throw statsError;
          setStats(statsData);
        } catch (err) {
          console.warn("RPC get_admin_stats is missing or failed. Falling back to client-side metrics.");
          setRpcError(true);
        }

        // 2. Fetch User Profiles
        const { data: profilesData, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (pError) throw pError;
        setProfiles(profilesData || []);

        if (rpcError) {
          setStats(prev => ({ ...prev, users: profilesData?.length || 0 }));
        }

        // 3. Fetch Feedback Submissions
        const { data: feedbackData, error: fError } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false });

        if (fError) {
          console.warn("Feedback table or policies missing status/permission details:", fError);
        } else {
          setFeedback(feedbackData || []);
        }

      } catch (error) {
        console.error("Error loading admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    verifyAdminAndLoad();
  }, [router, rpcError]);

  const handleToggleResolve = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "resolved" ? "open" : "resolved";
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : "Ensure you have executed the create-admin-rpc.sql migration."}`);
    }
  };

  const getFeedbackBadgeColor = (type: string) => {
    switch (type) {
      case "bug": return "bg-rust/15 text-rust border-rust/20";
      case "feature_request": return "bg-sage/15 text-sage border-sage/20";
      case "aesthetic": return "bg-blue-400/15 text-blue-400 border-blue-400/20";
      default: return "bg-stone/15 text-stone border-stone/20";
    }
  };

  const getFeedbackLabel = (type: string) => {
    switch (type) {
      case "bug": return "🐛 Bug";
      case "feature_request": return "💡 Idea";
      case "aesthetic": return "🎨 Critique";
      default: return "💬 General";
    }
  };

  // Filter feedback
  const filteredFeedback = feedback.filter(f => {
    const matchesCategory = feedbackFilter === "all" || f.type === feedbackFilter;
    // Status is 'open' by default if not set
    const currentStatus = f.status || "open";
    const matchesStatus = feedbackStatusFilter === "all" || currentStatus === feedbackStatusFilter;
    return matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rust border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-stone/50 uppercase">Loading Founder Panel...</p>
        </div>
      </main>
    );
  }

  if (isAdmin === false) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="bg-[#232419] border border-stone/15 p-8 rounded-2xl max-w-md shadow-2xl">
          <span className="text-4xl">🛡️</span>
          <h2 className="text-xl font-black text-rust mt-4 mb-2 tracking-tight">Founder Access Only</h2>
          <p className="text-xs text-stone/60 leading-relaxed mb-6">
            This administration board is strictly reserved for authenticated founders of Echo AI.<br />
            Logged in as: <span className="font-semibold text-stone">{userEmail}</span>
          </p>
          <Link href="/" className="px-5 py-2.5 bg-stone/5 hover:bg-stone/10 border border-stone/10 rounded-xl text-xs font-bold transition duration-150 inline-block">
            ← Return to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      <Sidebar activeTab="admin" />

      <section className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation Header */}
        <div className="md:hidden p-4 border-b border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setMobileNav(!mobileNav)}
            className="text-2xl cursor-pointer text-zinc-400 hover:text-white transition"
          >
            ☰
          </button>
          {mobileNav && (
            <nav className="mt-4 flex flex-wrap gap-2">
              <Link href="/" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Dashboard</Link>
              <Link href="/areas" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Areas</Link>
              <Link href="/goals" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Goals</Link>
              <Link href="/tasks" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Tasks</Link>
              <Link href="/courses" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Courses</Link>
              <Link href="/projects" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Projects</Link>
              <Link href="/weekly-reviews" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Weekly Reviews</Link>
              <Link href="/analytics" className="px-3 py-1.5 hover:bg-zinc-900 rounded-lg text-sm text-zinc-400">Analytics</Link>
            </nav>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                <span>🛡️</span> Founder Dashboard
              </h1>
              <p className="text-zinc-400 text-sm">
                Real-time visibility into active product usage, user feedback, and adoption health.
              </p>
            </div>
            {rpcError && (
              <div className="bg-rust/10 border border-rust/20 px-4 py-2.5 rounded-xl text-[10px] text-rust font-semibold leading-relaxed shrink-0 max-w-xs">
                ⚠️ DB stats function missing. Run the <span className="underline">create-admin-rpc.sql</span> script in Supabase SQL editor to enable all counts.
              </div>
            )}
          </header>

          {/* Usage Metrics Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#232419]/30 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between shadow-sm shadow-[#24251a]/40 hover:bg-[#232419]/50 transition duration-200">
              <h3 className="text-xs font-bold text-stone/50 uppercase tracking-wider mb-2">Total Users</h3>
              <p className="text-3xl font-black text-rust tracking-tight">{stats.users || profiles.length}</p>
            </div>

            <div className="bg-[#232419]/30 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between shadow-sm shadow-[#24251a]/40 hover:bg-[#232419]/50 transition duration-200">
              <h3 className="text-xs font-bold text-stone/50 uppercase tracking-wider mb-2">Goals Tracked</h3>
              <p className="text-3xl font-black text-sage tracking-tight">{rpcError ? "N/A" : stats.goals}</p>
            </div>

            <div className="bg-[#232419]/30 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between shadow-sm shadow-[#24251a]/40 hover:bg-[#232419]/50 transition duration-200">
              <h3 className="text-xs font-bold text-stone/50 uppercase tracking-wider mb-2">Tasks Logged</h3>
              <p className="text-3xl font-black text-stone tracking-tight">{rpcError ? "N/A" : stats.tasks}</p>
            </div>

            <div className="bg-[#232419]/30 border border-stone/10 p-5 rounded-2xl flex flex-col justify-between shadow-sm shadow-[#24251a]/40 hover:bg-[#232419]/50 transition duration-200">
              <h3 className="text-xs font-bold text-stone/50 uppercase tracking-wider mb-2">Reviews Run</h3>
              <p className="text-3xl font-black text-blue-400 tracking-tight">{rpcError ? "N/A" : stats.reviews}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Content Area (Feedback) - Span 2 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-stone/3 border border-stone/10 p-6 rounded-2xl shadow-sm shadow-[#24251a]/30">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h2 className="text-lg font-black tracking-tight text-stone flex items-center gap-1.5">
                    <span>💡</span> Recent Feedback & Bug Reports ({filteredFeedback.length})
                  </h2>

                  {/* Filter Controls */}
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={feedbackStatusFilter}
                      onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-earth border border-stone/15 rounded-lg text-[10px] font-bold text-stone outline-none cursor-pointer"
                    >
                      <option value="all">All States</option>
                      <option value="open">🟢 Open</option>
                      <option value="resolved">🔘 Resolved</option>
                    </select>

                    <select
                      value={feedbackFilter}
                      onChange={(e) => setFeedbackFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-earth border border-stone/15 rounded-lg text-[10px] font-bold text-stone outline-none cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="bug">🐛 Bug</option>
                      <option value="feature_request">💡 Idea</option>
                      <option value="aesthetic">🎨 Critique</option>
                      <option value="other">💬 General</option>
                    </select>
                  </div>
                </div>

                {/* Submissions List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {filteredFeedback.map(item => {
                    const sender = profiles.find(p => p.id === item.user_id);
                    const isResolved = item.status === "resolved";
                    return (
                      <div key={item.id} className={`p-4 bg-earth rounded-xl border transition-all ${isResolved ? "opacity-60 border-stone/5" : "border-stone/10"}`}>
                        <div className="flex justify-between items-start gap-4 mb-2.5">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-extrabold uppercase tracking-wide ${getFeedbackBadgeColor(item.type)}`}>
                              {getFeedbackLabel(item.type)}
                            </span>
                            <span className="text-[10px] text-stone/40">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Toggle Action */}
                          <button
                            onClick={() => handleToggleResolve(item.id, item.status || "open")}
                            className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition cursor-pointer select-none ${
                              isResolved 
                                ? "bg-stone/5 text-stone/55 border-stone/10 hover:bg-stone/10" 
                                : "bg-rust/10 text-rust border-rust/15 hover:bg-rust/20"
                            }`}
                          >
                            {isResolved ? "Re-open" : "Mark Resolved ✓"}
                          </button>
                        </div>
                        <p className="text-xs text-stone leading-relaxed font-medium mb-3 select-all whitespace-pre-wrap">
                          {item.message}
                        </p>
                        <div className="text-[10px] text-stone/40 border-t border-stone/5 pt-2 flex items-center gap-1">
                          <span>User:</span> 
                          <span className="font-bold text-stone/70">
                            {sender ? `@${sender.username} (${sender.email})` : "Anonymous"}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredFeedback.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-stone/10 rounded-2xl bg-earth/20">
                      <span className="text-2xl text-stone/30 select-none">✓</span>
                      <p className="text-xs text-stone/40 mt-2 font-semibold">No matching feedback found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Content Area (Users Registry) - Span 1 */}
            <div className="lg:col-span-1">
              <div className="bg-stone/3 border border-stone/10 p-6 rounded-2xl h-full flex flex-col shadow-sm shadow-[#24251a]/30">
                <div className="mb-6">
                  <h2 className="text-lg font-black tracking-tight text-stone flex items-center gap-1.5">
                    <span>👥</span> User Registry ({profiles.length})
                  </h2>
                  <p className="text-[11px] text-stone/40 leading-none mt-1">Recent founder/friend onboardings</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[500px]">
                  {profiles.map(p => (
                    <div key={p.id} className="p-3 bg-earth rounded-xl border border-stone/5 hover:border-stone/10 transition flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-rust to-sage rounded-full text-earth font-black text-xs shrink-0 select-none">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone truncate capitalize">@{p.username}</p>
                        <p className="text-[10px] text-stone/45 truncate mt-0.5">{p.email}</p>
                        <p className="text-[8px] text-stone/30 font-semibold tracking-wide uppercase mt-1">
                          Joined: {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>
    </main>
  );
}
